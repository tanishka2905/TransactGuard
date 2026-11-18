import os
import joblib
import numpy as np
from typing import Dict, Any

MODEL_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "models_store")
IFOREST_PATH = os.path.join(MODEL_DIR, "isolation_forest.joblib")

class AnomalyEngine:
    _model = None

    @classmethod
    def load_model(cls):
        if cls._model is None and os.path.exists(IFOREST_PATH):
            try:
                cls._model = joblib.load(IFOREST_PATH)
            except Exception as e:
                print(f"[AnomalyEngine] Warning: Could not load {IFOREST_PATH}: {e}")
        return cls._model

    @classmethod
    def compute_anomaly_score(cls, features: Dict[str, Any]) -> float:
        """
        Unsupervised outlier score (0.0 to 100.0).
        Evaluates behavioral distance from typical legitimate transactions.
        """
        model = cls.load_model()
        if model is not None:
            try:
                from app.engine.ml_engine import FEATURE_COLUMNS
                vec = np.array([[float(features.get(col, 0.0)) for col in FEATURE_COLUMNS]])
                # score_samples returns opposite of anomaly score (lower is more anomalous)
                raw_score = model.score_samples(vec)[0]
                # Normalize typical range [-0.7, -0.3] to [100, 0]
                normalized = max(0.0, min(100.0, (-raw_score - 0.35) * 200.0))
                return round(normalized, 1)
            except Exception:
                pass

        # Fallback anomaly heuristic based on multivariate deviation
        z_score = abs(features.get("z_score", 0.0))
        dist_dev = min(1.0, features.get("distance_from_base_km", 0.0) / 2000.0)
        time_dev = 1.0 if not features.get("is_preferred_hour", 1) else 0.0
        device_dev = 1.0 if features.get("is_new_device", 0) else 0.0

        anomaly = (z_score * 12.0) + (dist_dev * 25.0) + (time_dev * 20.0) + (device_dev * 25.0)
        return round(min(100.0, max(0.0, anomaly)), 1)
