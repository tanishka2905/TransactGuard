import os
import joblib
import numpy as np
from typing import Dict, Any, Tuple

MODEL_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "models_store")
MODEL_PATH = os.path.join(MODEL_DIR, "fraud_classifier.joblib")

FEATURE_COLUMNS = [
    "amount", "amount_ratio", "z_score", "hour", "is_night",
    "is_preferred_hour", "is_new_device", "is_new_location",
    "distance_from_base_km", "speed_kmh", "velocity_5m",
    "velocity_1h", "velocity_24h", "is_new_beneficiary"
]

class MLEngine:
    _model = None

    @classmethod
    def load_model(cls):
        if cls._model is None and os.path.exists(MODEL_PATH):
            try:
                cls._model = joblib.load(MODEL_PATH)
            except Exception as e:
                print(f"[MLEngine] Warning: Could not load model from {MODEL_PATH}: {e}")
        return cls._model

    @classmethod
    def predict_fraud_probability(cls, features: Dict[str, Any]) -> Tuple[float, Dict[str, float]]:
        """
        Calculates supervised ML fraud probability (0.0 to 1.0) and feature importances.
        """
        # Vectorize features in deterministic order
        vec = [float(features.get(col, 0.0)) for col in FEATURE_COLUMNS]
        
        model = cls.load_model()
        if model is not None:
            try:
                X = np.array([vec])
                # predict_proba returns [P(legit), P(fraud)]
                prob = float(model.predict_proba(X)[0][1])
            except Exception as e:
                prob = cls._heuristic_prob(features)
        else:
            prob = cls._heuristic_prob(features)

        # Feature contribution simulation (SHAP-style local explanations)
        feature_contributions = {
            "amount_anomaly": round(min(1.0, features.get("amount_ratio", 1.0) / 4.0) * 0.35, 3),
            "velocity_surge": round(min(1.0, features.get("velocity_5m", 0) / 3.0) * 0.25, 3),
            "impossible_travel": round(min(1.0, features.get("speed_kmh", 0) / 750.0) * 0.30, 3),
            "unrecognized_device": 0.15 if features.get("is_new_device", 0) else 0.0,
            "nocturnal_timing": 0.10 if features.get("is_night", 0) else 0.0
        }

        return round(prob, 4), feature_contributions

    @staticmethod
    def _heuristic_prob(features: Dict[str, Any]) -> float:
        """Statistical fallback when model file is not yet saved."""
        p = 0.02
        if features.get("amount_ratio", 1.0) > 3.0:
            p += 0.35
        if features.get("speed_kmh", 0.0) > 750.0:
            p += 0.45
        if features.get("velocity_5m", 0) >= 3:
            p += 0.30
        if features.get("is_new_device", 0):
            p += 0.15
        if features.get("is_night", 0):
            p += 0.10
        return min(0.98, max(0.01, p))
