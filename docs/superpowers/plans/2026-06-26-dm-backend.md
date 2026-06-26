# Digital Marketing Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Xây dựng FastAPI backend phục vụ frontend DM Manager — TikTok Ads API (Standard campaigns) + TikTok Shop API (GMV Max metrics + creatives), multi-company, chạy SQLite local và PostgreSQL trên VPS.

**Architecture:** FastAPI + SQLAlchemy + Alembic, credentials mã hóa AES-256 trong DB, background sync mỗi giờ với APScheduler, JWT auth, Docker-ready.

**Two separate TikTok APIs:**
- **TikTok Ads API v1.3** (`business-api.tiktok.com`) — Standard campaigns: CRUD, pause/enable, metrics. GMV Max: pause/enable campaign + edit budget (không có metrics chi tiết).
- **TikTok Shop API** (`open-api.tiktok.com`) — GMV Max: metrics (cost/orders/revenue/ROI), list creatives, pause/enable từng creative.
- **Merge layer**: Join hai API theo `campaign_id` → unified `GmvCampaign` response.

---

## File Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                         # FastAPI app, CORS, startup
│   ├── config.py                       # Settings từ .env
│   ├── database.py                     # SQLAlchemy engine + Session
│   ├── models/
│   │   ├── __init__.py
│   │   ├── company.py                  # Company
│   │   ├── campaign.py                 # Campaign, CampaignMetrics
│   │   ├── creative.py                 # Creative (GMV Max video)
│   │   ├── alert.py                    # Alert
│   │   └── credential.py              # PlatformCredential (encrypted)
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── company.py
│   │   ├── campaign.py                 # Standard + GMV campaign schemas
│   │   ├── creative.py
│   │   └── alert.py
│   ├── api/
│   │   ├── __init__.py
│   │   ├── auth.py                     # POST /auth/login, /auth/refresh
│   │   ├── companies.py               # CRUD companies
│   │   ├── campaigns.py               # Standard campaign endpoints
│   │   ├── gmv.py                      # GMV Max endpoints (merge layer)
│   │   ├── creatives.py               # GMV creative endpoints
│   │   └── alerts.py                   # Alert endpoints
│   ├── services/
│   │   ├── tiktok_ads.py              # TikTok Ads API v1.3 client
│   │   ├── tiktok_shop.py             # TikTok Shop API client
│   │   ├── gmv_merge.py               # Merge Ads + Shop API
│   │   ├── alert_engine.py            # Evaluate thresholds → Alert records
│   │   └── crypto.py                  # AES-256 encrypt/decrypt credentials
│   ├── jobs/
│   │   ├── __init__.py
│   │   └── sync_metrics.py            # APScheduler — sync mỗi giờ
│   └── middleware/
│       └── auth.py                    # JWT verify middleware
├── alembic/
│   ├── env.py
│   └── versions/
│       └── 001_initial.py
├── alembic.ini
├── requirements.txt
├── .env.example
└── docker/
    └── Dockerfile.backend
```

---

## Task 1: Project Setup

**Files:**
- Create: `backend/requirements.txt`
- Create: `backend/.env.example`
- Create: `backend/app/__init__.py` (empty)
- Create: `backend/app/config.py`
- Create: `backend/app/main.py`

- [ ] **Step 1: requirements.txt**

```text
fastapi==0.111.0
uvicorn[standard]==0.30.1
sqlalchemy==2.0.31
alembic==1.13.2
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.9
httpx==0.27.0
apscheduler==3.10.4
cryptography==42.0.8
python-dotenv==1.0.1
pydantic-settings==2.3.4
pydantic==2.8.2
```

- [ ] **Step 2: .env.example**

```bash
# Database
DATABASE_URL=sqlite:///./dm.db

# Auth
SECRET_KEY=change-me-in-production-use-openssl-rand-hex-32
ACCESS_TOKEN_EXPIRE_MINUTES=480
REFRESH_TOKEN_EXPIRE_DAYS=30

# Encryption key for credentials (32 bytes hex = 64 chars)
ENCRYPTION_KEY=0000000000000000000000000000000000000000000000000000000000000000

# TikTok API (default, có thể override per company)
TIKTOK_ADS_BASE_URL=https://business-api.tiktok.com/open_api/v1.3
TIKTOK_SHOP_BASE_URL=https://open-api.tiktok.com

# Admin account (initial setup)
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=changeme
```

- [ ] **Step 3: app/config.py**

```python
# app/config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str = "sqlite:///./dm.db"
    secret_key: str = "dev-secret-key"
    access_token_expire_minutes: int = 480
    refresh_token_expire_days: int = 30
    encryption_key: str = "0" * 64
    tiktok_ads_base_url: str = "https://business-api.tiktok.com/open_api/v1.3"
    tiktok_shop_base_url: str = "https://open-api.tiktok.com"
    admin_email: str = "admin@example.com"
    admin_password: str = "changeme"

    class Config:
        env_file = ".env"

settings = Settings()
```

- [ ] **Step 4: app/main.py**

```python
# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import create_tables
from app.api import auth, companies, campaigns, gmv, creatives, alerts
from app.jobs.sync_metrics import start_scheduler

