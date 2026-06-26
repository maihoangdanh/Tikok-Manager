from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import date, timedelta
from app.database import get_db
from app.models.campaign import Campaign, CampaignMetrics
from app.models.credential import PlatformCredential
from app.services.tiktok_ads import TikTokAdsClient
from app.services.crypto import decrypt_credentials
from app.middleware.auth import get_current_user
import uuid

router = APIRouter()

class CampaignCreate(BaseModel):
    name: str
    type: str
    objective: Optional[str] = None
    budget_daily: float
    budget_type: str = "BUDGET_MODE_DAY"

class AlertConfigUpdate(BaseModel):
    alert_config: dict

def _get_ads_client(company_id: str, db: Session) -> TikTokAdsClient:
    cred = db.query(PlatformCredential).filter_by(company_id=company_id, platform="tiktok_ads").first()
    if not cred:
        raise HTTPException(status_code=404, detail="TikTok Ads credentials not configured")
    c = decrypt_credentials(cred.credentials_encrypted)
    return TikTokAdsClient(access_token=c["access_token"], advertiser_id=c["advertiser_id"])

@router.get("/")
def list_campaigns(company_id: str = Query(...), period: int = Query(7), db: Session = Depends(get_db), _=Depends(get_current_user)):
    campaigns = db.query(Campaign).filter(Campaign.company_id == company_id, Campaign.type == "standard").all()
    result = []
    for c in campaigns:
        m = _agg_std(c.id, db, period, 0)
        p = _agg_std(c.id, db, period, period)
        result.append({
            "id": c.id, "company_id": c.company_id, "name": c.name, "type": c.type,
            "status": c.status, "objective": c.objective,
            "budget_daily": c.budget_daily, "budget_spend": c.budget_spend,
            "metrics": m, "prev_metrics": p, "alert_config": c.alert_config or {},
        })
    return result

@router.patch("/{campaign_id}/status")
def update_status(campaign_id: str, status: str = Query(...), db: Session = Depends(get_db), _=Depends(get_current_user)):
    campaign = db.query(Campaign).filter_by(id=campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404)
    client = _get_ads_client(campaign.company_id, db)
    client.update_campaign_status(campaign_id, "ENABLE" if status == "active" else "DISABLE")
    campaign.status = status
    db.commit()
    return {"status": status}

@router.patch("/{campaign_id}/budget")
def update_budget(campaign_id: str, budget: float = Query(...), db: Session = Depends(get_db), _=Depends(get_current_user)):
    campaign = db.query(Campaign).filter_by(id=campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404)
    client = _get_ads_client(campaign.company_id, db)
    client.update_campaign_budget(campaign_id, budget)
    campaign.budget_daily = budget
    db.commit()
    return {"budget_daily": budget}

