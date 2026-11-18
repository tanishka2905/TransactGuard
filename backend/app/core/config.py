import os
from pydantic import BaseModel

class Settings(BaseModel):
    PROJECT_NAME: str = "TRANSact Guard"
    VERSION: str = "2.4.0"
    API_V1_STR: str = "/api/v1"
    
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./transactguard.db")
    
    # Risk Thresholds
    RISK_LOW_MAX: float = 29.0
    RISK_MEDIUM_MAX: float = 59.0
    RISK_HIGH_MAX: float = 79.0
    RISK_CRITICAL_MIN: float = 80.0
    
    # Hybrid Engine Weights
    WEIGHT_ML: float = 0.35
    WEIGHT_ANOMALY: float = 0.25
    WEIGHT_RULES: float = 0.25
    WEIGHT_VELOCITY: float = 0.15
    
    # Velocity window limits
    MAX_VELOCITY_5M_BURST: int = 3
    MAX_VELOCITY_1H_WARN: int = 7
    
    # Webhook signature secret for simulation
    WEBHOOK_SECRET: str = "tg_sec_live_99a8b7c6d5e4f3a2b1"

settings = Settings()
