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
        return hmac.new(self.app_secret.encode(), base_str.encode(), hashlib.sha256).hexdigest()

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

    def list_campaigns(self) -> list[dict]:
        """List all GMV Max campaigns from TikTok Shop Promotion API."""
        results = []
        page_token = None
        while True:
            params = {"page_size": 50}
            if page_token:
                params["page_token"] = page_token
            data = self._get("/api/v2/promotion/campaign/list", params)
            campaigns = data.get("campaigns") or data.get("campaign_list") or []
            results.extend(campaigns)
            page_token = data.get("next_page_token") or data.get("next_cursor")
            if not page_token or not campaigns:
                break
        return results

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
