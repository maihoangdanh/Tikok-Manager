from apscheduler.schedulers.background import BackgroundScheduler
from datetime import date, timedelta, datetime
from app.database import SessionLocal
from app.models.company import Company
from app.models.campaign import Campaign, CampaignMetrics
from app.models.creative import Creative
from app.models.credential import PlatformCredential
from app.services.tiktok_ads import TikTokAdsClient
from app.services.tiktok_shop import TikTokShopClient
from app.services.crypto import decrypt_credentials
from app.services.alert_engine import evaluate_campaign
import logging

logger = logging.getLogger(__name__)
scheduler = BackgroundScheduler()

def sync_all():
    db = SessionLocal()
    try:
        for company in db.query(Company).all():
            try:
                _sync_company(db, company)
            except Exception as e:
                logger.error(f"Sync failed {company.id}: {e}")
    finally:
        db.close()

def _sync_company(db, company):
    ads_cred = db.query(PlatformCredential).filter_by(company_id=company.id, platform="tiktok_ads").first()
    shop_cred = db.query(PlatformCredential).filter_by(company_id=company.id, platform="tiktok_shop").first()
    if not ads_cred or not shop_cred:
        return
    ac = decrypt_credentials(ads_cred.credentials_encrypted)
    sc = decrypt_credentials(shop_cred.credentials_encrypted)
    ads_client = TikTokAdsClient(ac["access_token"], ac["advertiser_id"])
    shop_client = TikTokShopClient(sc["app_key"], sc["app_secret"], sc["access_token"], sc["shop_id"])
    today = date.today()
    start = today - timedelta(days=7)

    for campaign in db.query(Campaign).filter(Campaign.company_id == company.id, Campaign.type == "standard").all():
        try:
            for row in ads_client.get_campaign_metrics(campaign.id, start, today):
                day = row["dimensions"]["stat_time_day"][:10]
                m = row["metrics"]
                rec = db.query(CampaignMetrics).filter_by(campaign_id=campaign.id, date=day).first()
                if not rec:
                    rec = CampaignMetrics(campaign_id=campaign.id, date=day)
                    db.add(rec)
                rec.spend = float(m.get("spend", 0))
                rec.roas = float(m.get("real_time_roas", 0))
                rec.impressions = int(m.get("impressions", 0))
                rec.clicks = int(m.get("clicks", 0))
                rec.ctr = float(m.get("ctr", 0))
                rec.cpc = float(m.get("cpc", 0))
                rec.conversions = int(m.get("conversion", 0))
                rec.cpa = rec.spend / rec.conversions if rec.conversions else 0
            campaign.last_synced_at = datetime.utcnow()
            evaluate_campaign(db, campaign, {"roas": 0, "cpc": 0}, {})
        except Exception as e:
            logger.error(f"Standard sync {campaign.id}: {e}")

    for campaign in db.query(Campaign).filter(Campaign.company_id == company.id, Campaign.type.in_(["gmv_product", "gmv_live"])).all():
        try:
            m = shop_client.get_gmv_campaign_metrics(campaign.id, start.strftime("%Y-%m-%d"), today.strftime("%Y-%m-%d"))
            p = shop_client.get_gmv_campaign_metrics(campaign.id, (start - timedelta(days=7)).strftime("%Y-%m-%d"), (start - timedelta(days=1)).strftime("%Y-%m-%d"))
            campaign.last_synced_at = datetime.utcnow()
            evaluate_campaign(db, campaign, m, p)
            if campaign.type == "gmv_product":
                for cr_data in shop_client.list_creatives(campaign.id):
                    cr_id = cr_data.get("creative_id") or cr_data.get("material_id", "")
                    cr = db.query(Creative).filter_by(id=cr_id).first()
                    if not cr:
                        cr = Creative(id=cr_id, campaign_id=campaign.id, name=cr_data.get("name", cr_id[:8]))
                        db.add(cr)
                    cr.status = "active" if cr_data.get("status") == "ENABLE" else "paused"
        except Exception as e:
            logger.error(f"GMV sync {campaign.id}: {e}")

    db.commit()

def start_scheduler():
    scheduler.add_job(sync_all, "interval", hours=1, id="sync_metrics", replace_existing=True)
    scheduler.start()
    logger.info("Sync scheduler started")
