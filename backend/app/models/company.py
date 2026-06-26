from sqlalchemy import Column, String, JSON
from app.database import Base

class Company(Base):
    __tablename__ = "companies"
    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    initials = Column(String(4), nullable=False)
    color = Column(JSON, nullable=False, default={"bg": "#E6F1FB", "text": "#185FA5"})