app = FastAPI(title="DM Manager API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
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
```

- [ ] **Step 5: Setup môi trường**

```bash
cd "D:\Quan Lieu\Digital\backend"
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

- [ ] **Step 6: Verify startup**

```bash
cp .env.example .env
uvicorn app.main:app --reload
# curl http://localhost:8000/api/health
```

Expected: `{"status":"ok"}`

- [ ] **Step 7: Commit**

```bash
git add . && git commit -m "feat: backend project setup FastAPI"
```

---

## Task 2: Database Models + Alembic

**Files:**
- Create: `backend/app/database.py`
- Create: `backend/app/models/*.py`
- Create: `backend/alembic/` (init)
- Create: `backend/alembic/versions/001_initial.py`

- [ ] **Step 1: app/database.py**

```python
# app/database.py
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config import settings

engine = create_engine(
    settings.database_url,
    connect_args={"check_same_thread": False} if "sqlite" in settings.database_url else {},
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def create_tables():
    Base.metadata.create_all(bind=engine)
```

- [ ] **Step 2: app/models/company.py**

```python
# app/models/company.py
from sqlalchemy import Column, String, JSON
from app.database import Base

class Company(Base):
    __tablename__ = "companies"
    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    initials = Column(String(4), nullable=False)
    color = Column(JSON, nullable=False, default={"bg": "#E6F1FB", "text": "#185FA5"})
```

- [ ] **Step 3: app/models/credential.py**

```python
# app/models/credential.py
from sqlalchemy import Column, String, DateTime
from datetime import datetime
from app.database import Base

class PlatformCredential(Base):
    __tablename__ = "platform_credentials"
    id = Column(String, primary_key=True)
    company_id = Column(String, nullable=False, index=True)
    platform = Column(String(20), nullable=False)  # 'tiktok_ads' | 'tiktok_shop'
    # credentials_encrypted = AES-256 encrypted JSON:
    # tiktok_ads:  {"app_id","app_secret","access_token","advertiser_id"}
    # tiktok_shop: {"app_key","app_secret","access_token","shop_id"}
    credentials_encrypted = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
```

- [ ] **Step 4: app/models/campaign.py**

```python
# app/models/campaign.py
from sqlalchemy import Column, String, Float, Integer, DateTime, JSON, Boolean
from datetime import datetime
from app.database import Base

class Campaign(Base):
    __tablename__ = "campaigns"
    id = Column(String, primary_key=True)          # TikTok campaign_id
    company_id = Column(String, nullable=False, index=True)
    name = Column(String, nullable=False)
    type = Column(String(20), nullable=False)       # standard | gmv_product | gmv_live
    status = Column(String(20), nullable=False)     # active | paused | draft
    objective = Column(String(30))                  # null cho GMV
    budget_daily = Column(Float, default=0)
    budget_spend = Column(Float, default=0)
    alert_config = Column(JSON, default={
        "budget_warning_pct": 80,
        "budget_critical_pct": 95,
        "min_roas": 2.0,
        "min_roi": 3.0,
        "max_cpc": None,
    })
    last_synced_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)

class CampaignMetrics(Base):
    __tablename__ = "campaign_metrics"
    id = Column(Integer, primary_key=True, autoincrement=True)
    campaign_id = Column(String, nullable=False, index=True)
    date = Column(String(10), nullable=False)       # YYYY-MM-DD
    # Standard metrics
    spend = Column(Float, default=0)
    roas = Column(Float, default=0)
    impressions = Column(Integer, default=0)
    clicks = Column(Integer, default=0)
    ctr = Column(Float, default=0)
    cpc = Column(Float, default=0)
    conversions = Column(Integer, default=0)
    cpa = Column(Float, default=0)
    # GMV metrics
    cost = Column(Float, default=0)
    sku_orders = Column(Integer, default=0)
    cost_per_order = Column(Float, default=0)
    gross_revenue = Column(Float, default=0)
    roi = Column(Float, default=0)
```

- [ ] **Step 5: app/models/creative.py**

```python
# app/models/creative.py
from sqlalchemy import Column, String, Float, Integer, DateTime
from datetime import datetime
from app.database import Base

class Creative(Base):
    __tablename__ = "creatives"
    id = Column(String, primary_key=True)           # TikTok material_id / video_id
    campaign_id = Column(String, nullable=False, index=True)
    name = Column(String, nullable=False)
    status = Column(String(20), nullable=False)     # active | paused
    video_url = Column(String)
    cost = Column(Float, default=0)
    sku_orders = Column(Integer, default=0)
    cost_per_order = Column(Float, default=0)
    gross_revenue = Column(Float, default=0)
    roi = Column(Float, default=0)
    last_synced_at = Column(DateTime)
```

- [ ] **Step 6: app/models/alert.py**

```python
# app/models/alert.py
from sqlalchemy import Column, String, Boolean, DateTime
from datetime import datetime
from app.database import Base

class Alert(Base):
    __tablename__ = "alerts"
    id = Column(String, primary_key=True)
    company_id = Column(String, nullable=False, index=True)
    campaign_id = Column(String, nullable=False)
    campaign_name = Column(String, nullable=False)
    severity = Column(String(10), nullable=False)   # critical | warning
    message = Column(String, nullable=False)
    resolved = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime)
```

- [ ] **Step 7: app/models/__init__.py**

```python
# app/models/__init__.py
from app.models.company import Company
from app.models.credential import PlatformCredential
from app.models.campaign import Campaign, CampaignMetrics
from app.models.creative import Creative
from app.models.alert import Alert

__all__ = ["Company", "PlatformCredential", "Campaign", "CampaignMetrics", "Creative", "Alert"]
```

- [ ] **Step 8: Init Alembic + viết migration**

```bash
alembic init alembic
```

Chỉnh `alembic/env.py` — thêm:
```python
from app.database import Base
from app.models import *  # noqa
target_metadata = Base.metadata
```

Tạo migration:
```bash
alembic revision --autogenerate -m "initial"
alembic upgrade head
```

- [ ] **Step 9: Verify tables**

```bash
python -c "from app.database import create_tables; create_tables(); print('OK')"
```

- [ ] **Step 10: Commit**

```bash
git add . && git commit -m "feat: DB models, Alembic migration"
```

---

## Task 3: Auth + Crypto

**Files:**
- Create: `backend/app/services/crypto.py`
- Create: `backend/app/middleware/auth.py`
- Create: `backend/app/api/auth.py`

- [ ] **Step 1: app/services/crypto.py**

```python
# app/services/crypto.py
import json
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
import os
import binascii
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
```

- [ ] **Step 2: app/middleware/auth.py**

```python
# app/middleware/auth.py
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
```

- [ ] **Step 3: app/api/auth.py**

```python
# app/api/auth.py
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from app.middleware.auth import verify_password, create_access_token, hash_password
from app.config import settings

router = APIRouter()

# Simple hardcoded admin for local — thay bằng DB user nếu cần multi-user
ADMIN = {
    "email": settings.admin_email,
    "hashed_password": hash_password(settings.admin_password),
}

class LoginRequest(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest):
    if req.email != ADMIN["email"] or not verify_password(req.password, ADMIN["hashed_password"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    token = create_access_token({"sub": req.email})
    return TokenResponse(access_token=token)
```

- [ ] **Step 4: Commit**

```bash
git add . && git commit -m "feat: JWT auth, AES-256 credential encryption"
```

---

## Task 4: TikTok API Clients

**Files:**
- Create: `backend/app/services/tiktok_ads.py`
- Create: `backend/app/services/tiktok_shop.py`

- [ ] **Step 1: app/services/tiktok_ads.py**

```python
# app/services/tiktok_ads.py
import httpx
from datetime import date, timedelta
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
            "fields": '["campaign_id","campaign_name","status","budget","budget_mode","objective_type"]',
            "page_size": 100,
        })
        return data.get("list", [])

    def get_campaign_metrics(self, campaign_id: str, start_date: date, end_date: date) -> dict:
        """Trả về metrics cho 1 campaign trong khoảng thời gian."""
        data = self._get("/report/integrated/get/", {
            "advertiser_id": self.advertiser_id,
            "report_type": "BASIC",
            "data_level": "AUCTION_CAMPAIGN",
            "dimensions": '["campaign_id","stat_time_day"]',
            "metrics": '["spend","impressions","clicks","ctr","cpc","conversion","cost_per_conversion","real_time_roas"]',
            "start_date": start_date.strftime("%Y-%m-%d"),
            "end_date": end_date.strftime("%Y-%m-%d"),
            "filters": f'[{{"filter_value":["{campaign_id}"],"field_name":"campaign_id","filter_type":"IN"}}]',
            "page_size": 100,
        })
        return data.get("list", [])

    def update_campaign_status(self, campaign_id: str, status: str) -> bool:
        """status: ENABLE | DISABLE"""
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
        """Trả về campaign_id mới tạo."""
        data = self._post("/campaign/create/", {
            "advertiser_id": self.advertiser_id,
            "campaign_name": name,
            "objective_type": objective,  # CONVERSIONS | VIDEO_VIEWS | REACH | PRODUCT_SALES
            "budget_mode": budget_mode,   # BUDGET_MODE_DAY | BUDGET_MODE_TOTAL
            "budget": budget,
        })
        return data["campaign_id"]
```

- [ ] **Step 2: app/services/tiktok_shop.py**

```python
# app/services/tiktok_shop.py
import httpx
import hashlib
import hmac
import time
from app.config import settings

class TikTokShopClient:
    """
    TikTok Shop API — dùng cho GMV Max metrics và creative management.
    Docs: https://partner.tiktokshop.com/docv2/page/650a3f7a4a0bb702c1967a58
    """
    def __init__(self, app_key: str, app_secret: str, access_token: str, shop_id: str):
        self.app_key = app_key
        self.app_secret = app_secret
        self.access_token = access_token
        self.shop_id = shop_id
        self.base = settings.tiktok_shop_base_url

    def _sign(self, path: str, params: dict, timestamp: int) -> str:
        """Tạo HMAC-SHA256 signature cho TikTok Shop API."""
        base_str = self.app_secret
        base_str += path
        sorted_params = sorted({**params, "timestamp": str(timestamp), "app_key": self.app_key}.items())
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

    def _post(self, path: str, body: dict, params: dict | None = None) -> dict:
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
        """
        Lấy GMV metrics cho 1 campaign từ Shop API.
        Returns: {cost, sku_orders, cost_per_order, gross_revenue, roi}
        """
        data = self._get("/api/v2/promotion/campaign/metrics", {
            "campaign_ids": campaign_id,
            "start_date": start_date,
            "end_date": end_date,
        })
        item = data.get("campaign_metrics", [{}])[0] if data else {}
        return {
            "cost": float(item.get("cost", 0)),
            "sku_orders": int(item.get("sku_orders", 0)),
            "cost_per_order": float(item.get("cost_per_order", 0)),
            "gross_revenue": float(item.get("gross_revenue", 0)),
            "roi": float(item.get("roi", 0)),
        }

    def list_creatives(self, campaign_id: str) -> list[dict]:
        """Lấy danh sách creatives (video) trong GMV Max campaign."""
        data = self._get("/api/v2/promotion/campaign/creative/list", {
            "campaign_id": campaign_id,
        })
        return data.get("creatives", [])

    def update_creative_status(self, creative_id: str, campaign_id: str, status: str) -> bool:
        """status: 'ENABLE' | 'DISABLE'"""
        self._post("/api/v2/promotion/campaign/creative/status/update", {
            "creative_id": creative_id,
            "campaign_id": campaign_id,
            "status": status,
        })
        return True
```

- [ ] **Step 3: Commit**

```bash
git add . && git commit -m "feat: TikTok Ads API client + TikTok Shop API client"
```

---

## Task 5: Schemas (Pydantic)

**Files:**
- Create: `backend/app/schemas/company.py`
- Create: `backend/app/schemas/campaign.py`
- Create: `backend/app/schemas/creative.py`
- Create: `backend/app/schemas/alert.py`
- Create: `backend/app/schemas/__init__.py`

- [ ] **Step 1: app/schemas/company.py**

```python
# app/schemas/company.py
from pydantic import BaseModel

class CompanyColor(BaseModel):
    bg: str
    text: str

class CompanyCreate(BaseModel):
    id: str
    name: str
    initials: str
    color: CompanyColor

class CompanyOut(CompanyCreate):
    class Config:
        from_attributes = True
```

- [ ] **Step 2: app/schemas/campaign.py**

```python
# app/schemas/campaign.py
from pydantic import BaseModel
from typing import Optional

class StandardMetrics(BaseModel):
    spend: float = 0
    roas: float = 0
    impressions: int = 0
    clicks: int = 0
    ctr: float = 0
    cpc: float = 0
    conversions: int = 0
    cpa: float = 0

class GmvMetrics(BaseModel):
    cost: float = 0
    sku_orders: int = 0
    cost_per_order: float = 0
    gross_revenue: float = 0
    roi: float = 0

class AlertConfig(BaseModel):
    budget_warning_pct: float = 80
    budget_critical_pct: float = 95
    min_roas: float = 2.0
    min_roi: float = 3.0
    max_cpc: Optional[float] = None
    min_orders_per_day: Optional[int] = None

class StandardCampaignOut(BaseModel):
    id: str
    company_id: str
    name: str
    type: str = "standard"
    status: str
    objective: Optional[str]
    budget_daily: float
    budget_spend: float
    metrics: StandardMetrics
    prev_metrics: StandardMetrics
    alert_config: AlertConfig

    class Config:
        from_attributes = True

class GmvCampaignOut(BaseModel):
    id: str
    company_id: str
    name: str
    type: str  # gmv_product | gmv_live
    status: str
    budget_daily: float
    budget_spend: float
    metrics: GmvMetrics
    prev_metrics: GmvMetrics
    alert_config: AlertConfig

    class Config:
        from_attributes = True

class CampaignCreate(BaseModel):
    name: str
    type: str
    objective: Optional[str] = None
    budget_daily: float
    budget_type: str = "BUDGET_MODE_DAY"
    alert_config: Optional[AlertConfig] = None

class AlertConfigUpdate(BaseModel):
    alert_config: AlertConfig
```

- [ ] **Step 3: app/schemas/creative.py**

```python
# app/schemas/creative.py
from pydantic import BaseModel
from typing import Optional

class GmvMetrics(BaseModel):
    cost: float = 0
    sku_orders: int = 0
    cost_per_order: float = 0
    gross_revenue: float = 0
    roi: float = 0

class CreativeOut(BaseModel):
    id: str
    campaign_id: str
    name: str
    status: str
    video_url: Optional[str]
    metrics: GmvMetrics
    prev_metrics: GmvMetrics

    class Config:
        from_attributes = True
```

- [ ] **Step 4: app/schemas/alert.py**

```python
# app/schemas/alert.py
from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class AlertOut(BaseModel):
    id: str
    company_id: str
    campaign_id: str
    campaign_name: str
    severity: str
    message: str
    resolved: bool
    created_at: datetime
    resolved_at: Optional[datetime]

    class Config:
        from_attributes = True
```

- [ ] **Step 5: Commit**

```bash
git add . && git commit -m "feat: Pydantic schemas"
```

---

## Task 6: GMV Merge Layer + Alert Engine

**Files:**
- Create: `backend/app/services/gmv_merge.py`
- Create: `backend/app/services/alert_engine.py`

- [ ] **Step 1: app/services/gmv_merge.py**

```python
# app/services/gmv_merge.py
"""
Merge TikTok Ads API data (status, budget) với TikTok Shop API data (metrics).
Kết quả: unified GmvCampaignOut cho cả gmv_product và gmv_live.
"""
from datetime import date, timedelta
from app.services.tiktok_ads import TikTokAdsClient
from app.services.tiktok_shop import TikTokShopClient
from app.schemas.campaign import GmvCampaignOut, GmvMetrics, AlertConfig
from app.models.campaign import Campaign

def get_gmv_campaign(
    campaign: Campaign,
    ads_client: TikTokAdsClient,
    shop_client: TikTokShopClient,
    period_days: int = 7,
) -> GmvCampaignOut:
    today = date.today()
    start = today - timedelta(days=period_days)
    prev_start = start - timedelta(days=period_days)
    prev_end = start - timedelta(days=1)

    current_metrics = shop_client.get_gmv_campaign_metrics(
        campaign.id, start.strftime("%Y-%m-%d"), today.strftime("%Y-%m-%d")
    )
    prev_metrics = shop_client.get_gmv_campaign_metrics(
        campaign.id, prev_start.strftime("%Y-%m-%d"), prev_end.strftime("%Y-%m-%d")
    )

    return GmvCampaignOut(
        id=campaign.id,
        company_id=campaign.company_id,
        name=campaign.name,
        type=campaign.type,
        status=campaign.status,
        budget_daily=campaign.budget_daily,
        budget_spend=campaign.budget_spend,
        metrics=GmvMetrics(**current_metrics),
        prev_metrics=GmvMetrics(**prev_metrics),
        alert_config=AlertConfig(**(campaign.alert_config or {})),
    )
```

- [ ] **Step 2: app/services/alert_engine.py**

```python
# app/services/alert_engine.py
import uuid
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.campaign import Campaign
from app.models.alert import Alert

def evaluate_campaign(db: Session, campaign: Campaign, metrics: dict, prev_metrics: dict):
    """Kiểm tra thresholds, tạo Alert records nếu vi phạm."""
    cfg = campaign.alert_config or {}
    alerts_to_create = []

    # Budget checks
    if campaign.budget_daily > 0:
        spend_pct = (campaign.budget_spend / campaign.budget_daily) * 100
        if spend_pct >= cfg.get("budget_critical_pct", 95):
            alerts_to_create.append(_make_alert(campaign, "critical",
                f"Budget {spend_pct:.0f}% — sắp hết ngân sách hôm nay "
                f"(₫{campaign.budget_spend:,.0f}/₫{campaign.budget_daily:,.0f})"))
        elif spend_pct >= cfg.get("budget_warning_pct", 80):
            alerts_to_create.append(_make_alert(campaign, "warning",
                f"Budget {spend_pct:.0f}% đã dùng"))

    # Standard campaign — ROAS, CPC
    if campaign.type == "standard":
        roas = metrics.get("roas", 0)
        min_roas = cfg.get("min_roas", 2.0)
        if roas > 0 and roas < min_roas:
            alerts_to_create.append(_make_alert(campaign, "warning",
                f"ROAS {roas:.1f}x thấp hơn mục tiêu {min_roas}x"))

        max_cpc = cfg.get("max_cpc")
        cpc = metrics.get("cpc", 0)
        if max_cpc and cpc > max_cpc:
            alerts_to_create.append(_make_alert(campaign, "warning",
                f"CPC ₫{cpc:,.0f} cao hơn giới hạn ₫{max_cpc:,.0f}"))

    # GMV campaign — ROI, orders
    if campaign.type in ("gmv_product", "gmv_live"):
        roi = metrics.get("roi", 0)
        min_roi = cfg.get("min_roi", 3.0)
        if roi > 0 and roi < min_roi:
            alerts_to_create.append(_make_alert(campaign, "warning",
                f"ROI {roi:.2f}x thấp hơn mục tiêu {min_roi}x"))

        prev_roi = prev_metrics.get("roi", 0)
        if roi > 0 and prev_roi > 0:
            delta = ((roi - prev_roi) / prev_roi) * 100
            if delta < -15:
                alerts_to_create.append(_make_alert(campaign, "warning",
                    f"ROI giảm {delta:.1f}% so với cùng kỳ ({roi:.2f} vs {prev_roi:.2f})"))

    # Dedup: không tạo alert trùng nếu chưa resolve
    existing_msgs = {a.message for a in db.query(Alert).filter(
        Alert.campaign_id == campaign.id, Alert.resolved == False
    ).all()}

    for alert in alerts_to_create:
        if alert.message not in existing_msgs:
            db.add(alert)

    if alerts_to_create:
        db.commit()

def _make_alert(campaign: Campaign, severity: str, message: str) -> Alert:
    return Alert(
        id=str(uuid.uuid4()),
        company_id=campaign.company_id,
        campaign_id=campaign.id,
        campaign_name=campaign.name,
        severity=severity,
        message=message,
        created_at=datetime.utcnow(),
    )
```

- [ ] **Step 3: Commit**

```bash
git add . && git commit -m "feat: GMV merge layer, alert engine"
```

---

## Task 7: API Endpoints

**Files:**
- Create: `backend/app/api/__init__.py`
- Create: `backend/app/api/companies.py`
- Create: `backend/app/api/campaigns.py`
- Create: `backend/app/api/gmv.py`
- Create: `backend/app/api/creatives.py`
- Create: `backend/app/api/alerts.py`

- [ ] **Step 1: app/api/companies.py**

```python
# app/api/companies.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.company import Company
from app.models.credential import PlatformCredential
from app.schemas.company import CompanyCreate, CompanyOut
from app.middleware.auth import get_current_user
from app.services.crypto import encrypt_credentials, decrypt_credentials
import uuid

router = APIRouter()

@router.get("/", response_model=list[CompanyOut])
def list_companies(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.query(Company).all()

@router.post("/", response_model=CompanyOut)
def create_company(data: CompanyCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    company = Company(**data.model_dump())
    db.add(company)
    db.commit()
    return company

class CredentialIn:
    from pydantic import BaseModel
    class TikTokAds(BaseModel):
        app_id: str; app_secret: str; access_token: str; advertiser_id: str
    class TikTokShop(BaseModel):
        app_key: str; app_secret: str; access_token: str; shop_id: str

from pydantic import BaseModel

class TikTokAdsCredIn(BaseModel):
    app_id: str; app_secret: str; access_token: str; advertiser_id: str

class TikTokShopCredIn(BaseModel):
    app_key: str; app_secret: str; access_token: str; shop_id: str

@router.post("/{company_id}/credentials/tiktok-ads")
def save_tiktok_ads_creds(company_id: str, creds: TikTokAdsCredIn, db: Session = Depends(get_db), _=Depends(get_current_user)):
    encrypted = encrypt_credentials(creds.model_dump())
    existing = db.query(PlatformCredential).filter_by(company_id=company_id, platform="tiktok_ads").first()
    if existing:
        existing.credentials_encrypted = encrypted
    else:
        db.add(PlatformCredential(id=str(uuid.uuid4()), company_id=company_id, platform="tiktok_ads", credentials_encrypted=encrypted))
    db.commit()
    return {"message": "Credentials saved"}

@router.post("/{company_id}/credentials/tiktok-shop")
def save_tiktok_shop_creds(company_id: str, creds: TikTokShopCredIn, db: Session = Depends(get_db), _=Depends(get_current_user)):
    encrypted = encrypt_credentials(creds.model_dump())
    existing = db.query(PlatformCredential).filter_by(company_id=company_id, platform="tiktok_shop").first()
    if existing:
        existing.credentials_encrypted = encrypted
    else:
        db.add(PlatformCredential(id=str(uuid.uuid4()), company_id=company_id, platform="tiktok_shop", credentials_encrypted=encrypted))
    db.commit()
    return {"message": "Credentials saved"}
```

- [ ] **Step 2: app/api/campaigns.py (Standard campaigns)**

```python
# app/api/campaigns.py
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import date, timedelta
from app.database import get_db
from app.models.campaign import Campaign
from app.models.credential import PlatformCredential
from app.schemas.campaign import StandardCampaignOut, CampaignCreate, AlertConfigUpdate
from app.services.tiktok_ads import TikTokAdsClient
from app.services.crypto import decrypt_credentials
from app.middleware.auth import get_current_user
import uuid

router = APIRouter()

def _get_ads_client(company_id: str, db: Session) -> TikTokAdsClient:
    cred = db.query(PlatformCredential).filter_by(company_id=company_id, platform="tiktok_ads").first()
    if not cred:
        raise HTTPException(status_code=404, detail="TikTok Ads credentials not configured")
    c = decrypt_credentials(cred.credentials_encrypted)
    return TikTokAdsClient(access_token=c["access_token"], advertiser_id=c["advertiser_id"])

@router.get("/", response_model=list[StandardCampaignOut])
def list_standard_campaigns(
    company_id: str = Query(...),
    period: int = Query(7),
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    campaigns = db.query(Campaign).filter(Campaign.company_id == company_id, Campaign.type == "standard").all()
    # Return cached metrics from DB (synced by background job)
    result = []
    for c in campaigns:
        metrics = _get_latest_metrics(c.id, db, period)
        prev_metrics = _get_prev_metrics(c.id, db, period)
        result.append(StandardCampaignOut(
            id=c.id, company_id=c.company_id, name=c.name, type=c.type,
            status=c.status, objective=c.objective,
            budget_daily=c.budget_daily, budget_spend=c.budget_spend,
            metrics=metrics, prev_metrics=prev_metrics,
            alert_config=c.alert_config or {},
        ))
    return result

@router.patch("/{campaign_id}/status")
def update_status(campaign_id: str, status: str, db: Session = Depends(get_db), _=Depends(get_current_user)):
    """status: active | paused"""
    campaign = db.query(Campaign).filter_by(id=campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    client = _get_ads_client(campaign.company_id, db)
    api_status = "ENABLE" if status == "active" else "DISABLE"
    client.update_campaign_status(campaign_id, api_status)
    campaign.status = status
    db.commit()
    return {"status": status}

@router.patch("/{campaign_id}/budget")
def update_budget(campaign_id: str, budget: float, db: Session = Depends(get_db), _=Depends(get_current_user)):
    campaign = db.query(Campaign).filter_by(id=campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    client = _get_ads_client(campaign.company_id, db)
    client.update_campaign_budget(campaign_id, budget)
    campaign.budget_daily = budget
    db.commit()
    return {"budget_daily": budget}

@router.patch("/{campaign_id}/alert-config")
def update_alert_config(campaign_id: str, data: AlertConfigUpdate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    campaign = db.query(Campaign).filter_by(id=campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    campaign.alert_config = data.alert_config.model_dump()
    db.commit()
    return data.alert_config

@router.post("/")
def create_campaign(company_id: str, data: CampaignCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    client = _get_ads_client(company_id, db)
    objective_map = {"conversions": "CONVERSIONS", "traffic": "VIDEO_VIEWS", "awareness": "REACH", "catalog_sales": "PRODUCT_SALES"}
    tiktok_campaign_id = client.create_campaign(
        name=data.name,
        objective=objective_map.get(data.objective or "conversions", "CONVERSIONS"),
        budget=data.budget_daily,
        budget_mode=data.budget_type,
    )
    campaign = Campaign(
        id=tiktok_campaign_id, company_id=company_id, name=data.name,
        type=data.type, status="active", objective=data.objective,
        budget_daily=data.budget_daily, budget_spend=0,
        alert_config=(data.alert_config.model_dump() if data.alert_config else None),
    )
    db.add(campaign)
    db.commit()
    return {"campaign_id": tiktok_campaign_id}

def _get_latest_metrics(campaign_id: str, db: Session, period: int) -> dict:
    from app.models.campaign import CampaignMetrics
    from datetime import date, timedelta
    from sqlalchemy import func
    start = date.today() - timedelta(days=period)
    rows = db.query(CampaignMetrics).filter(
        CampaignMetrics.campaign_id == campaign_id,
        CampaignMetrics.date >= start.strftime("%Y-%m-%d"),
    ).all()
    return _aggregate_standard(rows)

def _get_prev_metrics(campaign_id: str, db: Session, period: int) -> dict:
    from app.models.campaign import CampaignMetrics
    from datetime import date, timedelta
    end = date.today() - timedelta(days=period + 1)
    start = end - timedelta(days=period - 1)
    rows = db.query(CampaignMetrics).filter(
        CampaignMetrics.campaign_id == campaign_id,
        CampaignMetrics.date >= start.strftime("%Y-%m-%d"),
        CampaignMetrics.date <= end.strftime("%Y-%m-%d"),
    ).all()
    return _aggregate_standard(rows)

def _aggregate_standard(rows) -> dict:
    if not rows:
        return {"spend": 0, "roas": 0, "impressions": 0, "clicks": 0, "ctr": 0, "cpc": 0, "conversions": 0, "cpa": 0}
    spend = sum(r.spend for r in rows)
    conversions = sum(r.conversions for r in rows)
    return {
        "spend": spend,
        "roas": sum(r.roas for r in rows) / len(rows),
        "impressions": sum(r.impressions for r in rows),
        "clicks": sum(r.clicks for r in rows),
        "ctr": sum(r.ctr for r in rows) / len(rows),
        "cpc": sum(r.cpc for r in rows) / len(rows),
        "conversions": conversions,
        "cpa": spend / conversions if conversions else 0,
    }
```

- [ ] **Step 3: app/api/gmv.py (GMV Max — merge layer)**

```python
# app/api/gmv.py
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.campaign import Campaign
from app.models.credential import PlatformCredential
from app.schemas.campaign import GmvCampaignOut
from app.services.tiktok_ads import TikTokAdsClient
from app.services.tiktok_shop import TikTokShopClient
from app.services.gmv_merge import get_gmv_campaign
from app.services.crypto import decrypt_credentials
from app.middleware.auth import get_current_user

router = APIRouter()

def _get_clients(company_id: str, db: Session):
    ads_cred = db.query(PlatformCredential).filter_by(company_id=company_id, platform="tiktok_ads").first()
    shop_cred = db.query(PlatformCredential).filter_by(company_id=company_id, platform="tiktok_shop").first()
    if not ads_cred or not shop_cred:
        raise HTTPException(status_code=404, detail="TikTok credentials not configured")
    ac = decrypt_credentials(ads_cred.credentials_encrypted)
    sc = decrypt_credentials(shop_cred.credentials_encrypted)
    return (
        TikTokAdsClient(ac["access_token"], ac["advertiser_id"]),
        TikTokShopClient(sc["app_key"], sc["app_secret"], sc["access_token"], sc["shop_id"]),
    )

@router.get("/campaigns", response_model=list[GmvCampaignOut])
def list_gmv_campaigns(
    company_id: str = Query(...),
    period: int = Query(7),
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    campaigns = db.query(Campaign).filter(
        Campaign.company_id == company_id,
        Campaign.type.in_(["gmv_product", "gmv_live"]),
    ).all()
    ads_client, shop_client = _get_clients(company_id, db)
    return [get_gmv_campaign(c, ads_client, shop_client, period) for c in campaigns]

@router.patch("/campaigns/{campaign_id}/status")
def update_gmv_status(campaign_id: str, status: str, db: Session = Depends(get_db), _=Depends(get_current_user)):
    """Chỉ pause/enable campaign level, không thay đổi targeting."""
    campaign = db.query(Campaign).filter_by(id=campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Not found")
    ads_client, _ = _get_clients(campaign.company_id, db)
    ads_client.update_campaign_status(campaign_id, "ENABLE" if status == "active" else "DISABLE")
    campaign.status = status
    db.commit()
    return {"status": status}

@router.patch("/campaigns/{campaign_id}/budget")
def update_gmv_budget(campaign_id: str, budget: float, db: Session = Depends(get_db), _=Depends(get_current_user)):
    campaign = db.query(Campaign).filter_by(id=campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Not found")
    ads_client, _ = _get_clients(campaign.company_id, db)
    ads_client.update_campaign_budget(campaign_id, budget)
    campaign.budget_daily = budget
    db.commit()
    return {"budget_daily": budget}
```

- [ ] **Step 4: app/api/creatives.py**

```python
# app/api/creatives.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.creative import Creative
from app.models.credential import PlatformCredential
from app.models.campaign import Campaign
from app.schemas.creative import CreativeOut, GmvMetrics
from app.services.tiktok_shop import TikTokShopClient
from app.services.crypto import decrypt_credentials
from app.middleware.auth import get_current_user

router = APIRouter()

def _get_shop_client(company_id: str, db: Session) -> TikTokShopClient:
    cred = db.query(PlatformCredential).filter_by(company_id=company_id, platform="tiktok_shop").first()
    if not cred:
        raise HTTPException(status_code=404, detail="TikTok Shop credentials not configured")
    c = decrypt_credentials(cred.credentials_encrypted)
    return TikTokShopClient(c["app_key"], c["app_secret"], c["access_token"], c["shop_id"])

@router.get("/{campaign_id}", response_model=list[CreativeOut])
def list_creatives(campaign_id: str, db: Session = Depends(get_db), _=Depends(get_current_user)):
    campaign = db.query(Campaign).filter_by(id=campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    creatives = db.query(Creative).filter_by(campaign_id=campaign_id).all()
    empty_metrics = GmvMetrics()
    return [CreativeOut(
        id=c.id, campaign_id=c.campaign_id, name=c.name,
        status=c.status, video_url=c.video_url,
        metrics=GmvMetrics(cost=c.cost, sku_orders=c.sku_orders, cost_per_order=c.cost_per_order, gross_revenue=c.gross_revenue, roi=c.roi),
        prev_metrics=empty_metrics,
    ) for c in creatives]

@router.patch("/{creative_id}/status")
def update_creative_status(creative_id: str, status: str, db: Session = Depends(get_db), _=Depends(get_current_user)):
    """status: active | paused"""
    creative = db.query(Creative).filter_by(id=creative_id).first()
    if not creative:
        raise HTTPException(status_code=404, detail="Creative not found")
    campaign = db.query(Campaign).filter_by(id=creative.campaign_id).first()
    client = _get_shop_client(campaign.company_id, db)
    api_status = "ENABLE" if status == "active" else "DISABLE"
    client.update_creative_status(creative_id, creative.campaign_id, api_status)
    creative.status = status
    db.commit()
    return {"status": status}
```

- [ ] **Step 5: app/api/alerts.py**

```python
# app/api/alerts.py
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from datetime import datetime
from app.database import get_db
from app.models.alert import Alert
from app.schemas.alert import AlertOut
from app.middleware.auth import get_current_user

router = APIRouter()

@router.get("/active", response_model=list[AlertOut])
def get_active_alerts(company_id: str = Query(...), db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.query(Alert).filter(Alert.company_id == company_id, Alert.resolved == False).order_by(Alert.created_at.desc()).all()

@router.get("/history", response_model=list[AlertOut])
def get_alert_history(company_id: str = Query(...), db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.query(Alert).filter(Alert.company_id == company_id).order_by(Alert.created_at.desc()).limit(50).all()

@router.patch("/{alert_id}/resolve")
def resolve_alert(alert_id: str, db: Session = Depends(get_db), _=Depends(get_current_user)):
    alert = db.query(Alert).filter_by(id=alert_id).first()
    if alert:
        alert.resolved = True
        alert.resolved_at = datetime.utcnow()
        db.commit()
    return {"resolved": True}
```

- [ ] **Step 6: app/api/__init__.py**

```python
# app/api/__init__.py
```

- [ ] **Step 7: Verify endpoints**

```bash
uvicorn app.main:app --reload
# curl http://localhost:8000/docs — Swagger UI mở được
```

- [ ] **Step 8: Commit**

```bash
git add . && git commit -m "feat: API endpoints — companies, campaigns, GMV, creatives, alerts"
```

---

## Task 8: Background Sync Job

**Files:**
- Create: `backend/app/jobs/__init__.py`
- Create: `backend/app/jobs/sync_metrics.py`

- [ ] **Step 1: app/jobs/sync_metrics.py**

```python
# app/jobs/sync_metrics.py
"""
APScheduler job — sync metrics từ TikTok mỗi giờ.
1. Lấy danh sách companies + credentials từ DB
2. TikTok Ads API: sync Standard campaign metrics
3. TikTok Shop API: sync GMV campaign metrics + creatives
4. Alert engine: re-evaluate sau khi sync
"""
from apscheduler.schedulers.background import BackgroundScheduler
from datetime import date, timedelta, datetime
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.company import Company
from app.models.campaign import Campaign, CampaignMetrics
from app.models.creative import Creative
from app.models.credential import PlatformCredential
from app.services.tiktok_ads import TikTokAdsClient
from app.services.tiktok_shop import TikTokShopClient
from app.services.crypto import decrypt_credentials
from app.services.alert_engine import evaluate_campaign
import uuid, logging

logger = logging.getLogger(__name__)
scheduler = BackgroundScheduler()

def sync_all():
    db = SessionLocal()
    try:
        companies = db.query(Company).all()
        for company in companies:
            try:
                _sync_company(db, company)
            except Exception as e:
                logger.error(f"Sync failed for company {company.id}: {e}")
    finally:
        db.close()

def _sync_company(db: Session, company):
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

    # Sync Standard campaigns
    std_campaigns = db.query(Campaign).filter(Campaign.company_id == company.id, Campaign.type == "standard").all()
    for campaign in std_campaigns:
        try:
            rows = ads_client.get_campaign_metrics(campaign.id, start, today)
            for row in rows:
                day = row["dimensions"]["stat_time_day"][:10]
                m = row["metrics"]
                existing = db.query(CampaignMetrics).filter_by(campaign_id=campaign.id, date=day).first()
                if existing:
                    _update_std_metrics(existing, m)
                else:
                    record = CampaignMetrics(campaign_id=campaign.id, date=day)
                    _update_std_metrics(record, m)
                    db.add(record)
            campaign.last_synced_at = datetime.utcnow()

            # Alert check
            latest = db.query(CampaignMetrics).filter_by(campaign_id=campaign.id).order_by(CampaignMetrics.date.desc()).first()
            prev = db.query(CampaignMetrics).filter(
                CampaignMetrics.campaign_id == campaign.id,
                CampaignMetrics.date < (today - timedelta(days=7)).strftime("%Y-%m-%d"),
            ).order_by(CampaignMetrics.date.desc()).first()
            if latest:
                evaluate_campaign(db, campaign,
                    {"roas": latest.roas, "cpc": latest.cpc, "ctr": latest.ctr},
                    {"roas": prev.roas if prev else 0},
                )
        except Exception as e:
            logger.error(f"Standard campaign sync failed {campaign.id}: {e}")

    # Sync GMV campaigns
    gmv_campaigns = db.query(Campaign).filter(
        Campaign.company_id == company.id,
        Campaign.type.in_(["gmv_product", "gmv_live"]),
    ).all()
    for campaign in gmv_campaigns:
        try:
            metrics = shop_client.get_gmv_campaign_metrics(
                campaign.id, start.strftime("%Y-%m-%d"), today.strftime("%Y-%m-%d")
            )
            prev_metrics = shop_client.get_gmv_campaign_metrics(
                campaign.id,
                (start - timedelta(days=7)).strftime("%Y-%m-%d"),
                (start - timedelta(days=1)).strftime("%Y-%m-%d"),
            )
            campaign.last_synced_at = datetime.utcnow()
            evaluate_campaign(db, campaign, metrics, prev_metrics)

            # Sync creatives nếu là GMV Product
            if campaign.type == "gmv_product":
                creatives_data = shop_client.list_creatives(campaign.id)
                for cr_data in creatives_data:
                    cr_id = cr_data.get("creative_id") or cr_data.get("material_id")
                    existing = db.query(Creative).filter_by(id=cr_id).first()
                    if existing:
                        existing.status = "active" if cr_data.get("status") == "ENABLE" else "paused"
                    else:
                        db.add(Creative(
                            id=cr_id, campaign_id=campaign.id,
                            name=cr_data.get("name", f"Creative {cr_id[:8]}"),
                            status="active" if cr_data.get("status") == "ENABLE" else "paused",
                        ))
        except Exception as e:
            logger.error(f"GMV campaign sync failed {campaign.id}: {e}")

    db.commit()

def _update_std_metrics(record: CampaignMetrics, m: dict):
    record.spend = float(m.get("spend", 0))
    record.roas = float(m.get("real_time_roas", 0))
    record.impressions = int(m.get("impressions", 0))
    record.clicks = int(m.get("clicks", 0))
    record.ctr = float(m.get("ctr", 0))
    record.cpc = float(m.get("cpc", 0))
    record.conversions = int(m.get("conversion", 0))
    spend = record.spend
    conv = record.conversions
    record.cpa = spend / conv if conv else 0

def start_scheduler():
    scheduler.add_job(sync_all, "interval", hours=1, id="sync_metrics", replace_existing=True)
    scheduler.start()
    logger.info("Metrics sync scheduler started — interval: 1 hour")
```

- [ ] **Step 2: app/jobs/__init__.py**

```python
# empty
```

- [ ] **Step 3: Verify scheduler starts**

```bash
uvicorn app.main:app --reload
# Log: "Metrics sync scheduler started — interval: 1 hour"
```

- [ ] **Step 4: Commit**

```bash
git add . && git commit -m "feat: APScheduler background sync — TikTok Ads + Shop API mỗi giờ"
```

---

## Task 9: Docker Setup

**Files:**
- Create: `backend/docker/Dockerfile.backend`
- Create: `docker-compose.yml` (root)

- [ ] **Step 1: docker/Dockerfile.backend**

```dockerfile
FROM python:3.12-slim

WORKDIR /app

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .

ENV PYTHONPATH=/app
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

- [ ] **Step 2: docker-compose.yml (root)**

```yaml
version: '3.8'
services:
  backend:
    build:
      context: .
      dockerfile: backend/docker/Dockerfile.backend
    ports:
      - "8000:8000"
    volumes:
      - sqlite_data:/data
    environment:
      - DATABASE_URL=sqlite:////data/dm.db
      - SECRET_KEY=${SECRET_KEY:-dev-secret-key}
      - ENCRYPTION_KEY=${ENCRYPTION_KEY:-0000000000000000000000000000000000000000000000000000000000000000}
      - ADMIN_EMAIL=${ADMIN_EMAIL:-admin@example.com}
      - ADMIN_PASSWORD=${ADMIN_PASSWORD:-changeme}
    restart: unless-stopped

  frontend:
    build:
      context: .
      dockerfile: frontend/docker/Dockerfile.frontend
    ports:
      - "3000:80"
    depends_on:
      - backend
    restart: unless-stopped

volumes:
  sqlite_data:
```

- [ ] **Step 3: frontend/docker/Dockerfile.frontend**

```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY frontend/docker/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

- [ ] **Step 4: frontend/docker/nginx.conf**

```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://backend:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

- [ ] **Step 5: Verify build**

```bash
docker-compose build
docker-compose up -d
# Test: curl http://localhost:8000/api/health
```

- [ ] **Step 6: Commit**

```bash
git add . && git commit -m "feat: Docker setup — backend + frontend containers"
```

---

## Task 10: Connect Frontend → Backend

Thay thế mock data trong frontend bằng API calls thực.

**Files cần thay đổi:**
- Create: `frontend/src/api/client.ts` — axios/fetch wrapper với auth header
- Create: `frontend/src/api/campaigns.ts` — API calls cho campaigns
- Create: `frontend/src/api/gmv.ts` — API calls cho GMV
- Modify: `frontend/src/pages/Dashboard.tsx` — dùng `useQuery` thay mock
- Modify: `frontend/src/pages/Campaigns.tsx` — dùng `useQuery`

- [ ] **Step 1: Cài react-query và axios trong frontend**

```bash
cd frontend && npm install @tanstack/react-query axios
```

- [ ] **Step 2: frontend/src/api/client.ts**

```typescript
// src/api/client.ts
import axios from 'axios'

const api = axios.create({ baseURL: '/api/v1' })

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('access_token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) { localStorage.removeItem('access_token'); window.location.href = '/login' }
    return Promise.reject(err)
  }
)

