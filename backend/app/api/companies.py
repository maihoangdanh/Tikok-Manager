from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.database import get_db
from app.models.company import Company
from app.models.credential import PlatformCredential
from app.middleware.auth import get_current_user
from app.services.crypto import encrypt_credentials, decrypt_credentials
import uuid

router = APIRouter()

class CompanyCreate(BaseModel):
    id: str
    name: str
    initials: str
    color: dict = {"bg": "#E6F1FB", "text": "#185FA5"}

class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    initials: Optional[str] = None
    color: Optional[dict] = None

class TikTokAdsCredIn(BaseModel):
    app_id: str
    app_secret: str
    access_token: str
    advertiser_id: str

class TikTokShopCredIn(BaseModel):
    app_key: str
    app_secret: str
    access_token: str
    refresh_token: str
    shop_id: str
    authorization_code: Optional[str] = ""
    shop_cipher: Optional[str] = ""

@router.get("/")
def list_companies(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.query(Company).all()

@router.post("/")
def create_company(data: CompanyCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    company = Company(**data.model_dump())
    db.add(company)
    db.commit()
    return company

@router.put("/{company_id}")
def update_company(company_id: str, data: CompanyUpdate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    company = db.query(Company).filter_by(id=company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    if data.name is not None: company.name = data.name
    if data.initials is not None: company.initials = data.initials
    if data.color is not None: company.color = data.color
    db.commit()
    return company

@router.get("/{company_id}/credentials")
def get_credentials(company_id: str, db: Session = Depends(get_db), _=Depends(get_current_user)):
    result = {}
    for row in db.query(PlatformCredential).filter_by(company_id=company_id).all():
        try:
            data = decrypt_credentials(row.credentials_encrypted)
            # mask secret fields, return rest as-is
            masked = {}
            for k, v in data.items():
                if any(s in k for s in ["secret", "token", "cipher"]):
                    masked[k] = "SAVED" if v else ""
                else:
                    masked[k] = v
            result[row.platform] = masked
        except Exception:
            result[row.platform] = {}
    return result

@router.post("/{company_id}/credentials/tiktok-ads")
def save_tiktok_ads(company_id: str, creds: TikTokAdsCredIn, db: Session = Depends(get_db), _=Depends(get_current_user)):
    encrypted = encrypt_credentials(creds.model_dump())
    existing = db.query(PlatformCredential).filter_by(company_id=company_id, platform="tiktok_ads").first()
    if existing:
        existing.credentials_encrypted = encrypted
    else:
        db.add(PlatformCredential(id=str(uuid.uuid4()), company_id=company_id, platform="tiktok_ads", credentials_encrypted=encrypted))
    db.commit()
    return {"message": "Saved"}

@router.post("/{company_id}/credentials/tiktok-shop")
def save_tiktok_shop(company_id: str, creds: TikTokShopCredIn, db: Session = Depends(get_db), _=Depends(get_current_user)):
    encrypted = encrypt_credentials(creds.model_dump())
    existing = db.query(PlatformCredential).filter_by(company_id=company_id, platform="tiktok_shop").first()
    if existing:
        existing.credentials_encrypted = encrypted
    else:
        db.add(PlatformCredential(id=str(uuid.uuid4()), company_id=company_id, platform="tiktok_shop", credentials_encrypted=encrypted))
    db.commit()
    return {"message": "Saved"}
