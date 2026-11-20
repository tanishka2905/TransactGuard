import datetime
from sqlalchemy import Column, String, Integer, Float, DateTime, Boolean, JSON, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.db.session import Base

class User(Base):
    __tablename__ = "users"

    id = Column(String(64), primary_key=True, index=True)
    name = Column(String(128), nullable=False)
    email = Column(String(128), nullable=False, unique=True, index=True)
    phone = Column(String(32), nullable=True)
    risk_segment = Column(String(32), default="LOW")
    balance = Column(Float, default=100000.0)
    currency = Column(String(16), default="TGX")
    avatar = Column(String(256), nullable=True)
    city = Column(String(64), default="Moradabad, UP, IN")
    account_number = Column(String(32), nullable=True)
    security_question = Column(String(256), default="What city was your primary banking branch registered in?")
    security_answer = Column(String(256), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    behavior_profile = relationship("UserBehaviorProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    transactions = relationship("Transaction", back_populates="user", cascade="all, delete-orphan")


class UserBehaviorProfile(Base):
    __tablename__ = "behavior_profiles"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(64), ForeignKey("users.id"), unique=True, nullable=False, index=True)
    
    avg_amount = Column(Float, default=2000.0)
    std_amount = Column(Float, default=800.0)
    median_amount = Column(Float, default=1800.0)
    max_amount = Column(Float, default=8000.0)
    normal_amount_min = Column(Float, default=300.0)
    normal_amount_max = Column(Float, default=6000.0)
    
    preferred_hours = Column(JSON, default=lambda: [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20])
    night_txn_ratio = Column(Float, default=0.04)
    
    known_devices = Column(JSON, default=lambda: [])
    known_locations = Column(JSON, default=lambda: [])
    typical_lat = Column(Float, nullable=True)
    typical_lon = Column(Float, nullable=True)
    
    frequent_beneficiaries = Column(JSON, default=lambda: [])
    avg_daily_txns = Column(Float, default=3.5)
    total_txns = Column(Integer, default=24)
    last_updated = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="behavior_profile")


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(String(64), primary_key=True, index=True)
    user_id = Column(String(64), ForeignKey("users.id"), nullable=False, index=True)
    amount = Column(Float, nullable=False)
    currency = Column(String(16), default="TGX")
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    
    payment_method = Column(String(32), nullable=False) # UPI, CARD, NETBANKING, WIRE, P2P_TRANSFER
    merchant_id = Column(String(64), nullable=True)
    merchant_category = Column(String(64), default="Retail")
    
    device_id = Column(String(64), nullable=False)
    device_fingerprint = Column(String(128), nullable=True)
    ip_address = Column(String(64), nullable=True)
    network_type = Column(String(32), default="Cellular") # Cellular, Broadband, VPN/Tor, Corporate
    
    location_name = Column(String(64), default="Moradabad, UP, IN")
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    
    beneficiary_id = Column(String(64), nullable=True)
    beneficiary_name = Column(String(128), nullable=True)
    beneficiary_user_id = Column(String(64), nullable=True)
    sender_balance_after = Column(Float, nullable=True)
    beneficiary_balance_after = Column(Float, nullable=True)
    transaction_type = Column(String(32), default="PURCHASE") # PURCHASE, P2P_TRANSFER, BILL_PAY, CASH_WITHDRAWAL
    status = Column(String(32), default="APPROVED") # APPROVED, FLAGGED, BLOCKED
    
    risk_score = Column(Float, default=0.0, index=True)
    risk_level = Column(String(16), default="LOW", index=True) # LOW, MEDIUM, HIGH, CRITICAL
    
    ml_probability = Column(Float, default=0.0)
    anomaly_score = Column(Float, default=0.0)
    rule_score = Column(Float, default=0.0)
    velocity_score = Column(Float, default=0.0)
    
    reasons = Column(JSON, default=lambda: [])
    feature_breakdown = Column(JSON, default=lambda: {})
    source = Column(String(32), default="API") # WEBHOOK, SIMULATOR, API
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="transactions")
    alert = relationship("FraudAlert", back_populates="transaction", uselist=False, cascade="all, delete-orphan")

    @property
    def is_live(self) -> bool:
        if not self.timestamp:
            return False
        cutoff = datetime.datetime.utcnow() - datetime.timedelta(hours=24)
        return self.timestamp >= cutoff


class FraudAlert(Base):
    __tablename__ = "fraud_alerts"

    id = Column(String(64), primary_key=True, index=True)
    transaction_id = Column(String(64), ForeignKey("transactions.id"), unique=True, nullable=False, index=True)
    user_id = Column(String(64), nullable=False, index=True)
    
    risk_score = Column(Float, nullable=False)
    risk_level = Column(String(16), nullable=False)
    reasons = Column(JSON, default=lambda: [])
    
    status = Column(String(32), default="NEW", index=True) # NEW, REVIEWING, RESOLVED, FALSE_POSITIVE, CONFIRMED_FRAUD
    analyst_notes = Column(Text, nullable=True)
    assigned_to = Column(String(64), default="SecOps Analyst")
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    transaction = relationship("Transaction", back_populates="alert")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    action = Column(String(64), nullable=False)
    entity_type = Column(String(32), nullable=False)
    entity_id = Column(String(64), nullable=False)
    details = Column(JSON, default=lambda: {})
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
