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
    P2PPreScreenResponse,
    CounterfactualRequest,
    CounterfactualResponse,
    VerifyChallengeRequest
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
    raw_time = payload.timestamp
    if raw_time and raw_time.tzinfo is not None:
        raw_time = raw_time.replace(tzinfo=None)
    txn_time = raw_time if raw_time and raw_time <= now else now
    
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
        location_name=payload.location_name or "Moradabad, UP, IN",
        latitude=payload.latitude,
        longitude=payload.longitude,
        beneficiary_id=payload.beneficiary_id
    )

    # 4. Run ML Models & Rules with Multi-Model Comparison
    ml_prob, ml_contributions, model_comp, champ_id = MLEngine.predict_with_comparison(features)
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

    # Merge rule contributions & multi-model comparison into feature breakdown
    feature_breakdown["rules_detail"] = rule_contributions
    feature_breakdown["ml_detail"] = ml_contributions
    feature_breakdown["model_comparison"] = model_comp
    feature_breakdown["champion_model"] = champ_id

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
    txn_dict["model_comparison"] = feature_breakdown.get("model_comparison")
    txn_dict["active_champion_model"] = feature_breakdown.get("champion_model")
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

    # Extract features for sender with real GPS and temporal telemetry
    now = payload.timestamp or datetime.datetime.utcnow()
    if now.tzinfo is not None:
        now = now.replace(tzinfo=None)
    if now.tzinfo is not None:
        now = now.replace(tzinfo=None)
    features = FeatureExtractor.extract_features(
        db=db,
        user_id=sender.id,
        amount=payload.amount,
        timestamp=now,
        device_id=payload.device_id or (sender.behavior_profile.known_devices[0] if sender.behavior_profile and sender.behavior_profile.known_devices else "dev_web_portal"),
        location_name=payload.location_name or sender.city or "Moradabad, UP, IN",
        latitude=payload.latitude if payload.latitude is not None else (sender.behavior_profile.typical_lat if sender.behavior_profile and sender.behavior_profile.typical_lat else 28.8389),
        longitude=payload.longitude if payload.longitude is not None else (sender.behavior_profile.typical_lon if sender.behavior_profile and sender.behavior_profile.typical_lon else 78.7768),
        beneficiary_id=receiver.id
    )

    ml_prob, ml_contributions, model_comp, champ_id = MLEngine.predict_with_comparison(features)
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
        sender_city=payload.location_name or sender.city or "Moradabad, UP, IN",
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

    now = payload.timestamp or datetime.datetime.utcnow()
    if now.tzinfo is not None:
        now = now.replace(tzinfo=None)
    device_id = payload.device_id or (sender.behavior_profile.known_devices[0] if sender.behavior_profile and sender.behavior_profile.known_devices else "dev_p2p_portal")
    location_name = payload.location_name or sender.city or "Moradabad, UP, IN"
    lat = payload.latitude if payload.latitude is not None else (sender.behavior_profile.typical_lat if sender.behavior_profile and sender.behavior_profile.typical_lat else 28.8389)
    lon = payload.longitude if payload.longitude is not None else (sender.behavior_profile.typical_lon if sender.behavior_profile and sender.behavior_profile.typical_lon else 78.7768)

    # Extract behavioral and contextual features
    features = FeatureExtractor.extract_features(
        db=db,
        user_id=sender.id,
        amount=payload.amount,
        timestamp=now,
        device_id=device_id,
        location_name=location_name,
        latitude=lat,
        longitude=lon,
        beneficiary_id=receiver.id
    )

    # ML & Rule Scoring with Multi-Model Comparison
    ml_prob, ml_contributions, model_comp, champ_id = MLEngine.predict_with_comparison(features)
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

    # Settle balances ONLY if approved; if blocked/flagged, hold until user confirmation
    if txn_status == "APPROVED":
        sender.balance = round(sender_bal - payload.amount, 2)
        receiver.balance = round((receiver.balance or 0.0) + payload.amount, 2)
        p2p_settled = True
    else:
        sender.balance = sender_bal
        p2p_settled = False

    feature_breakdown["rules_detail"] = rule_contributions
    feature_breakdown["ml_detail"] = ml_contributions
    feature_breakdown["model_comparison"] = model_comp
    feature_breakdown["champion_model"] = champ_id
    feature_breakdown["p2p_settled"] = p2p_settled
    feature_breakdown["p2p_sender"] = {
        "id": sender.id,
        "name": sender.name,
        "balance_before": sender_bal,
        "balance_after": sender.balance,
        "city": payload.location_name or sender.city or "Moradabad, UP, IN"
    }
    feature_breakdown["p2p_receiver"] = {
        "id": receiver.id,
        "name": receiver.name,
        "balance_before": receiver.balance if not p2p_settled else round(receiver.balance - payload.amount, 2),
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
    res["model_comparison"] = feature_breakdown.get("model_comparison")
    res["active_champion_model"] = feature_breakdown.get("champion_model")
    return res

@router.post("/{txn_id}/confirm-genuine", response_model=TransactionResponse)
@router.post("/{txn_id}/continue", response_model=TransactionResponse)
async def confirm_genuine_transaction(txn_id: str, db: Session = Depends(get_db)):
    """
    Confirms and unblocks a blocked/flagged P2P or merchant transaction as genuine.
    1. Verifies transaction belongs to user/sender.
    2. Updates transaction status from BLOCKED / FLAGGED to APPROVED.
    3. Updates sender and receiver balances in the database if not already settled.
    4. Marks any linked alert in FraudAlert as RESOLVED_CONFIRMED_GENUINE.
    5. Calls BehaviorTracker.update_profile(force_trust=True) to whitelist device/location in Fraud DNA.
    6. Broadcasts TRANSACTION_UNBLOCKED and ALERT_RESOLVED to all WebSocket clients.
    """
    txn = db.query(Transaction).filter(Transaction.id == txn_id).first()
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")

    txn.status = "APPROVED"

    # Settle balances for P2P if not already settled
    breakdown = dict(txn.feature_breakdown or {})
    if txn.transaction_type == "P2P_TRANSFER" and not breakdown.get("p2p_settled", False):
        sender = db.query(User).filter(User.id == txn.user_id).first()
        receiver_id = txn.beneficiary_user_id or txn.beneficiary_id
        receiver = db.query(User).filter(User.id == receiver_id).first() if receiver_id else None
        if sender and receiver:
            sender.balance = round(max(0.0, (sender.balance or 0.0) - txn.amount), 2)
            receiver.balance = round((receiver.balance or 0.0) + txn.amount, 2)
            txn.sender_balance_after = sender.balance
            txn.beneficiary_balance_after = receiver.balance
            breakdown["p2p_settled"] = True
            txn.feature_breakdown = breakdown

    # Mark linked alert as RESOLVED_CONFIRMED_GENUINE
    alert_data = None
    alert = db.query(FraudAlert).filter(FraudAlert.transaction_id == txn.id).first()
    if alert:
        alert.status = "RESOLVED_CONFIRMED_GENUINE"
        alert.analyst_notes = "User confirmed & verified transfer as genuine. Self-healing unblock executed."
        alert.updated_at = datetime.datetime.utcnow()
        alert_data = {
            "alert_id": alert.id,
            "transaction_id": txn.id,
            "status": alert.status
        }

    # Whitelist device and location into Fraud DNA so future similar transfers won't be blocked
    BehaviorTracker.update_profile(db, txn.user_id, txn, force_trust=True)

    db.commit()
    db.refresh(txn)

    d = {c.name: getattr(txn, c.name) for c in txn.__table__.columns}
    d["is_live"] = (txn.timestamp >= datetime.datetime.utcnow() - datetime.timedelta(hours=24))
    if "model_comparison" in breakdown:
        d["model_comparison"] = breakdown["model_comparison"]
    if "champion_model" in breakdown:
        d["active_champion_model"] = breakdown["champion_model"]

    # Real-Time Broadcasts
    await broadcast_event("TRANSACTION_UNBLOCKED", d)
    if alert_data:
        await broadcast_event("ALERT_RESOLVED", alert_data)
    await broadcast_event("TRANSACTION_UPDATED", d)

    return d

@router.post("/counterfactual", response_model=CounterfactualResponse)
def simulate_counterfactual(payload: CounterfactualRequest, db: Session = Depends(get_db)):
    """
    Explainable AI Counterfactual & What-If Sensitivity Engine.
    Simulates what would happen to the risk score and final disposition
    if specific parameters (amount, speed, device, timing, model) were altered.
    """
    base_features = {}
    orig_score = 0.0
    orig_level = "LOW"
    orig_status = "APPROVED"

    if payload.transaction_id:
        txn = db.query(Transaction).filter(Transaction.id == payload.transaction_id).first()
        if txn:
            orig_score = txn.risk_score
            orig_level = txn.risk_level
            orig_status = txn.status
            base_features = FeatureExtractor.extract_features(
                db=db,
                user_id=txn.user_id,
                amount=txn.amount,
                timestamp=txn.timestamp,
                device_id=txn.device_id,
                location_name=txn.location_name or "Moradabad, UP, IN",
                latitude=txn.latitude,
                longitude=txn.longitude,
                beneficiary_id=txn.beneficiary_id
            )

    if not base_features:
        uid = payload.user_id or "usr_rahul_sharma"
        base_features = FeatureExtractor.extract_features(
            db=db,
            user_id=uid,
            amount=payload.amount or 5000.0,
            timestamp=datetime.datetime.utcnow(),
            device_id="dev_apple_iphone15_pro",
            location_name="Moradabad, UP, IN",
            latitude=28.8389,
            longitude=78.7768
        )
        orig_score = 25.0

    # Apply Counterfactual Overrides
    cf_features = dict(base_features)
    if payload.amount is not None:
        cf_features["amount"] = float(payload.amount)
        user_avg = cf_features.get("user_avg_amount", 2000.0) or 2000.0
        cf_features["amount_ratio"] = round(payload.amount / max(1.0, user_avg), 2)
        user_std = cf_features.get("user_std_amount", 500.0) or 500.0
        cf_features["z_score"] = round((payload.amount - user_avg) / max(1.0, user_std), 2)

    if payload.speed_kmh is not None:
        cf_features["speed_kmh"] = float(payload.speed_kmh)
    if payload.is_new_device is not None:
        cf_features["is_new_device"] = int(payload.is_new_device)
    if payload.is_night is not None:
        cf_features["is_night"] = int(payload.is_night)
        if payload.is_night:
            cf_features["hour"] = 3
            cf_features["is_preferred_hour"] = 0
        else:
            cf_features["hour"] = 14
            cf_features["is_preferred_hour"] = 1
    if payload.is_new_beneficiary is not None:
        cf_features["is_new_beneficiary"] = int(payload.is_new_beneficiary)
    if payload.velocity_5m is not None:
        cf_features["velocity_5m"] = int(payload.velocity_5m)

    # Score with target model or active champion
    target_model = payload.model_id or MLEngine.get_active_model_id()
    cf_ml_prob, ml_contributions = MLEngine.predict_fraud_probability(cf_features, model_id=target_model)
    cf_anomaly_score = AnomalyEngine.compute_anomaly_score(cf_features)
    cf_rule_score, cf_rule_reasons, cf_rule_contributions = RuleEngine.evaluate_rules(cf_features)

    reasons = list(cf_rule_reasons)
    cf_score, cf_level, cf_status, cf_velocity, breakdown = RiskCalculator.calculate_unified_risk(
        ml_prob=cf_ml_prob,
        anomaly_score=cf_anomaly_score,
        rule_score=cf_rule_score,
        features=cf_features,
        reasons=reasons,
        model_name=target_model
    )
    breakdown["rules_detail"] = cf_rule_contributions
    breakdown["ml_detail"] = ml_contributions

    score_delta = round(cf_score - orig_score, 1)
    decision_flipped = (orig_status != cf_status)

    return CounterfactualResponse(
        original_risk_score=orig_score,
        original_risk_level=orig_level,
        original_status=orig_status,
        counterfactual_risk_score=cf_score,
        counterfactual_risk_level=cf_level,
        counterfactual_status=cf_status,
        score_delta=score_delta,
        decision_flipped=decision_flipped,
        active_model_used=target_model,
        counterfactual_reasons=reasons,
        feature_breakdown=breakdown
    )

@router.post("/{txn_id}/verify-challenge", response_model=TransactionResponse)
async def verify_step_up_challenge(txn_id: str, payload: VerifyChallengeRequest, db: Session = Depends(get_db)):
    """
    Satisfies adaptive friction (OTP or Biometric challenge)
    for a transaction in STEP_UP_REQUIRED status.
    """
    txn = db.query(Transaction).filter(Transaction.id == txn_id).first()
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")

    txn.status = "APPROVED"
    reasons = list(txn.reasons or [])
    reasons.append(f"Adaptive Step-Up verified via {payload.challenge_type}.")
    txn.reasons = reasons

    alert = db.query(FraudAlert).filter(FraudAlert.transaction_id == txn.id).first()
    if alert:
        alert.status = "RESOLVED"
        alert.analyst_notes = f"Challenge verified ({payload.challenge_type}). Transaction cleared."
        alert.updated_at = datetime.datetime.utcnow()

    db.commit()
    db.refresh(txn)

    d = {c.name: getattr(txn, c.name) for c in txn.__table__.columns}
    d["is_live"] = (txn.timestamp >= datetime.datetime.utcnow() - datetime.timedelta(hours=24))
    await broadcast_event("TRANSACTION_UPDATED", d)
    return d
