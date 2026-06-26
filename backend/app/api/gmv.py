from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from datetime import date, timedelta
from app.database import get_db
from app.models.campaign import Campaign
from app.models.credential import PlatformCredential
from app.services.tiktok_ads import TikTokAdsClient
from app.services.tiktok_shop import TikTokShopClient
from app.services.crypto import decrypt_credentials
from app.middleware.auth import get_current_user

router = APIRouter()

def _get_clients(company_id: str, db: Session):
    ads_c = db.query(PlatformCredential).filter_by(company_id=company_id, platform="tiktok_ads").first()
    shop_c = db.query(PlatformCredential).filter_by(company_id=company_id, platform="tiktok_shop").first()
    if not ads_c or not shop_c:
        raise HTTPException(status_code=404, detail="TikTok credentials not configured")
    ac = decrypt_credentials(ads_c.credentials_encrypted)
    sc = decrypt_credentials(shop_c.credentials_encrypted)
    return (TikTokAdsClient(ac["access_token"], ac["advertiser_id"]),
            TikTokShopClient(sc["app_key"], sc["app_secret"], sc["access_token"], sc["shop_id"]))

@router.get("/campaigns")
def list_gmv(company_id: str = Query(...), period: int = Query(7), db: Session = Depends(get_db), _=Depends(get_current_user)):
    campaigns = db.query(Campaign).filter(Campaign.company_id == company_id, Campaign.type.in_(["gmv_product", "gmv_live"])).all()
    _, shop_client = _get_clients(company_id, db)
    today = date.today()
    start = today - timedelta(days=period)
    prev_start = start - timedelta(days=period)
    result = []
    for c in campaigns:
        m = shop_client.get_gmv_campaign_metrics(c.id, start.strftime("%Y-%m-%d"), today.strftime("%Y-%m-%d"))
        p = shop_client.get_gmv_campaign_metrics(c.id, prev_start.strftime("%Y-%m-%d"), (start - timedelta(days=1)).strftime("%Y-%m-%d"))
        result.append({"id": c.id, "company_id": c.company_id, "name": c.name, "type": c.type,
                        "status": c.status, "budget_daily": c.budget_daily, "budget_spend": c.budget_spend,
                        "metrics": m, "prev_metrics": p, "alert_config": c.alert_config or {}})
    return result

@router.patch("/campaigns/{campaign_id}/status")
def update_status(campaign_id: str, status: str = Query(...), db: Session = Depends(get_db), _=Depends(get_current_user)):
    campaign = db.query(Campaign).filter_by(id=campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404)
    ads_client, _ = _get_clients(campaign.company_id, db)
    ads_client.update_campaign_status(campaign_id, "ENABLE" if status == "active" else "DISABLE")
    campaign.status = status
    db.commit()
    return {"status": status}

@router.patch("/campaigns/{campaign_id}/budget")
def update_budget(campaign_id: str, budget: float = Query(...), db: Session = Depends(get_db), _=Depends(get_current_user)):
    campaign = db.query(Campaign).filter_by(id=campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404)
    ads_client, _ = _get_clients(campaign.company_id, db)
    ads_client.update_campaign_budget(campaign_id, budget)
    campaign.budget_daily = budget
    db.commit()
    return {"budget_daily": budget}
