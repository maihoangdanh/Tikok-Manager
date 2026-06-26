import uuid
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.campaign import Campaign
from app.models.alert import Alert

def evaluate_campaign(db: Session, campaign: Campaign, metrics: dict, prev_metrics: dict):
    cfg = campaign.alert_config or {}
    alerts_to_create = []

    if campaign.budget_daily > 0:
        spend_pct = (campaign.budget_spend / campaign.budget_daily) * 100
        if spend_pct >= cfg.get("budget_critical_pct", 95):
            alerts_to_create.append(_make_alert(campaign, "critical",
                f"Budget {spend_pct:.0f}% — sap het ngan sach hom nay"))
        elif spend_pct >= cfg.get("budget_warning_pct", 80):
            alerts_to_create.append(_make_alert(campaign, "warning", f"Budget {spend_pct:.0f}% da dung"))

    if campaign.type == "standard":
        roas = metrics.get("roas", 0)
        min_roas = cfg.get("min_roas", 2.0)
        if roas > 0 and roas < min_roas:
            alerts_to_create.append(_make_alert(campaign, "warning", f"ROAS {roas:.1f}x thap hon muc tieu {min_roas}x"))

    if campaign.type in ("gmv_product", "gmv_live"):
        roi = metrics.get("roi", 0)
        min_roi = cfg.get("min_roi", 3.0)
        if roi > 0 and roi < min_roi:
            alerts_to_create.append(_make_alert(campaign, "warning", f"ROI {roi:.2f}x thap hon muc tieu {min_roi}x"))

    existing_msgs = {a.message for a in db.query(Alert).filter(
        Alert.campaign_id == campaign.id, Alert.resolved == False).all()}
    for alert in alerts_to_create:
        if alert.message not in existing_msgs:
            db.add(alert)
    if alerts_to_create:
        db.commit()

def _make_alert(campaign, severity: str, message: str) -> Alert:
    return Alert(id=str(uuid.uuid4()), company_id=campaign.company_id, campaign_id=campaign.id,
                 campaign_name=campaign.name, severity=severity, message=message, created_at=datetime.utcnow())
