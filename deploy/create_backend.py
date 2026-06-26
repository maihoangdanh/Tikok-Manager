#!/usr/bin/env python3
"""Script tạo toàn bộ backend files trên server."""
import os

BASE = os.path.expanduser("~/dm-manager/backend")

files = {}

files["app/services/crypto.py"] = '''
import json
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
import os, binascii
from app.config import settings

def _key() -> bytes:
    return binascii.unhexlify(settings.encryption_key)

def encrypt_credentials(data: dict) -> str:
    nonce = os.urandom(12)
    ct = AESGCM(_key()).encrypt(nonce, json.dumps(data).encode(), None)
    return (nonce + ct).hex()

def decrypt_credentials(hex_data: str) -> dict:
    raw = bytes.fromhex(hex_data)
    nonce, ct = raw[:12], raw[12:]
    plain = AESGCM(_key()).decrypt(nonce, ct, None)
    return json.loads(plain)
'''.lstrip()

files["app/middleware/auth.py"] = '''
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()
ALGORITHM = "HS256"

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=settings.access_token_expire_minutes))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.secret_key, algorithm=ALGORITHM)

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, settings.secret_key, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
'''.lstrip()

files["app/services/tiktok_ads.py"] = '''
import httpx
from datetime import date
from app.config import settings

class TikTokAdsClient:
    def __init__(self, access_token: str, advertiser_id: str):
        self.access_token = access_token
        self.advertiser_id = advertiser_id
        self.base = settings.tiktok_ads_base_url
        self.headers = {"Access-Token": access_token, "Content-Type": "application/json"}

    def _get(self, path: str, params: dict) -> dict:
        with httpx.Client(timeout=30) as c:
            r = c.get(f"{self.base}{path}", params=params, headers=self.headers)
            r.raise_for_status()
            data = r.json()
            if data.get("code") != 0:
                raise RuntimeError(f"TikTok Ads API error: {data.get('message')}")
            return data["data"]

    def _post(self, path: str, body: dict) -> dict:
        with httpx.Client(timeout=30) as c:
            r = c.post(f"{self.base}{path}", json=body, headers=self.headers)
            r.raise_for_status()
            data = r.json()
            if data.get("code") != 0:
                raise RuntimeError(f"TikTok Ads API error: {data.get('message')}")
            return data.get("data", {})

    def list_campaigns(self) -> list[dict]:
        data = self._get("/campaign/get/", {
            "advertiser_id": self.advertiser_id,
            "fields": \'["campaign_id","campaign_name","status","budget","budget_mode","objective_type"]\',
            "page_size": 100,
        })
        return data.get("list", [])

    def get_campaign_metrics(self, campaign_id: str, start_date: date, end_date: date) -> list:
        data = self._get("/report/integrated/get/", {
            "advertiser_id": self.advertiser_id,
            "report_type": "BASIC",
            "data_level": "AUCTION_CAMPAIGN",
            "dimensions": \'["campaign_id","stat_time_day"]\',
            "metrics": \'["spend","impressions","clicks","ctr","cpc","conversion","cost_per_conversion","real_time_roas"]\',
            "start_date": start_date.strftime("%Y-%m-%d"),
            "end_date": end_date.strftime("%Y-%m-%d"),
            "filters": f\'[{{"filter_value":["{campaign_id}"],"field_name":"campaign_id","filter_type":"IN"}}]\',
            "page_size": 100,
        })
        return data.get("list", [])

    def update_campaign_status(self, campaign_id: str, status: str) -> bool:
        self._post("/campaign/status/update/", {
            "advertiser_id": self.advertiser_id,
            "campaign_ids": [campaign_id],
            "opt_status": status,
        })
        return True

    def update_campaign_budget(self, campaign_id: str, budget: float) -> bool:
        self._post("/campaign/update/", {
            "advertiser_id": self.advertiser_id,
            "campaign_id": campaign_id,
            "budget": budget,
        })
        return True

    def create_campaign(self, name: str, objective: str, budget: float, budget_mode: str) -> str:
        data = self._post("/campaign/create/", {
            "advertiser_id": self.advertiser_id,
            "campaign_name": name,
            "objective_type": objective,
            "budget_mode": budget_mode,
            "budget": budget,
        })
        return data["campaign_id"]
'''.lstrip()

