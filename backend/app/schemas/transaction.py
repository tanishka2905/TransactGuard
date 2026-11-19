from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class TransactionBase(BaseModel):
    user_id: str
    amount: float = Field(..., gt=0, description="Transaction amount must be positive")
    currency: str = "TGX"
    payment_method: str = "UPI" # UPI, CARD, NETBANKING, WIRE, P2P_TRANSFER
    merchant_id: Optional[str] = "merch_default"
    merchant_category: Optional[str] = "Retail"
    device_id: str
    device_fingerprint: Optional[str] = None
    ip_address: Optional[str] = "103.21.124.50"
    network_type: Optional[str] = "Cellular"
    location_name: Optional[str] = "Mumbai, IN"
    latitude: Optional[float] = 19.0760
    longitude: Optional[float] = 72.8777
    beneficiary_id: Optional[str] = None
    beneficiary_name: Optional[str] = None
    beneficiary_user_id: Optional[str] = None
    sender_balance_after: Optional[float] = None
    beneficiary_balance_after: Optional[float] = None
    transaction_type: Optional[str] = "PURCHASE"
    source: Optional[str] = "API"

class TransactionCreate(TransactionBase):
    timestamp: Optional[datetime] = None

class FeatureBreakdown(BaseModel):
    ml_contribution: float
    anomaly_contribution: float
    rule_contribution: float
    velocity_contribution: float
    top_signals: List[str]

class TransactionResponse(TransactionBase):
    id: str
    timestamp: datetime
    status: str
    risk_score: float
    risk_level: str
    ml_probability: float
    anomaly_score: float
    rule_score: float
    velocity_score: float
    reasons: List[str]
    feature_breakdown: Dict[str, Any]
    is_live: bool = False
    created_at: datetime

    class Config:
        from_attributes = True

class CounterfactualRequest(BaseModel):
    transaction_id: Optional[str] = None
    user_id: Optional[str] = None
    amount: Optional[float] = None
    speed_kmh: Optional[float] = None
    is_new_device: Optional[int] = None
    is_night: Optional[int] = None
    is_new_beneficiary: Optional[int] = None
    velocity_5m: Optional[int] = None
    model_id: Optional[str] = None

class CounterfactualResponse(BaseModel):
    original_risk_score: float
    original_risk_level: str
    original_status: str
    counterfactual_risk_score: float
    counterfactual_risk_level: str
    counterfactual_status: str
    score_delta: float
    decision_flipped: bool
    active_model_used: str
    counterfactual_reasons: List[str]
    feature_breakdown: Dict[str, Any]

class VerifyChallengeRequest(BaseModel):
    challenge_type: str = "OTP_VERIFICATION"
    verification_code: str = "123456"
    analyst_override: bool = False

class AlertUpdate(BaseModel):
    status: str # NEW, REVIEWING, RESOLVED, FALSE_POSITIVE, CONFIRMED_FRAUD
    analyst_notes: Optional[str] = None
    assigned_to: Optional[str] = None

class AlertResponse(BaseModel):
    id: str
    transaction_id: str
    user_id: str
    risk_score: float
    risk_level: str
    reasons: List[str]
    status: str
    analyst_notes: Optional[str]
    assigned_to: Optional[str]
    created_at: datetime
    updated_at: datetime
    transaction: Optional[TransactionResponse] = None

    class Config:
        from_attributes = True

class CounterfactualRequest(BaseModel):
    transaction_id: Optional[str] = None
    user_id: Optional[str] = None
    amount: Optional[float] = None
    speed_kmh: Optional[float] = None
    is_new_device: Optional[int] = None
    is_night: Optional[int] = None
    is_new_beneficiary: Optional[int] = None
    velocity_5m: Optional[int] = None
    model_id: Optional[str] = None

class CounterfactualResponse(BaseModel):
    original_risk_score: float
    original_risk_level: str
    original_status: str
    counterfactual_risk_score: float
    counterfactual_risk_level: str
    counterfactual_status: str
    score_delta: float
    decision_flipped: bool
    active_model_used: str
    counterfactual_reasons: List[str]
    feature_breakdown: Dict[str, Any]

