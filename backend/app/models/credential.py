from sqlalchemy import Column, String, DateTime
from datetime import datetime
from app.database import Base

class PlatformCredential(Base):
    __tablename__ = "platform_credentials"
    id = Column(String, primary_key=True)
    company_id = Column(String, nullable=False, index=True)
    platform = Column(String(20), nullable=False)
    credentials_encrypted = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
