---
name: platform-integration
description: "Tích hợp API TikTok Ads, Facebook Ads, Google Ads. Trigger khi: setup platform, kết nối tài khoản quảng cáo, cấu hình API credentials, sync campaigns từ platform, test kết nối platform."
---

# Platform Integration Skill

Skill cho `integration-dev` agent implement adapters cho từng ad platform.

## TikTok Ads API

- Base URL: `https://business-api.tiktok.com/open_api/v1.3/`
- Auth: Access Token (long-lived) trong header `Access-Token`
- Key endpoints: `/campaign/get/`, `/campaign/create/`, `/campaign/update/`, `/campaign/status/update/`
- Metrics: `/report/integrated/get/` với `metrics=["spend","impressions","clicks","ctr","cpc"]`
- Rate limit: 100 requests/min per advertiser

## Facebook Marketing API

- Base URL: `https://graph.facebook.com/v18.0/`
- Auth: OAuth 2.0 Access Token
- Key objects: Campaign → AdSet → Ad (3 levels)
- Endpoints: `/{ad_account_id}/campaigns`, `/{campaign_id}/adsets`, `/{adset_id}/ads`
- Insights: `/{object_id}/insights?fields=spend,impressions,clicks,ctr,cpc,roas`
- Rate limit: Varies by endpoint, handle `X-Business-Use-Case-Usage` header

## Google Ads API

- Use `google-ads-python` library
- Auth: OAuth 2.0 + Developer Token
- Resource hierarchy: Customer → Campaign → AdGroup → Ad
- Metrics via `GoogleAdsService.search()` với GAQL
- Rate limit: 1000 operations/request

## PlatformAdapter Interface

```python
from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import date

@dataclass
class CampaignData:
    platform_id: str
    name: str
    status: str  # ACTIVE, PAUSED, DELETED
    budget: float
    spend: float

class PlatformAdapter(ABC):
    @abstractmethod
    def authenticate(self, credentials: dict) -> bool: ...
    
    @abstractmethod
    def list_campaigns(self) -> list[CampaignData]: ...
    
    @abstractmethod
    def pause_campaign(self, platform_id: str) -> bool: ...
    
    @abstractmethod
    def enable_campaign(self, platform_id: str) -> bool: ...
    
    @abstractmethod
    def get_metrics(self, platform_id: str, start: date, end: date) -> dict: ...
```

## Error Handling

- `401 Unauthorized` → Token expired, refresh hoặc prompt user re-auth
- `429 Rate Limit` → Exponential backoff: 1s, 2s, 4s (max 3 retries)
- Platform-specific errors → Map về `PlatformError(code, message, platform)`

## Credentials Storage

Lưu credentials trong DB table `platform_credentials`:
```sql
CREATE TABLE platform_credentials (
    id INTEGER PRIMARY KEY,
    platform VARCHAR(20),
    account_id VARCHAR(100),
    credentials_encrypted TEXT,  -- AES-256 encrypted JSON
    created_at DATETIME,
    updated_at DATETIME
);
```
