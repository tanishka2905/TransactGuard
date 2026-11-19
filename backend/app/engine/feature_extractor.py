import math
import datetime
from typing import Dict, Any, Tuple
from sqlalchemy.orm import Session
from app.db.models import Transaction, UserBehaviorProfile

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance in kilometers between two geographic coordinates."""
    if lat1 is None or lon1 is None or lat2 is None or lon2 is None:
        return 0.0
    
    R = 6371.0 # Earth's radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

class FeatureExtractor:
    @staticmethod
    def extract_features(
        db: Session,
        user_id: str,
        amount: float,
        timestamp: datetime.datetime,
        device_id: str,
        location_name: str,
        latitude: float,
        longitude: float,
        beneficiary_id: str = None
    ) -> Dict[str, Any]:
        """Extract behavioral, contextual, and velocity features for real-time risk assessment."""
        # Normalize timestamp to UTC naive for consistent SQLite comparisons
        if timestamp and timestamp.tzinfo is not None:
            timestamp = timestamp.replace(tzinfo=None)

        # 1. Fetch user profile
        profile = db.query(UserBehaviorProfile).filter(UserBehaviorProfile.user_id == user_id).first()
        
        # Fallback defaults if new profile
        avg_amount = profile.avg_amount if profile else 2000.0
        std_amount = profile.std_amount if profile and profile.std_amount > 0 else 800.0
        known_devices = profile.known_devices if profile and profile.known_devices else []
        known_locations = profile.known_locations if profile and profile.known_locations else []
        preferred_hours = profile.preferred_hours if profile and profile.preferred_hours else list(range(9, 21))
        frequent_beneficiaries = profile.frequent_beneficiaries if profile and profile.frequent_beneficiaries else []
        typical_lat = profile.typical_lat if profile else latitude
        typical_lon = profile.typical_lon if profile else longitude
        
        # 2. Amount deviation features
        amount_ratio = amount / max(avg_amount, 1.0)
        z_score = (amount - avg_amount) / max(std_amount, 1.0)
        
        # 3. Temporal features
        hour = timestamp.hour
        is_night = 1 if hour in [0, 1, 2, 3, 4, 5] else 0
        is_preferred_hour = 1 if hour in preferred_hours else 0
        
        # 4. Device and Location features
        is_new_device = 1 if device_id not in known_devices else 0
        is_new_location = 1 if (location_name and location_name not in known_locations) else 0
        
        distance_from_base_km = haversine_distance(latitude, longitude, typical_lat, typical_lon)
        
        # 5. Geovelocity / Impossible travel detection
        last_txn = db.query(Transaction).filter(
            Transaction.user_id == user_id,
            Transaction.timestamp < timestamp
        ).order_by(Transaction.timestamp.desc()).first()
        
        speed_kmh = 0.0
        time_since_last_sec = 86400.0
        if last_txn:
            time_diff = (timestamp - last_txn.timestamp).total_seconds()
            time_since_last_sec = max(time_diff, 1.0)
            if last_txn.latitude and last_txn.longitude and latitude and longitude:
                last_distance = haversine_distance(latitude, longitude, last_txn.latitude, last_txn.longitude)
                speed_kmh = last_distance / (time_since_last_sec / 3600.0)
        
        # 6. Transaction velocity counters
        t_5m = timestamp - datetime.timedelta(minutes=5)
        t_1h = timestamp - datetime.timedelta(hours=1)
        t_24h = timestamp - datetime.timedelta(hours=24)
        
        velocity_5m = db.query(Transaction).filter(
            Transaction.user_id == user_id,
            Transaction.timestamp >= t_5m,
            Transaction.timestamp <= timestamp
        ).count()
        
        velocity_1h = db.query(Transaction).filter(
            Transaction.user_id == user_id,
            Transaction.timestamp >= t_1h,
            Transaction.timestamp <= timestamp
        ).count()
        
        velocity_24h = db.query(Transaction).filter(
            Transaction.user_id == user_id,
            Transaction.timestamp >= t_24h,
            Transaction.timestamp <= timestamp
        ).count()
        
        # 7. Beneficiary familiarity
        is_new_beneficiary = 1 if (beneficiary_id and beneficiary_id not in frequent_beneficiaries) else 0
        
        return {
            "amount": amount,
            "amount_ratio": round(amount_ratio, 2),
            "z_score": round(z_score, 2),
            "hour": hour,
            "is_night": is_night,
            "is_preferred_hour": is_preferred_hour,
            "is_new_device": is_new_device,
            "is_new_location": is_new_location,
            "distance_from_base_km": round(distance_from_base_km, 1),
            "speed_kmh": round(speed_kmh, 1),
            "time_since_last_sec": round(time_since_last_sec, 0),
            "velocity_5m": velocity_5m,
            "velocity_1h": velocity_1h,
            "velocity_24h": velocity_24h,
            "is_new_beneficiary": is_new_beneficiary,
            "user_avg_amount": avg_amount,
            "user_std_amount": std_amount,
            "known_devices_count": len(known_devices)
        }
