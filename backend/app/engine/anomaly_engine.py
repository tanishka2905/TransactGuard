import os
import joblib
import numpy as np
from typing import Dict, Any

MODEL_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "models_store")
IFOREST_PATH = os.path.join(MODEL_DIR, "isolation_forest.joblib")
ELLIPTIC_PATH = os.path.join(MODEL_DIR, "elliptic_envelope.joblib")

class AnomalyEngine:
    _iforest = None
    _elliptic = None

    @classmethod
    def load_iforest(cls):
        if cls._iforest is None and os.path.exists(IFOREST_PATH):
            try:
                cls._iforest = joblib.load(IFOREST_PATH)
            except Exception as e:
                print(f"[AnomalyEngine] Warning loading IF: {e}")
        return cls._iforest

    @classmethod
    def load_elliptic(cls):
        if cls._elliptic is None and os.path.exists(ELLIPTIC_PATH):
            try:
                cls._elliptic = joblib.load(ELLIPTIC_PATH)
            except Exception as e:
                print(f"[AnomalyEngine] Warning loading Elliptic: {e}")
        return cls._elliptic

    @classmethod
    def compute_anomaly_score(cls, features: Dict[str, Any]) -> float:
        """
        Synthesizes Isolation Forest and Elliptic Envelope (Mahalanobis distance)
        into a unified unsupervised anomaly score (0.0 to 100.0).
        """
        from app.engine.ml_engine import FEATURE_COLUMNS
        vec = np.array([[float(features.get(col, 0.0)) for col in FEATURE_COLUMNS]])

        scores = []

        # 1. Isolation Forest score
        iforest = cls.load_iforest()
        if iforest is not None:
            try:
                raw_score = iforest.score_samples(vec)[0]
                # Lower is more anomalous; normalize [-0.7, -0.3] to [100, 0]
                norm_if = max(0.0, min(100.0, (-raw_score - 0.35) * 200.0))
                scores.append(norm_if)
            except Exception:
                pass

        # 2. Elliptic Envelope (Mahalanobis Distance) score
        elliptic = cls.load_elliptic()
        if elliptic is not None:
            try:
                # Mahalanobis distances
                mahal_dist = elliptic.mahalanobis(vec)[0]
                # Chi-squared degrees of freedom ~ 14. High mahal_dist (> 30) = extreme outlier
                norm_mahal = max(0.0, min(100.0, (mahal_dist / 35.0) * 100.0))
                scores.append(norm_mahal)
            except Exception:
                pass

        if scores:
            return round(float(np.mean(scores)), 1)

        # Fallback anomaly heuristic based on multivariate deviation
        z_score = abs(features.get("z_score", 0.0))
        dist_dev = min(1.0, features.get("distance_from_base_km", 0.0) / 2000.0)
        time_dev = 1.0 if not features.get("is_preferred_hour", 1) else 0.0
        device_dev = 1.0 if features.get("is_new_device", 0) else 0.0

        anomaly = (z_score * 12.0) + (dist_dev * 25.0) + (time_dev * 20.0) + (device_dev * 25.0)
        return round(min(100.0, max(0.0, anomaly)), 1)
