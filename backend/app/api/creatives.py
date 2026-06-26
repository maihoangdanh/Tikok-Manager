from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.creative import Creative
from app.models.campaign import Campaign
from app.models.credential import PlatformCredential
from app.services.tiktok_shop import TikTokShopClient
from app.services.crypto import decrypt_credentials
from app.middleware.auth import get_current_user

router = APIRouter()

def _get_shop(company_id: str, db: Session) -> TikTokShopClient:
    cred = db.query(PlatformCredential).filter_by(company_id=company_id, platform="tiktok_shop").first()
    if not cred:
        raise HTTPException(status_code=404, detail="TikTok Shop credentials not configured")
    c = decrypt_credentials(cred.credentials_encrypted)
    return TikTokShopClient(c["app_key"], c["app_secret"], c["access_token"], c["shop_id"])

@router.get("/{campaign_id}")
def list_creatives(campaign_id: str, db: Session = Depends(get_db), _=Depends(get_current_user)):
    creatives = db.query(Creative).filter_by(campaign_id=campaign_id).all()
    return [{"id": c.id, "campaign_id": c.campaign_id, "name": c.name, "status": c.status,
             "video_url": c.video_url,
             "metrics": {"cost": c.cost, "sku_orders": c.sku_orders, "cost_per_order": c.cost_per_order,
                         "gross_revenue": c.gross_revenue, "roi": c.roi},
             "prev_metrics": {"cost": 0, "sku_orders": 0, "cost_per_order": 0, "gross_revenue": 0, "roi": 0}}
            for c in creatives]

@router.patch("/{creative_id}/status")
def update_status(creative_id: str, status: str = Query(...), db: Session = Depends(get_db), _=Depends(get_current_user)):
    creative = db.query(Creative).filter_by(id=creative_id).first()
    if not creative:
        raise HTTPException(status_code=404)
    campaign = db.query(Campaign).filter_by(id=creative.campaign_id).first()
    client = _get_shop(campaign.company_id, db)
    client.update_creative_status(creative_id, creative.campaign_id, "ENABLE" if status == "active" else "DISABLE")
    creative.status = status
    db.commit()
    return {"status": status}
