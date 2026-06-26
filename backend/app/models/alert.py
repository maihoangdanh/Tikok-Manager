from sqlalchemy import Column, String, Boolean, DateTime
from datetime import datetime
from app.database import Base

class Alert(Base):
    __tablename__ = "alerts"
    id = Column(String, primary_key=True)
    company_id = Column(String, nullable=False, index=True)
    campaign_id = Column(String, nullable=False)
    campaign_name = Column(String, nullable=False)
    severity = Column(String(10), nullable=False)
    message = Column(String, nullable=False)
    resolved = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime)
