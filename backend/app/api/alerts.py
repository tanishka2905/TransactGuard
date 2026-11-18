from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from datetime import datetime

from app.db.session import get_db
from app.db.models import FraudAlert, Transaction
from app.schemas.transaction import AlertResponse, AlertUpdate

router = APIRouter(prefix="/alerts", tags=["Fraud Alerts"])

@router.get("", response_model=List[AlertResponse])
def get_alerts(
    status: Optional[str] = None,
    risk_level: Optional[str] = None,
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Retrieve active and historical fraud alerts for analyst triage."""
    query = db.query(FraudAlert)
    if status and status.upper() != "ALL":
        query = query.filter(FraudAlert.status == status.upper())
    if risk_level and risk_level.upper() != "ALL":
        query = query.filter(FraudAlert.risk_level == risk_level.upper())
    
    alerts = query.order_by(desc(FraudAlert.created_at)).limit(limit).all()
    return alerts

@router.patch("/{alert_id}", response_model=AlertResponse)
def update_alert_status(
    alert_id: str,
    payload: AlertUpdate,
    db: Session = Depends(get_db)
):
    """Update alert triage disposition (REVIEWING, CONFIRMED_FRAUD, FALSE_POSITIVE, RESOLVED)."""
    alert = db.query(FraudAlert).filter(FraudAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    valid_statuses = ["NEW", "REVIEWING", "RESOLVED", "FALSE_POSITIVE", "CONFIRMED_FRAUD"]
    if payload.status.upper() not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of {valid_statuses}")
    
    alert.status = payload.status.upper()
    if payload.analyst_notes is not None:
        alert.analyst_notes = payload.analyst_notes
    if payload.assigned_to is not None:
        alert.assigned_to = payload.assigned_to
    
    alert.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(alert)
    return alert
