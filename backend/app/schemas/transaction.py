from pydantic import BaseModel, Field, model_validator
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
    location_name: Optional[str] = "Moradabad, UP, IN"
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
    model_comparison: Optional[Dict[str, Any]] = None
    active_champion_model: Optional[str] = None

    @model_validator(mode="before")
    @classmethod
    def populate_model_comparison(cls, data: Any) -> Any:
        if hasattr(data, "feature_breakdown") and data.feature_breakdown:
            fb = data.feature_breakdown
            if isinstance(fb, dict):
                comp = fb.get("model_comparison")
                champ = fb.get("champion_model")
                if comp and not getattr(data, "model_comparison", None):
                    try:
                        setattr(data, "model_comparison", comp)
                    except Exception:
                        pass
                if champ and not getattr(data, "active_champion_model", None):
                    try:
                        setattr(data, "active_champion_model", champ)
                    except Exception:
                        pass
        elif isinstance(data, dict):
            fb = data.get("feature_breakdown") or {}
            if isinstance(fb, dict):
                if "model_comparison" in fb and "model_comparison" not in data:
                    data["model_comparison"] = fb["model_comparison"]
                if "champion_model" in fb and "active_champion_model" not in data:
                    data["active_champion_model"] = fb["champion_model"]
        return data

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
    challenge_type: str = "SECURITY_QUESTION"  # SECURITY_QUESTION, HARDWARE_PASSKEY, ESCROW_RELEASE, SOC_ANALYST_OVERRIDE, OTP_VERIFICATION
    security_answer: Optional[str] = None
    passkey_credential: Optional[str] = None
    verification_code: Optional[str] = "123456"
    analyst_override: bool = False
    analyst_notes: Optional[str] = None

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
    challenge_type: str = "SECURITY_QUESTION"  # SECURITY_QUESTION, HARDWARE_PASSKEY, ESCROW_RELEASE, SOC_ANALYST_OVERRIDE, OTP_VERIFICATION
    security_answer: Optional[str] = None
    passkey_credential: Optional[str] = None
    verification_code: Optional[str] = "123456"
    analyst_override: bool = False
    analyst_notes: Optional[str] = None

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
    timestamp: Optional[datetime] = None
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
    friction_tier: Optional[str] = "TIER_1_ZERO_FRICTION"
    challenge_type: Optional[str] = "NONE"
    recommended_action: Optional[str] = "ZERO_FRICTION_EXECUTION"
    escrow_until: Optional[str] = None
    security_question: Optional[str] = None

class UserCreate(BaseModel):
    id: str
    name: str
    email: str
    phone: Optional[str] = None
    city: Optional[str] = "Moradabad, UP, IN"
    balance: Optional[float] = 100000.0
    currency: Optional[str] = "TGX"
    risk_segment: Optional[str] = "LOW"
    security_question: Optional[str] = "What city was your primary banking branch registered in?"
    security_answer: Optional[str] = None

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
    security_question: Optional[str] = "What city was your primary banking branch registered in?"
    security_answer: Optional[str] = None
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
    challenge_type: str = "SECURITY_QUESTION"  # SECURITY_QUESTION, HARDWARE_PASSKEY, ESCROW_RELEASE, SOC_ANALYST_OVERRIDE, OTP_VERIFICATION
    security_answer: Optional[str] = None
    passkey_credential: Optional[str] = None
    verification_code: Optional[str] = "123456"
    analyst_override: bool = False
    analyst_notes: Optional[str] = None
