from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from datetime import date, timedelta
from app.database import get_db
from app.models.campaign import Campaign, CampaignMetrics
from app.models.credential import PlatformCredential
from app.services.tiktok_shop import TikTokShopClient
from app.services.crypto import decrypt_credentials
from app.middleware.auth import get_current_user
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

def _agg_gmv(campaign_id: str, db: Session, period: int, offset: int) -> dict:
    today = date.today()
    end = today - timedelta(days=offset)
    start = end - timedelta(days=period - 1)
    rows = db.query(CampaignMetrics).filter(
        CampaignMetrics.campaign_id == campaign_id,
        CampaignMetrics.date >= start.strftime("%Y-%m-%d"),
        CampaignMetrics.date <= end.strftime("%Y-%m-%d"),
    ).all()
    if not rows:
        return {"cost": 0, "sku_orders": 0, "cost_per_order": 0, "gross_revenue": 0, "roi": 0}
    cost = sum(r.cost or r.spend or 0 for r in rows)
    orders = sum(r.sku_orders or 0 for r in rows)
    revenue = sum(r.gross_revenue or 0 for r in rows)
    n = len(rows)
    return {
        "cost": cost,
        "sku_orders": orders,
        "cost_per_order": cost / orders if orders else 0,
        "gross_revenue": revenue,
        "roi": sum(r.roi or 0 for r in rows) / n if n else 0,
    }

@router.get("/campaigns")
def list_gmv(company_id: str = Query(...), period: int = Query(7), db: Session = Depends(get_db), _=Depends(get_current_user)):
    campaigns = db.query(Campaign).filter(
        Campaign.company_id == company_id,
        Campaign.type.in_(["gmv_product", "gmv_live"])
    ).all()
    result = []
    for c in campaigns:
        m = _agg_gmv(c.id, db, period, 0)
        p = _agg_gmv(c.id, db, period, period)
        result.append({
            "id": c.id, "company_id": c.company_id, "name": c.name, "type": c.type,
            "status": c.status, "budget_daily": c.budget_daily, "budget_spend": c.budget_spend,
            "metrics": m, "prev_metrics": p, "alert_config": c.alert_config or {},
        })
    return result

@router.patch("/campaigns/{campaign_id}/status")
def update_status(campaign_id: str, status: str = Query(...), db: Session = Depends(get_db), _=Depends(get_current_user)):
    campaign = db.query(Campaign).filter_by(id=campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404)
    shop_c = db.query(PlatformCredential).filter_by(company_id=campaign.company_id, platform="tiktok_shop").first()
    if not shop_c:
        raise HTTPException(status_code=400, detail="TikTok Shop credentials not configured")
    sc = decrypt_credentials(shop_c.credentials_encrypted)
    shop_client = TikTokShopClient(sc["app_key"], sc["app_secret"], sc["access_token"], sc["shop_id"])
    # TikTok Shop API: ENABLE / DISABLE
    shop_status = "ENABLE" if status == "active" else "DISABLE"
    try:
        shop_client._post("/api/v2/promotion/campaign/status/update", {
            "campaign_id": campaign_id, "operation": shop_status
        })
    except Exception as e:
        logger.error(f"GMV status update error {campaign_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    campaign.status = status
    db.commit()
    return {"status": status}

@router.patch("/campaigns/{campaign_id}/budget")
def update_budget(campaign_id: str, budget: float = Query(...), db: Session = Depends(get_db), _=Depends(get_current_user)):
    campaign = db.query(Campaign).filter_by(id=campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404)
    campaign.budget_daily = budget
    db.commit()
    return {"budget_daily": budget}
