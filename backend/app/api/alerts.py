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
