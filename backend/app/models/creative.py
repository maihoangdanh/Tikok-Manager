from sqlalchemy import Column, String, Float, Integer, DateTime
from datetime import datetime
from app.database import Base

class Creative(Base):
    __tablename__ = "creatives"
    id = Column(String, primary_key=True)
    campaign_id = Column(String, nullable=False, index=True)
    name = Column(String, nullable=False)
    status = Column(String(20), nullable=False)
    video_url = Column(String)
    cost = Column(Float, default=0)
    sku_orders = Column(Integer, default=0)
    cost_per_order = Column(Float, default=0)
    gross_revenue = Column(Float, default=0)
    roi = Column(Float, default=0)
    last_synced_at = Column(DateTime)
