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
            "fields": '["campaign_id","campaign_name","operation_status","secondary_status","budget","budget_mode","objective_type"]',
            "page_size": 100,
        })
        return data.get("list", [])

    def get_campaign_metrics(self, campaign_id: str, start_date: date, end_date: date) -> list:
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
