import random
import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models import User, UserBehaviorProfile
from app.schemas.transaction import TransactionCreate, TransactionResponse
from app.api.transactions import process_transaction

router = APIRouter(prefix="/simulator", tags=["Attack Scenario Simulator"])

@router.post("/scenarios", response_model=TransactionResponse)
async def trigger_scenario(
    scenario: str,
    user_id: str = None,
    custom_amount: float = None,
    currency: str = "TGX",
    latitude: float = None,
    longitude: float = None,
    location_name: str = None,
    timestamp: datetime.datetime = None,
    db: Session = Depends(get_db)
):
    """
    Inject realistic fraud attack scenarios, P2P multi-user transfers, or standard traffic live.
    Scenarios:
      - 'p2p_legit': Authorized peer transfer between two registered users
      - 'p2p_mule_burst': High-volume abnormal P2P transfer triggering critical alert
      - 'normal_coffee': 180 normal purchase from trusted device
      - 'impossible_travel': Transaction in London 10 mins after Mumbai
      - 'velocity_drain': Rapid consecutive high-frequency withdrawals
      - 'midnight_burst': 95,000 at 03:15 AM from unrecognized IP/device
      - 'account_takeover': New device + new beneficiary + high amount
      - 'random_legit': Organic daily grocery/e-commerce transaction
    """
    all_users = db.query(User).all()
    # Pick a seeded user if none provided
    if not user_id:
        user_id = all_users[0].id if all_users else "usr_rahul_sharma"

    if scenario == "p2p_legit" or scenario == "p2p_mule_burst":
        # Two users involved in transaction!
        sender = db.query(User).filter(User.id == user_id).first() or all_users[0]
        recipients = [u for u in all_users if u.id != sender.id]
        receiver = random.choice(recipients) if recipients else all_users[1]

        if scenario == "p2p_legit":
            from app.api.transactions import execute_p2p_transfer
            from app.schemas.transaction import P2PTransferRequest
            amt = custom_amount or round(random.uniform(1200.0, 3800.0), 2)
            req = P2PTransferRequest(
                sender_id=sender.id,
                receiver_id=receiver.id,
                amount=amt,
                currency=currency,
                payment_method="P2P_TRANSFER",
                device_id=(sender.behavior_profile.known_devices[0] if sender.behavior_profile and sender.behavior_profile.known_devices else "dev_mobile"),
                location_name=location_name or sender.city or "Mumbai, IN",
                latitude=latitude,
                longitude=longitude,
                timestamp=timestamp,
                note=f"P2P settlement: {sender.name} to {receiver.name}"
            )
            return await execute_p2p_transfer(req, db)
        else: # p2p_mule_burst
            from app.api.transactions import execute_p2p_transfer
            from app.schemas.transaction import P2PTransferRequest
            amt = custom_amount or round(random.uniform(85000.0, 160000.0), 2)
            req = P2PTransferRequest(
                sender_id=sender.id,
                receiver_id=receiver.id,
                amount=amt,
                currency=currency,
                payment_method="P2P_TRANSFER",
                device_id="dev_unrecognized_stealth_root",
                location_name="Dubai, United Arab Emirates",
                latitude=25.2048,
                longitude=55.2708,
                note="Urgent off-hours high-velocity credit transfer"
            )
            return await execute_p2p_transfer(req, db)

    profile = db.query(UserBehaviorProfile).filter(UserBehaviorProfile.user_id == user_id).first()
    known_device = profile.known_devices[0] if profile and profile.known_devices else "dev_macbook_pro"
    known_loc = profile.known_locations[0] if profile and profile.known_locations else "Mumbai, IN"
    typical_lat = profile.typical_lat if profile else 19.0760
    typical_lon = profile.typical_lon if profile else 72.8777
    avg_amt = profile.avg_amount if profile else 1800.0

    now = datetime.datetime.utcnow()

    if scenario == "normal_coffee":
        payload = TransactionCreate(
            user_id=user_id,
            amount=custom_amount or round(random.uniform(150.0, 350.0), 2),
            currency="INR",
            payment_method="UPI",
            merchant_id="merch_blue_tokai",
            merchant_category="Food & Beverage",
            device_id=known_device,
            ip_address="103.21.124.50",
            location_name=location_name or known_loc,
            latitude=latitude if latitude is not None else typical_lat,
            longitude=longitude if longitude is not None else typical_lon,
            timestamp=timestamp,
            transaction_type="PURCHASE",
            source="SIMULATOR"
        )

    elif scenario == "impossible_travel":
        # Sudden transaction from London (51.5074, -0.1278) just 8 minutes after last transaction
        payload = TransactionCreate(
            user_id=user_id,
            amount=custom_amount or round(random.uniform(18000.0, 45000.0), 2),
            currency="INR",
            payment_method="CARD",
            merchant_id="merch_harrods_uk",
            merchant_category="Luxury Retail",
            device_id="dev_rogue_iphone_15",
            ip_address="185.220.101.4", # Foreign IP
            location_name="London, United Kingdom",
            latitude=51.5074,
            longitude=-0.1278,
            transaction_type="PURCHASE",
            source="SIMULATOR"
        )

    elif scenario == "velocity_drain":
        # Burst high value transaction in rapid succession
        payload = TransactionCreate(
            user_id=user_id,
            amount=custom_amount or round(random.uniform(35000.0, 75000.0), 2),
            currency="INR",
            payment_method="UPI",
            merchant_id="merch_crypto_exchange",
            merchant_category="Financial Services",
            device_id=known_device,
            ip_address="103.21.124.50",
            location_name=known_loc,
            latitude=typical_lat,
            longitude=typical_lon,
            transaction_type="P2P_TRANSFER",
            beneficiary_id="ben_mule_wallet_99",
            source="SIMULATOR"
        )

    elif scenario == "midnight_burst":
        # Simulated at 3:20 AM with 6x avg amount
        midnight_time = datetime.datetime(now.year, now.month, now.day, 3, 20, 0)
        payload = TransactionCreate(
            user_id=user_id,
            amount=custom_amount or round(avg_amt * 5.8, 2),
            currency="INR",
            payment_method="NETBANKING",
            merchant_id="merch_gold_bullion_co",
            merchant_category="Jewelry & Metals",
            device_id="dev_unknown_linux_box",
            ip_address="45.154.255.89", # Datacenter IP
            network_type="VPN/Tor",
            location_name="Frankfurt, DE",
            latitude=50.1109,
            longitude=8.6821,
            timestamp=midnight_time,
            transaction_type="P2P_TRANSFER",
            source="SIMULATOR"
        )

    elif scenario == "account_takeover":
        # Complete takeover: New device, new unverified beneficiary, max amount
        payload = TransactionCreate(
            user_id=user_id,
            amount=custom_amount or 145000.0,
            currency="INR",
            payment_method="WIRE",
            merchant_id="merch_offshore_remit",
            merchant_category="Wire Transfer",
            device_id="dev_stealth_android_emulator",
            device_fingerprint="fp_compromised_root_x86",
            ip_address="194.26.29.11",
            network_type="VPN/Tor",
            location_name="St. Petersburg, RU",
            latitude=59.9343,
            longitude=30.3351,
            beneficiary_id="ben_unverified_mule_881",
            transaction_type="WIRE",
            source="SIMULATOR"
        )

    else: # random_legit
        categories = [("Amazon Retail", "Retail"), ("Uber Rides", "Transportation"), ("Swiggy Delivery", "Food & Beverage"), ("Tata Power", "Utilities")]
        merch, cat = random.choice(categories)
        payload = TransactionCreate(
            user_id=user_id,
            amount=custom_amount or round(random.uniform(300.0, max(800.0, avg_amt * 1.2)), 2),
            currency="INR",
            payment_method=random.choice(["UPI", "CARD"]),
            merchant_id=f"merch_{merch.lower().replace(' ', '_')}",
            merchant_category=cat,
            device_id=known_device,
            location_name=known_loc,
            latitude=typical_lat,
            longitude=typical_lon,
            transaction_type="PURCHASE",
            source="SIMULATOR"
        )

    return await process_transaction(payload, db)
