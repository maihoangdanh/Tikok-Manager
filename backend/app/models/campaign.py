from sqlalchemy import Column, String, Float, Integer, DateTime, JSON
from datetime import datetime
from app.database import Base

class Campaign(Base):
    __tablename__ = "campaigns"
    id = Column(String, primary_key=True)
    company_id = Column(String, nullable=False, index=True)
    name = Column(String, nullable=False)
    type = Column(String(20), nullable=False)
    status = Column(String(20), nullable=False)
    objective = Column(String(30))
    budget_daily = Column(Float, default=0)
    budget_spend = Column(Float, default=0)
    alert_config = Column(JSON, default={"budget_warning_pct": 80, "budget_critical_pct": 95, "min_roas": 2.0, "min_roi": 3.0})
    last_synced_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)

class CampaignMetrics(Base):
    __tablename__ = "campaign_metrics"
    id = Column(Integer, primary_key=True, autoincrement=True)
    campaign_id = Column(String, nullable=False, index=True)
    date = Column(String(10), nullable=False)
    spend = Column(Float, default=0)
    roas = Column(Float, default=0)
    impressions = Column(Integer, default=0)
    clicks = Column(Integer, default=0)
    ctr = Column(Float, default=0)
    cpc = Column(Float, default=0)
    conversions = Column(Integer, default=0)
    cpa = Column(Float, default=0)
    cost = Column(Float, default=0)
    sku_orders = Column(Integer, default=0)
    cost_per_order = Column(Float, default=0)
    gross_revenue = Column(Float, default=0)
    roi = Column(Float, default=0)