class VerifyChallengeRequest(BaseModel):
    challenge_type: str = "OTP_VERIFICATION"
    verification_code: str = "123456"
    analyst_override: bool = False

class UserBehaviorProfileSchema(BaseModel):
    user_id: str
    avg_amount: float
    std_amount: float
    median_amount: float
    max_amount: float
    normal_amount_min: float
    normal_amount_max: float
    preferred_hours: List[int]
    night_txn_ratio: float
    known_devices: List[str]
    known_locations: List[str]
    typical_lat: Optional[float]
    typical_lon: Optional[float]
    frequent_beneficiaries: List[str]
    avg_daily_txns: float
    total_txns: int
    last_updated: datetime

    class Config:
        from_attributes = True

class DashboardMetrics(BaseModel):
    live_transactions_count: int
    transactions_today_count: int
    total_volume_today: float
    avg_transaction_value: float
    total_fraud_alerts: int
    active_critical_alerts: int
    fraud_rate_percentage: float
    avg_latency_ms: float
    risk_distribution: Dict[str, int]
    hourly_volume: List[Dict[str, Any]]
    payment_method_distribution: Dict[str, int]
    recent_alerts: List[AlertResponse]

class SimulatorScenario(BaseModel):
    scenario: str # e.g. "normal_coffee", "impossible_travel", "midnight_burst", "account_takeover", "velocity_drain"
    user_id: Optional[str] = None
    custom_amount: Optional[float] = None

class P2PTransferRequest(BaseModel):
    sender_id: str
    receiver_id: str
    amount: float = Field(..., gt=0, description="Transfer amount must be positive")
    currency: str = "TGX"
    payment_method: str = "P2P_TRANSFER"
    device_id: Optional[str] = None
    location_name: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    note: Optional[str] = "P2P instant credit transfer"

class P2PPreScreenResponse(BaseModel):
    sender_id: str
    sender_name: str
    sender_balance: float
    sender_balance_after: float
    receiver_id: str
    receiver_name: str
    receiver_balance: float
    receiver_balance_after: float
    amount: float
    currency: str
    risk_score: float
    risk_level: str
    ml_probability: float
    anomaly_score: float
    rule_score: float
    velocity_score: float
    reasons: List[str]
    warnings: List[str]
    requires_confirmation: bool
    is_new_beneficiary: bool
    sender_city: str
    receiver_city: str

class UserCreate(BaseModel):
    id: str
    name: str
    email: str
    phone: Optional[str] = None
    city: Optional[str] = "Mumbai, IN"
    balance: Optional[float] = 100000.0
    currency: Optional[str] = "TGX"
    risk_segment: Optional[str] = "LOW"

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    phone: Optional[str]
    city: Optional[str]
    balance: float
    currency: str
    avatar: Optional[str]
    account_number: Optional[str]
    risk_segment: str
    avg_amount: float
    total_txns: int
    known_devices_count: int
    primary_location: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class CounterfactualRequest(BaseModel):
    transaction_id: Optional[str] = None
    user_id: Optional[str] = None
    amount: Optional[float] = None
    speed_kmh: Optional[float] = None
    is_new_device: Optional[int] = None
    is_night: Optional[int] = None
    is_new_beneficiary: Optional[int] = None
    velocity_5m: Optional[int] = None
    model_id: Optional[str] = None

class CounterfactualResponse(BaseModel):
    original_risk_score: float
    original_risk_level: str
    original_status: str
    counterfactual_risk_score: float
    counterfactual_risk_level: str
    counterfactual_status: str
    score_delta: float
    decision_flipped: bool
    active_model_used: str
    counterfactual_reasons: List[str]
    feature_breakdown: Dict[str, Any]

class VerifyChallengeRequest(BaseModel):
    challenge_type: str = "OTP_VERIFICATION"
    verification_code: str = "123456"
    analyst_override: bool = False
