import hmac
import hashlib
import json
from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import get_db
from app.db.models import Transaction
from app.schemas.transaction import TransactionCreate, TransactionResponse
from app.api.transactions import process_transaction

router = APIRouter(prefix="/payments", tags=["Payment Provider Webhook"])

@router.post("/webhook", response_model=TransactionResponse, status_code=status.HTTP_200_OK)
async def receive_payment_webhook(
    request: Request,
    x_tg_signature: str = Header(None, alias="X-TG-Signature"),
    x_idempotency_key: str = Header(None, alias="X-Idempotency-Key"),
    db: Session = Depends(get_db)
):
    """
    Standard production-style payment provider webhook ingestion point.
    Features:
      - Cryptographic HMAC-SHA256 signature verification
      - Idempotency key duplicate protection
      - Real-time routing directly into Transact Guard risk assessment pipeline
    """
    body_bytes = await request.body()
    
    # 1. Signature Verification (If header provided)
    if x_tg_signature:
        expected_sig = hmac.new(
            settings.WEBHOOK_SECRET.encode(),
            body_bytes,
            hashlib.sha256
        ).hexdigest()
        if not hmac.compare_digest(x_tg_signature, expected_sig):
            raise HTTPException(status_code=401, detail="Invalid webhook cryptographic signature")

    # 2. Parse payload
    try:
        data = json.loads(body_bytes.decode())
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    # 3. Idempotency Check
    if x_idempotency_key:
        existing = db.query(Transaction).filter(Transaction.id == x_idempotency_key).first()
        if existing:
            d = {c.name: getattr(existing, c.name) for c in existing.__table__.columns}
            d["is_live"] = True
            return d

    # 4. Map into standard Transaction schema
    try:
        txn_create = TransactionCreate(
            user_id=data.get("user_id", "usr_webhook_external"),
            amount=float(data.get("amount", 1000.0)),
            currency=data.get("currency", "INR"),
            payment_method=data.get("payment_method", "CARD"),
            merchant_id=data.get("merchant_id", "merch_gateway_partner"),
            merchant_category=data.get("merchant_category", "E-Commerce"),
            device_id=data.get("device_id", "dev_webhook_client"),
            ip_address=data.get("ip_address", "103.11.200.45"),
            network_type=data.get("network_type", "Cellular"),
            location_name=data.get("location_name", "Bengaluru, IN"),
            latitude=float(data.get("latitude", 12.9716)),
            longitude=float(data.get("longitude", 77.5946)),
            transaction_type=data.get("transaction_type", "PURCHASE"),
            source="WEBHOOK"
        )
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Malformed transaction data: {str(e)}")

    return await process_transaction(txn_create, db)
