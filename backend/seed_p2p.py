import datetime
import uuid
from app.db.session import SessionLocal
from app.db.models import User, Transaction, FraudAlert

def seed_p2p_transactions():
    db = SessionLocal()
    now = datetime.datetime.utcnow()

    # Verify users
    rahul = db.query(User).filter(User.id == "usr_rahul_sharma").first()
    priya = db.query(User).filter(User.id == "usr_priya_nair").first()
    vikram = db.query(User).filter(User.id == "usr_vikram_singh").first()
    amit = db.query(User).filter(User.id == "usr_amit_patel").first()
    sneha = db.query(User).filter(User.id == "usr_sneha_reddy").first()

    if not (rahul and priya and vikram and amit and sneha):
        print("Users not found, please check user table.")
        db.close()
        return

    # Check if P2P transactions already exist
    existing_p2p = db.query(Transaction).filter(Transaction.transaction_type == "P2P_TRANSFER").count()
    if existing_p2p >= 3:
        print(f"Already have {existing_p2p} P2P transactions.")
        db.close()
        return

    # 1. Normal P2P Transfer: Rahul Sharma -> Priya Nair (3,500 TGX) - LOW RISK
    t1_time = now - datetime.timedelta(hours=2, minutes=15)
    t1 = Transaction(
        id=f"TXN-P2P-{uuid.uuid4().hex[:8].upper()}",
        user_id=rahul.id,
        amount=3500.0,
        currency="TGX",
        timestamp=t1_time,
        payment_method="P2P_TRANSFER",
        merchant_id=f"p2p_{priya.id}",
        merchant_category="P2P Transfer",
        device_id="dev_apple_iphone15_pro",
        device_fingerprint="fp_iphone15_primary",
        ip_address="103.21.124.50",
        network_type="Cellular",
        location_name="Mumbai, IN",
        latitude=19.0760,
        longitude=72.8777,
        beneficiary_id=priya.id,
        beneficiary_name=priya.name,
        beneficiary_user_id=priya.id,
        sender_balance_after=121500.0,
        beneficiary_balance_after=243500.0,
        transaction_type="P2P_TRANSFER",
        status="APPROVED",
        risk_score=14.5,
        risk_level="LOW",
        ml_probability=0.03,
        anomaly_score=6.2,
        rule_score=0.0,
        velocity_score=2.0,
        reasons=[
            f"Authorized P2P transfer from {rahul.name} to {priya.name}.",
            "Recipient is a recognized frequent peer beneficiary.",
            "Transfer amount within typical spending envelope."
        ],
        feature_breakdown={
            "ml_contribution": 2.1,
            "anomaly_contribution": 1.5,
            "rule_contribution": 0.0,
            "velocity_contribution": 1.0,
            "p2p_sender": {
                "id": rahul.id,
                "name": rahul.name,
                "balance_before": 125000.0,
                "balance_after": 121500.0,
                "city": rahul.city
            },
            "p2p_receiver": {
                "id": priya.id,
                "name": priya.name,
                "balance_before": 240000.0,
                "balance_after": 243500.0,
                "city": priya.city
            }
        },
        source="P2P_PORTAL",
        created_at=t1_time
    )
    db.add(t1)

    # 2. Suspicious High-Value P2P Transfer: Vikram Singh -> Amit Patel (92,000 TGX) - CRITICAL RISK
    t2_time = now - datetime.timedelta(hours=0, minutes=45)
    t2 = Transaction(
        id=f"TXN-P2P-{uuid.uuid4().hex[:8].upper()}",
        user_id=vikram.id,
        amount=92000.0,
        currency="TGX",
        timestamp=t2_time,
        payment_method="P2P_TRANSFER",
        merchant_id=f"p2p_{amit.id}",
        merchant_category="P2P Transfer",
        device_id="dev_unrecognized_terminal_x",
        device_fingerprint="fp_unverified_device_99",
        ip_address="185.220.101.4",
        network_type="VPN/Tor",
        location_name="New Delhi, IN",
        latitude=28.6139,
        longitude=77.2090,
        beneficiary_id=amit.id,
        beneficiary_name=amit.name,
        beneficiary_user_id=amit.id,
        sender_balance_after=1358000.0,
        beneficiary_balance_after=942000.0,
        transaction_type="P2P_TRANSFER",
        status="FLAGGED",
        risk_score=88.4,
        risk_level="CRITICAL",
        ml_probability=0.91,
        anomaly_score=84.2,
        rule_score=72.0,
        velocity_score=25.0,
        reasons=[
            f"Rapid high-value P2P transfer ({92000.0:,.0f} TGX) exceeds user normal single transfer limit.",
            "Transfer initiated from unfamiliar hardware device and VPN network origin.",
            f"First-time large-sum credit routing to recipient {amit.name}.",
            "Unsupervised anomaly engine identified severe statistical outlier (84.2%)."
        ],
        feature_breakdown={
            "ml_contribution": 32.5,
            "anomaly_contribution": 21.0,
            "rule_contribution": 24.5,
            "velocity_contribution": 10.4,
            "p2p_sender": {
                "id": vikram.id,
                "name": vikram.name,
                "balance_before": 1450000.0,
                "balance_after": 1358000.0,
                "city": vikram.city
            },
            "p2p_receiver": {
                "id": amit.id,
                "name": amit.name,
                "balance_before": 850000.0,
                "balance_after": 942000.0,
                "city": amit.city
            }
        },
        source="P2P_PORTAL",
        created_at=t2_time
    )
    db.add(t2)

    # Add FraudAlert for t2
    alt = FraudAlert(
        id=f"ALT-P2P-{uuid.uuid4().hex[:6].upper()}",
        transaction_id=t2.id,
        user_id=vikram.id,
        risk_score=t2.risk_score,
        risk_level=t2.risk_level,
        reasons=t2.reasons,
        status="NEW",
        analyst_notes=f"Flagged Critical P2P Transfer: {vikram.name} -> {amit.name} (92,000 TGX)",
        created_at=t2_time
    )
    db.add(alt)

    # 3. Medium Risk P2P Transfer: Sneha Reddy -> Rahul Sharma (8,500 TGX) - MEDIUM RISK
    t3_time = now - datetime.timedelta(hours=5, minutes=10)
    t3 = Transaction(
        id=f"TXN-P2P-{uuid.uuid4().hex[:8].upper()}",
        user_id=sneha.id,
        amount=8500.0,
        currency="TGX",
        timestamp=t3_time,
        payment_method="P2P_TRANSFER",
        merchant_id=f"p2p_{rahul.id}",
        merchant_category="P2P Transfer",
        device_id="dev_iphone_14",
        device_fingerprint="fp_sneha_mobile",
        ip_address="103.21.124.50",
        network_type="Cellular",
        location_name="Hyderabad, IN",
        latitude=17.3850,
        longitude=78.4867,
        beneficiary_id=rahul.id,
        beneficiary_name=rahul.name,
        beneficiary_user_id=rahul.id,
        sender_balance_after=86500.0,
        beneficiary_balance_after=130000.0,
        transaction_type="P2P_TRANSFER",
        status="APPROVED",
        risk_score=46.2,
        risk_level="MEDIUM",
        ml_probability=0.28,
        anomaly_score=42.0,
        rule_score=20.0,
        velocity_score=5.0,
        reasons=[
            f"P2P transfer amount is 7.1x higher than sender's normal average ({sneha.name}).",
            "Known device verified.",
            "Transfer approved with active telemetry monitoring."
        ],
        feature_breakdown={
            "ml_contribution": 10.5,
            "anomaly_contribution": 12.0,
            "rule_contribution": 18.0,
            "velocity_contribution": 5.7,
            "p2p_sender": {
                "id": sneha.id,
                "name": sneha.name,
                "balance_before": 95000.0,
                "balance_after": 86500.0,
                "city": sneha.city
            },
            "p2p_receiver": {
                "id": rahul.id,
                "name": rahul.name,
                "balance_before": 121500.0,
                "balance_after": 130000.0,
                "city": rahul.city
            }
        },
        source="P2P_PORTAL",
        created_at=t3_time
    )
    db.add(t3)

    db.commit()
    db.close()
    print("Seeded realistic 2-user P2P transactions successfully!")

if __name__ == "__main__":
    seed_p2p_transactions()
