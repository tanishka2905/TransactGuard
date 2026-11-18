import datetime
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.db.session import get_db
from app.db.models import Transaction, FraudAlert, User
from app.schemas.transaction import (
    TransactionCreate, 
    TransactionResponse, 
    AlertResponse,
    P2PTransferRequest,
    P2PPreScreenResponse
)
from app.engine.feature_extractor import FeatureExtractor
from app.engine.ml_engine import MLEngine
from app.engine.anomaly_engine import AnomalyEngine
from app.engine.rule_engine import RuleEngine
from app.engine.risk_calculator import RiskCalculator
from app.engine.behavior_tracker import BehaviorTracker

router = APIRouter(prefix="/transactions", tags=["Transactions"])

# Reference to active websocket broadcast manager (injected from main.py)
_ws_broadcast_callback = None

def set_ws_broadcast_callback(cb):
    global _ws_broadcast_callback
    _ws_broadcast_callback = cb

async def broadcast_event(event_type: str, data: dict):
    if _ws_broadcast_callback:
        await _ws_broadcast_callback({"event": event_type, "data": data})

@router.post("", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
async def process_transaction(payload: TransactionCreate, db: Session = Depends(get_db)):
    """
    Ingests and evaluates incoming financial transaction in real-time.
    Runs behavioral feature extraction, supervised ML, unsupervised anomaly scoring, 
    rule engine, and unified risk synthesis.
    """
    # 1. Enforce server-generated timestamp
    now = datetime.datetime.utcnow()
    txn_time = payload.timestamp if payload.timestamp and payload.timestamp <= now else now
    
    # 2. Check if user exists, else auto-register as baseline customer
    user = db.query(User).filter(User.id == payload.user_id).first()
    if not user:
        user = User(
            id=payload.user_id,
            name=f"Customer {payload.user_id[-6:]}",
            email=f"{payload.user_id}@fintech-client.io",
            risk_segment="LOW"
        )
        db.add(user)
        db.commit()

    # 3. Extract features
    features = FeatureExtractor.extract_features(
        db=db,
        user_id=payload.user_id,
        amount=payload.amount,
        timestamp=txn_time,
        device_id=payload.device_id,
        location_name=payload.location_name or "Mumbai, IN",
        latitude=payload.latitude,
        longitude=payload.longitude,
        beneficiary_id=payload.beneficiary_id
    )

    # 4. Run ML Models & Rules
    ml_prob, ml_contributions = MLEngine.predict_fraud_probability(features)
    anomaly_score = AnomalyEngine.compute_anomaly_score(features)
    rule_score, rule_reasons, rule_contributions = RuleEngine.evaluate_rules(features)

    # 5. Calculate Unified Risk Score & Decision
    reasons = list(rule_reasons)
    final_score, risk_level, txn_status, velocity_score, feature_breakdown = RiskCalculator.calculate_unified_risk(
        ml_prob=ml_prob,
        anomaly_score=anomaly_score,
        rule_score=rule_score,
        features=features,
        reasons=reasons
    )

    # Merge rule contributions into feature breakdown
    feature_breakdown["rules_detail"] = rule_contributions
    feature_breakdown["ml_detail"] = ml_contributions

    # 6. Save Transaction Record
    txn_id = f"TXN-{uuid.uuid4().hex[:10].upper()}"
    txn = Transaction(
        id=txn_id,
        user_id=payload.user_id,
        amount=payload.amount,
        currency=payload.currency,
        timestamp=txn_time,
        payment_method=payload.payment_method,
        merchant_id=payload.merchant_id,
        merchant_category=payload.merchant_category,
        device_id=payload.device_id,
        device_fingerprint=payload.device_fingerprint or f"fp_{payload.device_id[:8]}",
        ip_address=payload.ip_address,
        network_type=payload.network_type,
        location_name=payload.location_name,
        latitude=payload.latitude,
        longitude=payload.longitude,
        beneficiary_id=payload.beneficiary_id,
        beneficiary_name=payload.beneficiary_name,
        beneficiary_user_id=payload.beneficiary_user_id,
        sender_balance_after=payload.sender_balance_after,
        beneficiary_balance_after=payload.beneficiary_balance_after,
        transaction_type=payload.transaction_type,
        status=txn_status,
        risk_score=final_score,
        risk_level=risk_level,
        ml_probability=ml_prob,
        anomaly_score=anomaly_score,
        rule_score=rule_score,
        velocity_score=velocity_score,
        reasons=reasons if reasons else ["Transaction satisfies standard behavioral baselines and low-risk heuristics."],
        feature_breakdown=feature_breakdown,
        source=payload.source or "API",
        created_at=now
    )
    db.add(txn)
    db.commit()
    db.refresh(txn)

    # 7. Create Fraud Alert if High or Critical
    alert_created = None
    if risk_level in ["HIGH", "CRITICAL"]:
        alert_id = f"ALT-{uuid.uuid4().hex[:8].upper()}"
        alert = FraudAlert(
            id=alert_id,
            transaction_id=txn.id,
            user_id=txn.user_id,
            risk_score=txn.risk_score,
            risk_level=txn.risk_level,
            reasons=txn.reasons,
            status="NEW",
            analyst_notes=f"Automated risk triage: Flagged by {risk_level} threshold constraint."
        )
        db.add(alert)
        db.commit()
        db.refresh(alert)
        alert_created = {
            "id": alert.id,
            "transaction_id": alert.transaction_id,
            "user_id": alert.user_id,
            "risk_score": alert.risk_score,
            "risk_level": alert.risk_level,
            "reasons": alert.reasons,
            "status": alert.status,
            "created_at": alert.created_at.isoformat()
        }

    # 8. Dynamic Behavioral Intelligence Learning
    BehaviorTracker.update_profile(db, payload.user_id, txn)

    # 9. Real-Time Broadcast via WebSockets
    txn_data = {
        "id": txn.id,
        "user_id": txn.user_id,
        "amount": txn.amount,
        "currency": txn.currency,
        "payment_method": txn.payment_method,
        "merchant_category": txn.merchant_category,
        "location_name": txn.location_name,
        "timestamp": txn.timestamp.isoformat(),
        "status": txn.status,
        "risk_score": txn.risk_score,
        "risk_level": txn.risk_level,
        "ml_probability": txn.ml_probability,
        "anomaly_score": txn.anomaly_score,
        "beneficiary_id": txn.beneficiary_id,
        "beneficiary_name": txn.beneficiary_name,
        "beneficiary_user_id": txn.beneficiary_user_id,
        "sender_balance_after": txn.sender_balance_after,
        "beneficiary_balance_after": txn.beneficiary_balance_after,
        "transaction_type": txn.transaction_type,
        "reasons": txn.reasons,
        "feature_breakdown": txn.feature_breakdown,
        "is_live": True
    }
    await broadcast_event("NEW_TRANSACTION", txn_data)
    if alert_created:
        await broadcast_event("NEW_ALERT", alert_created)

    txn_dict = txn_data.copy()
    txn_dict["created_at"] = txn.created_at
    txn_dict["device_id"] = txn.device_id
    txn_dict["rule_score"] = txn.rule_score
    txn_dict["velocity_score"] = txn.velocity_score
    return txn_dict

@router.get("/live", response_model=List[TransactionResponse])
def get_live_transactions(
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    """Retrieve transactions received within the last 24 hours."""
    cutoff = datetime.datetime.utcnow() - datetime.timedelta(hours=24)
    txns = db.query(Transaction).filter(
        Transaction.timestamp >= cutoff
    ).order_by(desc(Transaction.timestamp)).limit(limit).all()

    result = []
    for t in txns:
        d = {c.name: getattr(t, c.name) for c in t.__table__.columns}
        d["is_live"] = True
        result.append(d)
    return result

@router.get("/history", response_model=List[TransactionResponse])
def get_transaction_history(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    user_id: Optional[str] = None,
    risk_level: Optional[str] = None,
    payment_method: Optional[str] = None,
    min_amount: Optional[float] = None,
    max_amount: Optional[float] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Retrieve historical transactions with flexible multi-parameter filtering."""
    query = db.query(Transaction)
    
    if user_id:
        query = query.filter(Transaction.user_id == user_id)
    if risk_level and risk_level.upper() != "ALL":
        query = query.filter(Transaction.risk_level == risk_level.upper())
    if payment_method and payment_method.upper() != "ALL":
        query = query.filter(Transaction.payment_method == payment_method.upper())
    if min_amount is not None:
        query = query.filter(Transaction.amount >= min_amount)
    if max_amount is not None:
        query = query.filter(Transaction.amount <= max_amount)
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (Transaction.id.ilike(search_pattern)) |
            (Transaction.user_id.ilike(search_pattern)) |
            (Transaction.location_name.ilike(search_pattern))
        )

    now = datetime.datetime.utcnow()
    cutoff = now - datetime.timedelta(hours=24)
    txns = query.order_by(desc(Transaction.timestamp)).offset(skip).limit(limit).all()

    result = []
    for t in txns:
        d = {c.name: getattr(t, c.name) for c in t.__table__.columns}
        d["is_live"] = (t.timestamp >= cutoff)
        result.append(d)
    return result

@router.get("/{txn_id}", response_model=TransactionResponse)
def get_transaction_details(txn_id: str, db: Session = Depends(get_db)):
    """Fetch complete forensic audit breakdown for a specific transaction."""
    txn = db.query(Transaction).filter(Transaction.id == txn_id).first()
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    d = {c.name: getattr(txn, c.name) for c in txn.__table__.columns}
    d["is_live"] = (txn.timestamp >= datetime.datetime.utcnow() - datetime.timedelta(hours=24))
    return d

@router.post("/p2p/pre-screen", response_model=P2PPreScreenResponse)
def pre_screen_p2p_transfer(payload: P2PTransferRequest, db: Session = Depends(get_db)):
    """
    Live AI risk pre-screening and validation before user confirms a 2-user transfer.
    Evaluates ML fraud probability, behavioral deviations, recipient familiarity, and warnings.
    """
    sender = db.query(User).filter(User.id == payload.sender_id).first()
    if not sender:
        raise HTTPException(status_code=404, detail=f"Sender user '{payload.sender_id}' not found")

    receiver = db.query(User).filter(User.id == payload.receiver_id).first()
    if not receiver:
        raise HTTPException(status_code=404, detail=f"Receiver user '{payload.receiver_id}' not found")

    if sender.id == receiver.id:
        raise HTTPException(status_code=400, detail="Cannot transfer funds to the same user account")

    sender_bal = sender.balance if sender.balance is not None else 0.0
    if sender_bal < payload.amount:
        raise HTTPException(status_code=400, detail=f"Insufficient balance. Available: {sender_bal:,.2f} {payload.currency}, Requested: {payload.amount:,.2f} {payload.currency}")

    # Extract features for sender
    now = datetime.datetime.utcnow()
    features = FeatureExtractor.extract_features(
        db=db,
        user_id=sender.id,
        amount=payload.amount,
        timestamp=now,
        device_id=payload.device_id or (sender.behavior_profile.known_devices[0] if sender.behavior_profile and sender.behavior_profile.known_devices else "dev_web_portal"),
        location_name=payload.location_name or sender.city or "Mumbai, IN",
        latitude=payload.latitude or 19.0760,
        longitude=payload.longitude or 72.8777,
        beneficiary_id=receiver.id
    )

    ml_prob, ml_contributions = MLEngine.predict_fraud_probability(features)
    anomaly_score = AnomalyEngine.compute_anomaly_score(features)
    rule_score, rule_reasons, rule_contributions = RuleEngine.evaluate_rules(features)

    reasons = list(rule_reasons)
    final_score, risk_level, txn_status, velocity_score, feature_breakdown = RiskCalculator.calculate_unified_risk(
        ml_prob=ml_prob,
        anomaly_score=anomaly_score,
        rule_score=rule_score,
        features=features,
        reasons=reasons
    )

    # Check recipient familiarity
    frequent_bens = sender.behavior_profile.frequent_beneficiaries if sender.behavior_profile and sender.behavior_profile.frequent_beneficiaries else []
    is_new = (receiver.id not in frequent_bens and receiver.name not in frequent_bens)

    warnings = []
    if is_new:
        warnings.append(f"First-time transfer to recipient {receiver.name}.")
    if features.get("amount_ratio", 1.0) >= 2.5:
        warnings.append(f"Amount is {features.get('amount_ratio', 1.0)}x higher than sender's historical average.")
    if risk_level in ["HIGH", "CRITICAL"]:
        warnings.append("High risk deviation detected: Anomaly alert will be logged upon continuation.")

    return P2PPreScreenResponse(
        sender_id=sender.id,
        sender_name=sender.name,
        sender_balance=round(sender_bal, 2),
        sender_balance_after=round(sender_bal - payload.amount, 2),
        receiver_id=receiver.id,
        receiver_name=receiver.name,
        receiver_balance=round(receiver.balance or 0.0, 2),
        receiver_balance_after=round((receiver.balance or 0.0) + payload.amount, 2),
        amount=payload.amount,
        currency=payload.currency,
        risk_score=final_score,
        risk_level=risk_level,
        ml_probability=ml_prob,
        anomaly_score=anomaly_score,
        rule_score=rule_score,
        velocity_score=velocity_score,
        reasons=reasons if reasons else [f"Standard legitimate baseline transfer from {sender.name} to {receiver.name}."],
        warnings=warnings,
        requires_confirmation=(risk_level in ["MEDIUM", "HIGH", "CRITICAL"] or is_new or payload.amount > 5000.0),
        is_new_beneficiary=is_new,
        sender_city=sender.city or "Mumbai, IN",
        receiver_city=receiver.city or "Bengaluru, IN"
    )

@router.post("/p2p", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
async def execute_p2p_transfer(payload: P2PTransferRequest, db: Session = Depends(get_db)):
    """
    Executes an authenticated peer-to-peer transfer between two platform users.
    Debits sender, credits receiver, evaluates multi-signal fraud score, saves audit record,
    and streams real-time telemetry over WebSockets.
    """
    sender = db.query(User).filter(User.id == payload.sender_id).first()
    if not sender:
        raise HTTPException(status_code=404, detail=f"Sender user '{payload.sender_id}' not found")

    receiver = db.query(User).filter(User.id == payload.receiver_id).first()
    if not receiver:
        raise HTTPException(status_code=404, detail=f"Receiver user '{payload.receiver_id}' not found")

    if sender.id == receiver.id:
        raise HTTPException(status_code=400, detail="Cannot transfer funds to the same user account")

    sender_bal = sender.balance if sender.balance is not None else 0.0
    if sender_bal < payload.amount:
        raise HTTPException(status_code=400, detail=f"Insufficient balance. Available: {sender_bal:,.2f} {payload.currency}")

    # Debit sender and Credit receiver
    sender.balance = round(sender_bal - payload.amount, 2)
    receiver.balance = round((receiver.balance or 0.0) + payload.amount, 2)

    now = datetime.datetime.utcnow()
    device_id = payload.device_id or (sender.behavior_profile.known_devices[0] if sender.behavior_profile and sender.behavior_profile.known_devices else "dev_p2p_portal")
    location_name = payload.location_name or sender.city or "Mumbai, IN"

    # Extract behavioral and contextual features
    features = FeatureExtractor.extract_features(
        db=db,
        user_id=sender.id,
        amount=payload.amount,
        timestamp=now,
        device_id=device_id,
        location_name=location_name,
        latitude=payload.latitude or 19.0760,
        longitude=payload.longitude or 72.8777,
        beneficiary_id=receiver.id
    )

    # ML & Rule Scoring
    ml_prob, ml_contributions = MLEngine.predict_fraud_probability(features)
    anomaly_score = AnomalyEngine.compute_anomaly_score(features)
    rule_score, rule_reasons, rule_contributions = RuleEngine.evaluate_rules(features)

    reasons = list(rule_reasons)
    final_score, risk_level, txn_status, velocity_score, feature_breakdown = RiskCalculator.calculate_unified_risk(
        ml_prob=ml_prob,
        anomaly_score=anomaly_score,
        rule_score=rule_score,
        features=features,
        reasons=reasons
    )

    feature_breakdown["rules_detail"] = rule_contributions
    feature_breakdown["ml_detail"] = ml_contributions
    feature_breakdown["p2p_sender"] = {
        "id": sender.id,
        "name": sender.name,
        "balance_before": sender_bal,
        "balance_after": sender.balance,
        "city": sender.city
    }
    feature_breakdown["p2p_receiver"] = {
        "id": receiver.id,
        "name": receiver.name,
        "balance_before": round(receiver.balance - payload.amount, 2),
        "balance_after": receiver.balance,
        "city": receiver.city
    }

    txn_id = f"TXN-{uuid.uuid4().hex[:10].upper()}"
    txn = Transaction(
        id=txn_id,
        user_id=sender.id,
        amount=payload.amount,
        currency=payload.currency,
        timestamp=now,
        payment_method=payload.payment_method,
        merchant_id=f"p2p_{receiver.id}",
        merchant_category="P2P Transfer",
        device_id=device_id,
        device_fingerprint=f"fp_{device_id[:8]}",
        ip_address="103.21.124.50",
        network_type="Cellular",
        location_name=location_name,
        latitude=payload.latitude or 19.0760,
        longitude=payload.longitude or 72.8777,
        beneficiary_id=receiver.id,
        beneficiary_name=receiver.name,
        beneficiary_user_id=receiver.id,
        sender_balance_after=sender.balance,
        beneficiary_balance_after=receiver.balance,
        transaction_type="P2P_TRANSFER",
        status=txn_status,
        risk_score=final_score,
        risk_level=risk_level,
        ml_probability=ml_prob,
        anomaly_score=anomaly_score,
        rule_score=rule_score,
        velocity_score=velocity_score,
        reasons=reasons if reasons else [f"P2P transfer from {sender.name} to {receiver.name} authorized."],
        feature_breakdown=feature_breakdown,
        source="P2P_PORTAL",
        created_at=now
    )
    db.add(txn)
    db.commit()
    db.refresh(txn)

    # Fraud Alert if High / Critical
    alert_created = None
    if risk_level in ["HIGH", "CRITICAL"]:
        alert_id = f"ALT-{uuid.uuid4().hex[:8].upper()}"
        alert = FraudAlert(
            id=alert_id,
            transaction_id=txn.id,
            user_id=txn.user_id,
            risk_score=txn.risk_score,
            risk_level=txn.risk_level,
            reasons=txn.reasons,
            status="NEW",
            analyst_notes=f"Flagged P2P Transfer: {sender.name} -> {receiver.name} ({payload.amount:,.2f} {payload.currency})"
        )
        db.add(alert)
        db.commit()
        db.refresh(alert)
        alert_created = {
            "id": alert.id,
            "transaction_id": alert.transaction_id,
            "user_id": alert.user_id,
            "risk_score": alert.risk_score,
            "risk_level": alert.risk_level,
            "reasons": alert.reasons,
            "status": alert.status,
            "created_at": alert.created_at.isoformat()
        }

    # Behavioral Intelligence learning
    BehaviorTracker.update_profile(db, sender.id, txn)

    # Broadcast WebSocket event
    txn_data = {
        "id": txn.id,
        "user_id": txn.user_id,
        "amount": txn.amount,
        "currency": txn.currency,
        "payment_method": txn.payment_method,
        "merchant_category": txn.merchant_category,
        "location_name": txn.location_name,
        "timestamp": txn.timestamp.isoformat(),
        "status": txn.status,
        "risk_score": txn.risk_score,
        "risk_level": txn.risk_level,
        "ml_probability": txn.ml_probability,
        "anomaly_score": txn.anomaly_score,
        "beneficiary_id": txn.beneficiary_id,
        "beneficiary_name": txn.beneficiary_name,
        "beneficiary_user_id": txn.beneficiary_user_id,
        "sender_balance_after": txn.sender_balance_after,
        "beneficiary_balance_after": txn.beneficiary_balance_after,
        "transaction_type": txn.transaction_type,
        "reasons": txn.reasons,
        "feature_breakdown": txn.feature_breakdown,
        "is_live": True
    }
    await broadcast_event("NEW_TRANSACTION", txn_data)
    if alert_created:
        await broadcast_event("NEW_ALERT", alert_created)

    res = txn_data.copy()
    res["created_at"] = txn.created_at
    res["device_id"] = txn.device_id
    res["rule_score"] = txn.rule_score
    res["velocity_score"] = txn.velocity_score
    return res

@router.post("/{txn_id}/continue", response_model=TransactionResponse)
async def continue_transaction(txn_id: str, db: Session = Depends(get_db)):
    """Authorize and continue a held/flagged transaction after human/security confirmation."""
    txn = db.query(Transaction).filter(Transaction.id == txn_id).first()
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")

    txn.status = "APPROVED"
    alert = db.query(FraudAlert).filter(FraudAlert.transaction_id == txn.id).first()
    if alert:
        alert.status = "RESOLVED"
        alert.analyst_notes = "User confirmed transaction through security authorization popup."
        alert.updated_at = datetime.datetime.utcnow()

    db.commit()
    db.refresh(txn)

    d = {c.name: getattr(txn, c.name) for c in txn.__table__.columns}
    d["is_live"] = (txn.timestamp >= datetime.datetime.utcnow() - datetime.timedelta(hours=24))
    await broadcast_event("TRANSACTION_UPDATED", d)
    return d