@router.patch("/{campaign_id}/alert-config")
def update_alert_config(campaign_id: str, data: AlertConfigUpdate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    campaign = db.query(Campaign).filter_by(id=campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404)
    campaign.alert_config = data.alert_config
    db.commit()
    return data.alert_config

@router.post("/")
def create_campaign(company_id: str = Query(...), data: CampaignCreate = ..., db: Session = Depends(get_db), _=Depends(get_current_user)):
    client = _get_ads_client(company_id, db)
    obj_map = {"conversions": "CONVERSIONS", "traffic": "VIDEO_VIEWS", "awareness": "REACH", "catalog_sales": "PRODUCT_SALES"}
    tid = client.create_campaign(data.name, obj_map.get(data.objective or "conversions", "CONVERSIONS"), data.budget_daily, data.budget_type)
    campaign = Campaign(id=tid, company_id=company_id, name=data.name, type=data.type,
                        status="active", objective=data.objective, budget_daily=data.budget_daily, budget_spend=0)
    db.add(campaign)
    db.commit()
    return {"campaign_id": tid}

def _agg_std(campaign_id: str, db: Session, period: int, offset: int) -> dict:
    today = date.today()
    end = today - timedelta(days=offset)
    start = end - timedelta(days=period - 1)
    rows = db.query(CampaignMetrics).filter(
        CampaignMetrics.campaign_id == campaign_id,
        CampaignMetrics.date >= start.strftime("%Y-%m-%d"),
        CampaignMetrics.date <= end.strftime("%Y-%m-%d"),
    ).all()
    if not rows:
        return {"spend": 0, "roas": 0, "impressions": 0, "clicks": 0, "ctr": 0, "cpc": 0, "conversions": 0, "cpa": 0}
    spend = sum(r.spend for r in rows)
    conv = sum(r.conversions for r in rows)
    n = len(rows)
    return {"spend": spend, "roas": sum(r.roas for r in rows) / n,
            "impressions": sum(r.impressions for r in rows), "clicks": sum(r.clicks for r in rows),
            "ctr": sum(r.ctr for r in rows) / n, "cpc": sum(r.cpc for r in rows) / n,
            "conversions": conv, "cpa": spend / conv if conv else 0}


@router.post("/sync")
def sync_now(company_id: str = Query(...), db: Session = Depends(get_db), _=Depends(get_current_user)):
    """Pull campaigns from TikTok Ads into DB, then sync metrics."""
    from app.models.credential import PlatformCredential
    from app.services.crypto import decrypt_credentials
    import uuid

    cred = db.query(PlatformCredential).filter_by(company_id=company_id, platform="tiktok_ads").first()
    if not cred:
        raise HTTPException(status_code=400, detail="TikTok Ads credentials not configured")

    c = decrypt_credentials(cred.credentials_encrypted)
    client = TikTokAdsClient(access_token=c["access_token"], advertiser_id=c["advertiser_id"])

    # Pull campaigns from TikTok
    tiktok_campaigns = client.list_campaigns()
    synced = 0
    for tc in tiktok_campaigns:
        existing = db.query(Campaign).filter_by(id=tc["campaign_id"]).first()
        if existing:
            existing.name = tc["campaign_name"]
            existing.status = "active" if tc["operation_status"] == "ENABLE" else "paused"
            existing.budget_daily = tc.get("budget", 0)
        else:
            db.add(Campaign(
                id=tc["campaign_id"], company_id=company_id,
                name=tc["campaign_name"], type="standard",
                status="active" if tc["operation_status"] == "ENABLE" else "paused",
                objective=tc.get("objective_type", "").lower(),
                budget_daily=tc.get("budget", 0), budget_spend=0,
            ))
        synced += 1
    db.commit()

    # Sync metrics for last 7 days
    from datetime import date, timedelta
    today = date.today()
    start = today - timedelta(days=6)
    for campaign in db.query(Campaign).filter(Campaign.company_id == company_id, Campaign.type == 'standard').all():
        try:
            rows = client.get_campaign_metrics(campaign.id, start, today)
            by_date = {}
            for row in rows:
                d = row.get('date') or row.get('dimensions', {}).get('stat_time_day', '')[:10]
                if not d:
                    continue
                m = row.get('metrics', row)
                if d not in by_date:
                    by_date[d] = {'spend': 0, 'impressions': 0, 'clicks': 0, 'conversions': 0, 'ctr_list': [], 'cpc_list': [], 'roas_list': []}
                by_date[d]['spend'] += float(m.get('spend', 0))
                by_date[d]['impressions'] += int(m.get('impressions', 0))
                by_date[d]['clicks'] += int(m.get('clicks', 0))
                by_date[d]['conversions'] += int(m.get('conversion', m.get('conversions', 0)))
                ctr = float(m.get('ctr', 0))
                cpc = float(m.get('cpc', 0))
                roas = float(m.get('real_time_roas', 0))
                if ctr: by_date[d]['ctr_list'].append(ctr)
                if cpc: by_date[d]['cpc_list'].append(cpc)
                if roas: by_date[d]['roas_list'].append(roas)
            for d, agg in by_date.items():
                vals = dict(
                    spend=agg['spend'],
                    impressions=agg['impressions'],
                    clicks=agg['clicks'],
                    conversions=agg['conversions'],
                    roas=sum(agg['roas_list']) / len(agg['roas_list']) if agg['roas_list'] else 0.0,
                    ctr=sum(agg['ctr_list']) / len(agg['ctr_list']) if agg['ctr_list'] else 0.0,
                    cpc=sum(agg['cpc_list']) / len(agg['cpc_list']) if agg['cpc_list'] else 0.0,
                    cpa=agg['spend'] / agg['conversions'] if agg['conversions'] else 0.0,
                )
                existing_m = db.query(CampaignMetrics).filter_by(campaign_id=campaign.id, date=d).first()
                if existing_m:
                    for k, v in vals.items():
                        setattr(existing_m, k, v)
                else:
                    db.add(CampaignMetrics(campaign_id=campaign.id, date=d, **vals))
            campaign.budget_spend = sum(v['spend'] for v in by_date.values())
        except Exception as e:
            import logging
            logging.getLogger(__name__).error(f'Metrics sync error {campaign.id}: {e}')
    db.commit()
    return {'synced_campaigns': synced}


@router.post('/gmv/sync')
def sync_gmv(company_id: str = Query(...), db: Session = Depends(get_db), _=Depends(get_current_user)):
    from app.models.credential import PlatformCredential
    from app.services.crypto import decrypt_credentials
    from app.services.tiktok_shop import TikTokShopClient
    from datetime import date, timedelta

    ads_cred = db.query(PlatformCredential).filter_by(company_id=company_id, platform='tiktok_ads').first()
    shop_cred = db.query(PlatformCredential).filter_by(company_id=company_id, platform='tiktok_shop').first()
    if not ads_cred or not shop_cred:
        raise HTTPException(status_code=400, detail='Both TikTok Ads and Shop credentials required')

    ac = decrypt_credentials(ads_cred.credentials_encrypted)
    sc = decrypt_credentials(shop_cred.credentials_encrypted)
    ads_client = TikTokAdsClient(access_token=ac['access_token'], advertiser_id=ac['advertiser_id'])
    shop_client = TikTokShopClient(sc['app_key'], sc['app_secret'], sc['access_token'], sc['shop_id'])

    today = date.today()
    start = today - timedelta(days=6)

    tiktok_campaigns = ads_client.list_campaigns()
    synced = 0
    for tc in tiktok_campaigns:
        obj = tc.get('objective_type', '').upper()
        if 'GMV' not in obj and 'PRODUCT_SALES' not in obj:
            continue
        camp_type = 'gmv_product'
        existing = db.query(Campaign).filter_by(id=tc['campaign_id']).first()
        if existing:
            existing.name = tc['campaign_name']
            existing.status = 'active' if tc['operation_status'] == 'ENABLE' else 'paused'
            existing.budget_daily = tc.get('budget', 0)
        else:
            db.add(Campaign(
                id=tc['campaign_id'], company_id=company_id,
                name=tc['campaign_name'], type=camp_type,
                status='active' if tc['operation_status'] == 'ENABLE' else 'paused',
                budget_daily=tc.get('budget', 0), budget_spend=0,
            ))
        synced += 1

        try:
            metrics = shop_client.get_gmv_campaign_metrics(tc['campaign_id'], start.strftime('%Y-%m-%d'), today.strftime('%Y-%m-%d'))
            # store as latest metrics row (single row for today)
            existing_m = db.query(CampaignMetrics).filter_by(campaign_id=tc['campaign_id'], date=today.strftime('%Y-%m-%d')).first()
            gmv_vals = dict(cost=metrics.get('cost', 0), sku_orders=metrics.get('sku_orders', 0),
                            cost_per_order=metrics.get('cost_per_order', 0),
                            gross_revenue=metrics.get('gross_revenue', 0), roi=metrics.get('roi', 0),
                            spend=metrics.get('cost', 0), roas=0, impressions=0, clicks=0, ctr=0, cpc=0, conversions=0, cpa=0)
            if existing_m:
                for k, v in gmv_vals.items():
                    setattr(existing_m, k, v)
            else:
                db.add(CampaignMetrics(campaign_id=tc['campaign_id'], date=today.strftime('%Y-%m-%d'), **gmv_vals))
        except Exception as e:
            import logging
            logging.getLogger(__name__).error(f'GMV metrics sync error {tc[campaign_id]}: {e}')

    db.commit()
    return {'synced_gmv_campaigns': synced}
