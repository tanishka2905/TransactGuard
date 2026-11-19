import datetime
from sqlalchemy.orm import Session
from app.db.models import UserBehaviorProfile, Transaction

class BehaviorTracker:
    @staticmethod
    def update_profile(db: Session, user_id: str, txn: Transaction, force_trust: bool = False):
        """
        Dynamically updates the user's behavioral DNA profile based on new approved transaction.
        Tracks rolling averages, known devices, locations, and time patterns.
        If force_trust is True (e.g., self-healing unblock confirmation), guarantees adding
        device, location, and beneficiary to trusted envelope even if initial risk was CRITICAL.
        """
        profile = db.query(UserBehaviorProfile).filter(UserBehaviorProfile.user_id == user_id).first()
        if not profile:
            profile = UserBehaviorProfile(
                user_id=user_id,
                avg_amount=txn.amount,
                std_amount=txn.amount * 0.3,
                median_amount=txn.amount,
                max_amount=txn.amount,
                normal_amount_min=round(txn.amount * 0.2, 2),
                normal_amount_max=round(txn.amount * 2.5, 2),
                preferred_hours=[txn.timestamp.hour],
                known_devices=[txn.device_id],
                known_locations=[txn.location_name] if txn.location_name else [],
                typical_lat=txn.latitude,
                typical_lon=txn.longitude,
                frequent_beneficiaries=[txn.beneficiary_id] if txn.beneficiary_id else [],
                avg_daily_txns=1.0,
                total_txns=1,
                last_updated=datetime.datetime.utcnow()
            )
            db.add(profile)
            db.commit()
            return profile

        # Only skip baseline updates if high/critical risk AND not force-trusted
        if txn.risk_level in ["HIGH", "CRITICAL"] and not force_trust:
            return profile # Do not poison baseline with unconfirmed fraudulent activity

        # Exponential moving average / incremental update
        alpha = 0.15 # Learning rate
        profile.avg_amount = round((1 - alpha) * profile.avg_amount + alpha * txn.amount, 2)
        profile.max_amount = max(profile.max_amount, txn.amount)
        profile.normal_amount_min = round(profile.avg_amount * 0.2, 2)
        profile.normal_amount_max = round(profile.avg_amount * 3.0, 2)
        profile.total_txns += 1
        
        # Update devices
        known_devices = list(profile.known_devices or [])
        if txn.device_id and txn.device_id not in known_devices:
            known_devices.append(txn.device_id)
            profile.known_devices = known_devices

        # Update locations
        known_locations = list(profile.known_locations or [])
        if txn.location_name and txn.location_name not in known_locations:
            known_locations.append(txn.location_name)
            profile.known_locations = known_locations

        # Update typical coordinates if not set
        if profile.typical_lat is None and txn.latitude is not None:
            profile.typical_lat = txn.latitude
            profile.typical_lon = txn.longitude

        # Update preferred hours
        hours = list(profile.preferred_hours or [])
        h = txn.timestamp.hour
        if h not in hours and len(hours) < 18:
            hours.append(h)
            profile.preferred_hours = sorted(hours)

        # Update beneficiaries
        if txn.beneficiary_id:
            bens = list(profile.frequent_beneficiaries or [])
            if txn.beneficiary_id not in bens:
                bens.append(txn.beneficiary_id)
                profile.frequent_beneficiaries = bens

        profile.last_updated = datetime.datetime.utcnow()
        db.commit()
        return profile