export default api
```

- [ ] **Step 3: frontend/src/api/campaigns.ts**

```typescript
// src/api/campaigns.ts
import api from './client'

export async function fetchCampaigns(companyId: string, period: number) {
  const [std, gmv] = await Promise.all([
    api.get('/campaigns/', { params: { company_id: companyId, period } }),
    api.get('/gmv/campaigns', { params: { company_id: companyId, period } }),
  ])
  return [...std.data, ...gmv.data]
}

export async function updateCampaignStatus(id: string, status: 'active' | 'paused', type: string) {
  const path = type === 'standard' ? `/campaigns/${id}/status` : `/gmv/campaigns/${id}/status`
  const r = await api.patch(path, null, { params: { status } })
  return r.data
}

export async function updateCampaignBudget(id: string, budget: number, type: string) {
  const path = type === 'standard' ? `/campaigns/${id}/budget` : `/gmv/campaigns/${id}/budget`
  const r = await api.patch(path, null, { params: { budget } })
  return r.data
}

export async function fetchCreatives(campaignId: string) {
  const r = await api.get(`/creatives/${campaignId}`)
  return r.data
}

export async function updateCreativeStatus(creativeId: string, status: 'active' | 'paused') {
  const r = await api.patch(`/creatives/${creativeId}/status`, null, { params: { status } })
  return r.data
}
```

- [ ] **Step 4: Wrap App trong QueryClientProvider**

```typescript
// src/main.tsx — thêm QueryClient
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 5 * 60 * 1000 } } })
// Wrap <App /> trong <QueryClientProvider client={queryClient}>
```

- [ ] **Step 5: Dashboard dùng useQuery**

```typescript
// Thêm vào Dashboard.tsx — thay getCampaigns(company.id) bằng:
import { useQuery } from '@tanstack/react-query'
import { fetchCampaigns } from '@/api/campaigns'

