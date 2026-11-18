import random
import datetime
import uuid
from sqlalchemy.orm import Session
from app.db.models import User, UserBehaviorProfile, Transaction, FraudAlert

PERSONAS = [
    {
        "id": "usr_rahul_sharma",
        "name": "Rahul Sharma",
        "email": "rahul.sharma@fintech.io",
        "phone": "+91 98201 11223",
        "city": "Mumbai, IN",
        "lat": 19.0760,
        "lon": 72.8777,
        "devices": ["dev_apple_iphone15_pro", "dev_macbook_m3_air"],
        "avg_amount": 1850.0,
        "std_amount": 540.0,
        "hours": [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
        "beneficiaries": ["ben_zerodha_equity", "ben_cred_pay", "ben_swiggy_instamart"]
    },
    {
        "id": "usr_priya_nair",
        "name": "Priya Nair",
        "email": "priya.nair@techhub.co",
        "phone": "+91 98450 33445",
        "city": "Bengaluru, IN",
        "lat": 12.9716,
        "lon": 77.5946,
        "devices": ["dev_pixel_8_pro", "dev_dell_xps15"],
        "avg_amount": 3400.0,
        "std_amount": 950.0,
        "hours": [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22],
        "beneficiaries": ["ben_cult_fit", "ben_amazon_pay", "ben_airtel_broadband"]
    },
    {
        "id": "usr_amit_patel",
        "name": "Amit Patel",
        "email": "amit.patel@logistics.in",
        "phone": "+91 98795 66778",
        "city": "Ahmedabad, IN",
        "lat": 23.0225,
        "lon": 72.5714,
        "devices": ["dev_samsung_s24_ultra"],
        "avg_amount": 8500.0,
        "std_amount": 2100.0,
        "hours": [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18],
        "beneficiaries": ["ben_gst_portal", "ben_bpcl_fuels", "ben_hdfc_card"]
    },
    {
        "id": "usr_sneha_reddy",
        "name": "Sneha Reddy",
        "email": "sneha.reddy@biocare.org",
        "phone": "+91 97012 88990",
        "city": "Hyderabad, IN",
        "lat": 17.3850,
        "lon": 78.4867,
        "devices": ["dev_iphone_14", "dev_ipad_air"],
        "avg_amount": 1200.0,
        "std_amount": 350.0,
        "hours": [9, 10, 12, 13, 14, 15, 16, 17, 18, 19, 20],
        "beneficiaries": ["ben_apollo_pharmacy", "ben_blinkit_groceries"]
    },
    {
        "id": "usr_vikram_singh",
        "name": "Vikram Singh",
        "email": "vikram.singh@capital.com",
        "phone": "+91 98110 55443",
        "city": "New Delhi, IN",
        "lat": 28.6139,
        "lon": 77.2090,
        "devices": ["dev_thinkpad_t14", "dev_iphone15_enterprise"],
        "avg_amount": 14200.0,
        "std_amount": 4200.0,
        "hours": [9, 10, 11, 12, 14, 15, 16, 17, 18, 19, 20, 21],
        "beneficiaries": ["ben_taj_hospitality", "ben_amex_platinum", "ben_indigo_airlines"]
    }
]

MERCHANTS = [
    ("merch_starbucks_in", "Food & Beverage", "UPI"),
    ("merch_amazon_in", "Retail", "CARD"),
    ("merch_flipkart", "Retail", "UPI"),
    ("merch_uber_rides", "Transportation", "UPI"),
    ("merch_netflix_sub", "Digital Goods", "CARD"),
    ("merch_apple_store", "Electronics", "CARD"),
    ("merch_apollo_health", "Healthcare", "UPI"),
    ("merch_zomato_delivery", "Food & Beverage", "UPI"),
    ("merch_tata_power", "Utilities", "NETBANKING"),
    ("merch_makemytrip", "Travel", "CARD")
]

def run_seed(db: Session):
    """Seed users, behavioral baselines, and historical transactions if empty."""
    user_count = db.query(User).count()
    if user_count > 0:
        return # Already seeded

    print("[Seed] Seeding realistic financial personas and historical baselines...")
    now = datetime.datetime.utcnow()

    # 1. Create Personas & Profiles
    for p in PERSONAS:
        user = User(
            id=p["id"],
            name=p["name"],
            email=p["email"],
            phone=p["phone"],
            risk_segment="LOW",
            created_at=now - datetime.timedelta(days=60)
        )
        db.add(user)

        profile = UserBehaviorProfile(
            user_id=p["id"],
            avg_amount=p["avg_amount"],
            std_amount=p["std_amount"],
            median_amount=round(p["avg_amount"] * 0.9, 2),
            max_amount=round(p["avg_amount"] * 3.8, 2),
            normal_amount_min=round(p["avg_amount"] * 0.2, 2),
            normal_amount_max=round(p["avg_amount"] * 3.2, 2),
            preferred_hours=p["hours"],
            night_txn_ratio=0.03,
            known_devices=p["devices"],
            known_locations=[p["city"]],
            typical_lat=p["lat"],
            typical_lon=p["lon"],
            frequent_beneficiaries=p["beneficiaries"],
            avg_daily_txns=round(random.uniform(2.5, 4.8), 1),
            total_txns=45,
            last_updated=now - datetime.timedelta(hours=2)
        )
        db.add(profile)
    db.commit()

    # 2. Generate Historical & Live Transactions
    all_users = db.query(User).all()
    created_txns = []

    # Generate normal transactions across last 7 days
    for days_back in range(7, 0, -1):
        for user in all_users:
            profile = user.behavior_profile
            # 2 to 4 transactions per day
            num_txns = random.randint(2, 4)
            for _ in range(num_txns):
                hour = random.choice(profile.preferred_hours)
                minute = random.randint(0, 59)
                txn_time = now - datetime.timedelta(days=days_back, hours=random.randint(0, 23), minutes=minute)
                
                # Normal amount around avg
                amt = max(100.0, round(random.gauss(profile.avg_amount, profile.std_amount), 2))
                merch, cat, pmethod = random.choice(MERCHANTS)
                device = random.choice(profile.known_devices)
                
                txn = Transaction(
                    id=f"TXN-{uuid.uuid4().hex[:10].upper()}",
                    user_id=user.id,
                    amount=amt,
                    currency="INR",
                    timestamp=txn_time,
                    payment_method=pmethod,
                    merchant_id=merch,
                    merchant_category=cat,
                    device_id=device,
                    device_fingerprint=f"fp_{device[:10]}",
                    ip_address="103.21.124.50",
                    network_type="Cellular",
                    location_name=profile.known_locations[0],
                    latitude=profile.typical_lat,
                    longitude=profile.typical_lon,
                    beneficiary_id=random.choice(profile.frequent_beneficiaries) if profile.frequent_beneficiaries else None,
                    transaction_type="PURCHASE",
                    status="APPROVED",
                    risk_score=round(random.uniform(4.0, 18.0), 1),
                    risk_level="LOW",
                    ml_probability=round(random.uniform(0.01, 0.08), 3),
                    anomaly_score=round(random.uniform(2.0, 14.0), 1),
                    rule_score=0.0,
                    velocity_score=round(random.uniform(0.0, 10.0), 1),
                    reasons=["Transaction satisfies standard behavioral baselines and low-risk heuristics."],
                    feature_breakdown={"ml_contribution": 2.5, "anomaly_contribution": 1.5, "rule_contribution": 0.0, "velocity_contribution": 0.0},
                    source="API",
                    created_at=txn_time
                )
                created_txns.append(txn)

    # Generate 16 transactions in the LAST 24 HOURS (to make Live View shine immediately!)
    for i in range(16):
        user = random.choice(all_users)
        profile = user.behavior_profile
        hours_ago = random.uniform(0.2, 23.5)
        txn_time = now - datetime.timedelta(hours=hours_ago)

        # Introduce 2 suspicious/flagged transactions in live queue
        is_fraud = (i in [4, 11])
        if is_fraud:
            amt = round(profile.avg_amount * 5.2, 2)
            risk_score = round(random.uniform(82.0, 93.0), 1)
            risk_lvl = "CRITICAL"
            stat = "BLOCKED"
            reasons = [
                f"Transaction amount is 5.2x higher than user's normal average (₹{profile.avg_amount:,.2f}).",
                "Transaction originated from an unrecognized hardware device ID.",
                "Supervised ML model flagged elevated fraud pattern confidence (89.4%)."
            ]
            loc = "London, United Kingdom" if i == 4 else "Frankfurt, DE"
            lat = 51.5074 if i == 4 else 50.1109
            lon = -0.1278 if i == 4 else 8.6821
            device = "dev_rogue_unrecognized_terminal"
            ml_p = 0.89
            anom = 78.5
            rules = 65.0
        else:
            amt = max(150.0, round(random.gauss(profile.avg_amount, profile.std_amount), 2))
            risk_score = round(random.uniform(5.0, 22.0), 1)
            risk_lvl = "LOW"
            stat = "APPROVED"
            reasons = ["Transaction satisfies standard behavioral baselines and low-risk heuristics."]
            loc = profile.known_locations[0]
            lat = profile.typical_lat
            lon = profile.typical_lon
            device = random.choice(profile.known_devices)
            ml_p = 0.04
            anom = 8.0
            rules = 0.0

        merch, cat, pmethod = random.choice(MERCHANTS)
        txn = Transaction(
            id=f"TXN-{uuid.uuid4().hex[:10].upper()}",
            user_id=user.id,
            amount=amt,
            currency="INR",
            timestamp=txn_time,
            payment_method=pmethod,
            merchant_id=merch,
            merchant_category=cat,
            device_id=device,
            device_fingerprint=f"fp_{device[:10]}",
            ip_address="103.21.124.50" if not is_fraud else "185.220.101.4",
            network_type="Cellular" if not is_fraud else "VPN/Tor",
            location_name=loc,
            latitude=lat,
            longitude=lon,
            transaction_type="PURCHASE",
            status=stat,
            risk_score=risk_score,
            risk_level=risk_lvl,
            ml_probability=ml_p,
            anomaly_score=anom,
            rule_score=rules,
            velocity_score=15.0 if is_fraud else 0.0,
            reasons=reasons,
            feature_breakdown={
                "ml_contribution": round(ml_p * 35.0, 1),
                "anomaly_contribution": round(anom * 0.25, 1),
                "rule_contribution": round(rules * 0.25, 1),
                "velocity_contribution": 5.0 if is_fraud else 0.0,
                "amount_ratio": round(amt / profile.avg_amount, 2),
                "is_new_device": is_fraud,
                "speed_kmh": 820.0 if i == 4 else 0.0
            },
            source="API",
            created_at=txn_time
        )
        created_txns.append(txn)

    db.add_all(created_txns)
    db.commit()

    # Create alerts for high/critical transactions
    critical_txns = db.query(Transaction).filter(Transaction.risk_level.in_(["HIGH", "CRITICAL"])).all()
    for ctxn in critical_txns:
        alert = FraudAlert(
            id=f"ALT-{uuid.uuid4().hex[:8].upper()}",
            transaction_id=ctxn.id,
            user_id=ctxn.user_id,
            risk_score=ctxn.risk_score,
            risk_level=ctxn.risk_level,
            reasons=ctxn.reasons,
            status="NEW",
            analyst_notes="Automated risk triage: Critical risk threshold breach.",
            created_at=ctxn.created_at
        )
        db.add(alert)
    db.commit()

    print(f"[Seed] Successfully seeded {len(all_users)} users and {len(created_txns)} transactions!")
