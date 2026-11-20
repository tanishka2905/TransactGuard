import random
import datetime
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.db.session import get_db
from app.db.models import User, UserBehaviorProfile, Transaction
from app.schemas.transaction import UserBehaviorProfileSchema, TransactionResponse, UserCreate, UserResponse

router = APIRouter(prefix="/users", tags=["User Behavioral Intelligence"])

@router.get("", response_model=List[dict])
def list_users(limit: int = 50, db: Session = Depends(get_db)):
    """List all registered platform users with balances, account numbers, and behavioral risk profiles."""
    users = db.query(User).limit(limit).all()
    results = []
    for u in users:
        prof = u.behavior_profile
        results.append({
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "phone": u.phone or "+91 98000 00000",
            "city": u.city or "Moradabad, UP, IN",
            "balance": round(u.balance if u.balance is not None else 100000.0, 2),
            "currency": u.currency or "TGX",
            "avatar": u.avatar or "".join([w[0].upper() for w in u.name.split()[:2]]),
            "account_number": u.account_number or f"TGX-{u.id[-4:].upper()}-0001",
            "risk_segment": u.risk_segment or "LOW",
            "avg_amount": prof.avg_amount if prof else 2000.0,
            "std_amount": prof.std_amount if prof else 800.0,
            "total_txns": prof.total_txns if prof else 0,
            "known_devices_count": len(prof.known_devices) if prof and prof.known_devices else 1,
            "known_devices": prof.known_devices if prof and prof.known_devices else ["dev_client_device"],
            "primary_location": prof.known_locations[0] if prof and prof.known_locations else (u.city or "Moradabad, UP, IN"),
            "frequent_beneficiaries": prof.frequent_beneficiaries if prof and prof.frequent_beneficiaries else []
        })
    return results

@router.post("", response_model=dict, status_code=status.HTTP_201_CREATED)
def create_user(payload: UserCreate, db: Session = Depends(get_db)):
    """Register a new user in the platform with initial balance and behavioral baseline."""
    existing = db.query(User).filter(User.id == payload.id).first()
    if existing:
        raise HTTPException(status_code=400, detail="User with this ID already exists")

    existing_email = db.query(User).filter(User.email == payload.email).first()
    if existing_email:
        raise HTTPException(status_code=400, detail="User with this email already exists")

    now = datetime.datetime.utcnow()
    user = User(
        id=payload.id,
        name=payload.name,
        email=payload.email,
        phone=payload.phone or f"+91 {random.randint(90000, 99999)} {random.randint(10000, 99999)}",
        risk_segment=payload.risk_segment or "LOW",
        balance=payload.balance if payload.balance is not None else 100000.0,
        currency=payload.currency or "TGX",
        avatar="".join([w[0].upper() for w in payload.name.split()[:2]]),
        city=payload.city or "Moradabad, UP, IN",
        account_number=f"TGX-{random.randint(1000, 9999)}-{random.randint(1000, 9999)}",
        created_at=now
    )
    db.add(user)

    # Initialize behavioral baseline profile
    device_id = f"dev_{payload.id.lower()}_primary"
    profile = UserBehaviorProfile(
        user_id=payload.id,
        avg_amount=round(payload.balance * 0.05, 2),
        std_amount=round(payload.balance * 0.015, 2),
        median_amount=round(payload.balance * 0.045, 2),
        max_amount=round(payload.balance * 0.25, 2),
        normal_amount_min=round(payload.balance * 0.005, 2),
        normal_amount_max=round(payload.balance * 0.15, 2),
        preferred_hours=list(range(9, 22)),
        night_txn_ratio=0.03,
        known_devices=[device_id],
        known_locations=[payload.city or "Moradabad, UP, IN"],
        typical_lat=28.8389,
        typical_lon=78.7768,
        frequent_beneficiaries=[],
        avg_daily_txns=3.0,
        total_txns=0,
        last_updated=now
    )
    db.add(profile)
    db.commit()
    db.refresh(user)

    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "phone": user.phone,
        "city": user.city,
        "balance": user.balance,
        "currency": user.currency,
        "avatar": user.avatar,
        "account_number": user.account_number,
        "risk_segment": user.risk_segment
    }

@router.get("/{user_id}/profile", response_model=UserBehaviorProfileSchema)
def get_user_profile(user_id: str, db: Session = Depends(get_db)):
    """Fetch behavioral DNA profile and statistical spending envelope for a user."""
    profile = db.query(UserBehaviorProfile).filter(UserBehaviorProfile.user_id == user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Behavior profile not found for this user")
    return profile

@router.post("/{user_id}/deposit", response_model=dict)
def deposit_funds(user_id: str, amount: float, currency: str = "TGX", db: Session = Depends(get_db)):
    """Top up or deposit funds into user account balance."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Deposit amount must be positive")

    user.balance = (user.balance or 0.0) + amount
    user.currency = currency
    db.commit()
    db.refresh(user)

    return {
        "user_id": user.id,
        "name": user.name,
        "new_balance": round(user.balance, 2),
        "currency": user.currency
    }

@router.get("/{user_id}/transactions", response_model=List[TransactionResponse])
def get_user_transactions(user_id: str, limit: int = 20, db: Session = Depends(get_db)):
    """Fetch transaction history specifically for this user (both incoming and outgoing)."""
    txns = db.query(Transaction).filter(
        (Transaction.user_id == user_id) | (Transaction.beneficiary_user_id == user_id)
    ).order_by(desc(Transaction.timestamp)).limit(limit).all()
    
    result = []
    for t in txns:
        d = {c.name: getattr(t, c.name) for c in t.__table__.columns}
        d["is_live"] = False
        result.append(d)
    return result