const { data: campaigns = [], isLoading } = useQuery({
  queryKey: ['campaigns', company?.id, period],
  queryFn: () => company ? fetchCampaigns(company.id, parseInt(period)) : [],
  enabled: !!company,
})
// Giữ mock data như fallback khi backend chưa sẵn sàng: data ?? getMockCampaigns(company.id)
```

- [ ] **Step 6: Verify full stack**

```bash
docker-compose up -d
# Frontend: http://localhost:3000
# Backend Swagger: http://localhost:8000/docs
# Đăng nhập, kiểm tra campaigns load từ API (hoặc empty nếu chưa có data)
```

- [ ] **Step 7: Final commit**

```bash
git add . && git commit -m "feat: connect frontend to backend API via React Query"
```

---

## Self-Review

**Backend coverage:**
- ✅ FastAPI + SQLAlchemy + SQLite (local) / PostgreSQL (VPS-ready)
- ✅ TikTok Ads API v1.3: list_campaigns, get_metrics, pause/enable, update_budget, create_campaign
- ✅ TikTok Shop API: get_gmv_metrics, list_creatives, pause/enable creative
- ✅ GMV merge layer: join Ads API + Shop API theo campaign_id
- ✅ APScheduler: sync metrics + creatives mỗi giờ, chạy alert engine sau sync
- ✅ Alert engine: budget%, ROAS, ROI, delta ROI — tạo Alert records, dedup
- ✅ JWT auth (hardcoded admin local, thêm DB user nếu cần)
- ✅ AES-256-GCM encrypted credentials, per company
- ✅ Multi-company: company_id filter trên tất cả queries
- ✅ Docker: Dockerfile.backend + docker-compose.yml local
- ✅ Frontend → Backend via React Query + axios interceptor

**Không bao gồm:**
- Facebook/Google (dropped per user request)
- Multi-user auth (chỉ 1 admin — thêm sau nếu cần)
- GMV Live creative management (read-only metrics only)

**API Endpoints tổng hợp:**
```
POST /api/v1/auth/login
GET  /api/v1/companies/
POST /api/v1/companies/
POST /api/v1/companies/{id}/credentials/tiktok-ads
POST /api/v1/companies/{id}/credentials/tiktok-shop
GET  /api/v1/campaigns/?company_id=&period=
POST /api/v1/campaigns/?company_id=
PATCH /api/v1/campaigns/{id}/status?status=
PATCH /api/v1/campaigns/{id}/budget?budget=
PATCH /api/v1/campaigns/{id}/alert-config
GET  /api/v1/gmv/campaigns?company_id=&period=
PATCH /api/v1/gmv/campaigns/{id}/status?status=
PATCH /api/v1/gmv/campaigns/{id}/budget?budget=
GET  /api/v1/creatives/{campaign_id}
PATCH /api/v1/creatives/{id}/status?status=
GET  /api/v1/alerts/active?company_id=
GET  /api/v1/alerts/history?company_id=
PATCH /api/v1/alerts/{id}/resolve
GET  /api/health
```