files["app/services/tiktok_shop.py"] = '''
import httpx, hashlib, hmac, time
from app.config import settings

class TikTokShopClient:
    def __init__(self, app_key: str, app_secret: str, access_token: str, shop_id: str):
        self.app_key = app_key
        self.app_secret = app_secret
        self.access_token = access_token
        self.shop_id = shop_id
        self.base = settings.tiktok_shop_base_url

    def _sign(self, path: str, params: dict, timestamp: int) -> str:
        base_str = self.app_secret + path
        all_params = {**params, "timestamp": str(timestamp), "app_key": self.app_key}
        sorted_params = sorted(all_params.items())
        base_str += "".join(f"{k}{v}" for k, v in sorted_params if k not in ("sign", "access_token"))
        base_str += self.app_secret
        return hmac.new(self.app_secret.encode(), base_str.encode(), hashlib.sha256).hexdigest().upper()

    def _get(self, path: str, params: dict) -> dict:
        ts = int(time.time())
        sign = self._sign(path, params, ts)
        qs = {**params, "app_key": self.app_key, "timestamp": str(ts), "sign": sign}
        with httpx.Client(timeout=30) as c:
            r = c.get(f"{self.base}{path}", params=qs, headers={"x-tts-access-token": self.access_token})
            r.raise_for_status()
            data = r.json()
            if data.get("code") != 0:
                raise RuntimeError(f"TikTok Shop API error {data.get('code')}: {data.get('message')}")
            return data.get("data", {})

    def _post(self, path: str, body: dict, params: dict = None) -> dict:
        ts = int(time.time())
        extra = params or {}
        sign = self._sign(path, extra, ts)
        qs = {**extra, "app_key": self.app_key, "timestamp": str(ts), "sign": sign}
        with httpx.Client(timeout=30) as c:
            r = c.post(f"{self.base}{path}", json=body, params=qs, headers={"x-tts-access-token": self.access_token})
            r.raise_for_status()
            data = r.json()
            if data.get("code") != 0:
                raise RuntimeError(f"TikTok Shop API error {data.get('code')}: {data.get('message')}")
            return data.get("data", {})

    def get_gmv_campaign_metrics(self, campaign_id: str, start_date: str, end_date: str) -> dict:
        data = self._get("/api/v2/promotion/campaign/metrics", {
            "campaign_ids": campaign_id, "start_date": start_date, "end_date": end_date,
        })
        item = (data.get("campaign_metrics") or [{}])[0]
        return {
            "cost": float(item.get("cost", 0)),
            "sku_orders": int(item.get("sku_orders", 0)),
            "cost_per_order": float(item.get("cost_per_order", 0)),
            "gross_revenue": float(item.get("gross_revenue", 0)),
            "roi": float(item.get("roi", 0)),
        }

    def list_creatives(self, campaign_id: str) -> list[dict]:
        data = self._get("/api/v2/promotion/campaign/creative/list", {"campaign_id": campaign_id})
        return data.get("creatives", [])

    def update_creative_status(self, creative_id: str, campaign_id: str, status: str) -> bool:
        self._post("/api/v2/promotion/campaign/creative/status/update", {
            "creative_id": creative_id, "campaign_id": campaign_id, "status": status,
        })
        return True
'''.lstrip()

files["app/services/alert_engine.py"] = '''
import uuid
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.campaign import Campaign
from app.models.alert import Alert

def evaluate_campaign(db: Session, campaign: Campaign, metrics: dict, prev_metrics: dict):
    cfg = campaign.alert_config or {}
    alerts_to_create = []

    if campaign.budget_daily > 0:
        spend_pct = (campaign.budget_spend / campaign.budget_daily) * 100
        if spend_pct >= cfg.get("budget_critical_pct", 95):
            alerts_to_create.append(_make_alert(campaign, "critical",
                f"Budget {spend_pct:.0f}% — sap het ngan sach hom nay"))
        elif spend_pct >= cfg.get("budget_warning_pct", 80):
            alerts_to_create.append(_make_alert(campaign, "warning", f"Budget {spend_pct:.0f}% da dung"))

    if campaign.type == "standard":
        roas = metrics.get("roas", 0)
        min_roas = cfg.get("min_roas", 2.0)
        if roas > 0 and roas < min_roas:
            alerts_to_create.append(_make_alert(campaign, "warning", f"ROAS {roas:.1f}x thap hon muc tieu {min_roas}x"))

    if campaign.type in ("gmv_product", "gmv_live"):
        roi = metrics.get("roi", 0)
        min_roi = cfg.get("min_roi", 3.0)
        if roi > 0 and roi < min_roi:
            alerts_to_create.append(_make_alert(campaign, "warning", f"ROI {roi:.2f}x thap hon muc tieu {min_roi}x"))

    existing_msgs = {a.message for a in db.query(Alert).filter(
        Alert.campaign_id == campaign.id, Alert.resolved == False).all()}
    for alert in alerts_to_create:
        if alert.message not in existing_msgs:
            db.add(alert)
    if alerts_to_create:
        db.commit()

def _make_alert(campaign, severity: str, message: str) -> Alert:
    return Alert(id=str(uuid.uuid4()), company_id=campaign.company_id, campaign_id=campaign.id,
                 campaign_name=campaign.name, severity=severity, message=message, created_at=datetime.utcnow())
'''.lstrip()

files["app/api/auth.py"] = '''
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from app.middleware.auth import verify_password, create_access_token, hash_password
from app.config import settings

router = APIRouter()

class LoginRequest(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest):
    hashed = hash_password(settings.admin_password)
    if req.email != settings.admin_email or not verify_password(req.password, hashed):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    token = create_access_token({"sub": req.email})
    return TokenResponse(access_token=token)
'''.lstrip()

files["app/api/companies.py"] = '''
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database import get_db
from app.models.company import Company
from app.models.credential import PlatformCredential
from app.middleware.auth import get_current_user
from app.services.crypto import encrypt_credentials
import uuid

router = APIRouter()

class CompanyCreate(BaseModel):
    id: str
    name: str
    initials: str
    color: dict = {"bg": "#E6F1FB", "text": "#185FA5"}

class TikTokAdsCredIn(BaseModel):
    app_id: str
    app_secret: str
    access_token: str
    advertiser_id: str

class TikTokShopCredIn(BaseModel):
    app_key: str
    app_secret: str
    access_token: str
    shop_id: str

@router.get("/")
def list_companies(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.query(Company).all()

@router.post("/")
def create_company(data: CompanyCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    company = Company(**data.model_dump())
    db.add(company)
    db.commit()
    return company

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
'''.lstrip()

files["app/api/campaigns.py"] = '''
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
'''.lstrip()

files["app/api/gmv.py"] = '''
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
'''.lstrip()

files["app/api/creatives.py"] = '''
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
'''.lstrip()

files["app/api/alerts.py"] = '''
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from datetime import datetime
from app.database import get_db
from app.models.alert import Alert
from app.middleware.auth import get_current_user

router = APIRouter()

@router.get("/active")
def active(company_id: str = Query(...), db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.query(Alert).filter(Alert.company_id == company_id, Alert.resolved == False).order_by(Alert.created_at.desc()).all()

@router.get("/history")
def history(company_id: str = Query(...), db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.query(Alert).filter(Alert.company_id == company_id).order_by(Alert.created_at.desc()).limit(50).all()

@router.patch("/{alert_id}/resolve")
def resolve(alert_id: str, db: Session = Depends(get_db), _=Depends(get_current_user)):
    alert = db.query(Alert).filter_by(id=alert_id).first()
    if alert:
        alert.resolved = True
        alert.resolved_at = datetime.utcnow()
        db.commit()
    return {"resolved": True}
'''.lstrip()

files["app/jobs/sync_metrics.py"] = '''
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
'''.lstrip()

files["app/main.py"] = '''
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import create_tables
from app.api import auth, companies, campaigns, gmv, creatives, alerts
from app.jobs.sync_metrics import start_scheduler

app = FastAPI(title="DM Manager API", version="1.0.0")

app.add_middleware(CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(companies.router, prefix="/api/v1/companies", tags=["companies"])
app.include_router(campaigns.router, prefix="/api/v1/campaigns", tags=["campaigns"])
app.include_router(gmv.router, prefix="/api/v1/gmv", tags=["gmv"])
app.include_router(creatives.router, prefix="/api/v1/creatives", tags=["creatives"])
app.include_router(alerts.router, prefix="/api/v1/alerts", tags=["alerts"])

@app.on_event("startup")
async def startup():
    create_tables()
    start_scheduler()

@app.get("/api/health")
def health():
    return {"status": "ok"}
'''.lstrip()

# Write all files
for rel_path, content in files.items():
    full_path = os.path.join(BASE, rel_path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, "w") as f:
        f.write(content)
    print(f"Created: {rel_path}")

print("All backend files created!")
