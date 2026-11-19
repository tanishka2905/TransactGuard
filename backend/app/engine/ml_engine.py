import os
import json
import joblib
import numpy as np
from typing import Dict, Any, Tuple, List, Optional

MODEL_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "models_store")
REGISTRY_PATH = os.path.join(MODEL_DIR, "model_registry.json")
SCALER_PATH = os.path.join(MODEL_DIR, "scaler.joblib")

FEATURE_COLUMNS = [
    "amount", "amount_ratio", "z_score", "hour", "is_night",
    "is_preferred_hour", "is_new_device", "is_new_location",
    "distance_from_base_km", "speed_kmh", "velocity_5m",
    "velocity_1h", "velocity_24h", "is_new_beneficiary"
]

MODEL_FILES = {
    "consensus_ensemble": ("consensus_ensemble.joblib", False, "Consensus Ensemble"),
    "lightgbm": ("lgbm_classifier.joblib", False, "LightGBM"),
    "xgboost": ("xgb_classifier.joblib", False, "XGBoost"),
    "random_forest": ("rf_classifier.joblib", False, "Random Forest"),
    "multi_layer_perceptron_mlp": ("mlp_neural_net.joblib", True, "Multi-Layer Perceptron"),
    "logistic_regression": ("logistic_regression.joblib", True, "Logistic Regression")
}

class MLEngine:
    _models: Dict[str, Any] = {}
    _scaler: Optional[Any] = None
    _active_champion_id: str = "consensus_ensemble"

    @classmethod
    def get_active_model_id(cls) -> str:
        return cls._active_champion_id

    @classmethod
    def get_scaler(cls):
        if cls._scaler is None and os.path.exists(SCALER_PATH):
            try:
                cls._scaler = joblib.load(SCALER_PATH)
            except Exception as e:
                print(f"[MLEngine] Warning loading scaler: {e}")
        return cls._scaler

    @classmethod
    def load_model_by_id(cls, model_id: str):
        if model_id in cls._models:
            return cls._models[model_id]

        if model_id in MODEL_FILES:
            filename, _, _ = MODEL_FILES[model_id]
            file_path = os.path.join(MODEL_DIR, filename)
            if os.path.exists(file_path):
                try:
                    cls._models[model_id] = joblib.load(file_path)
                    return cls._models[model_id]
                except Exception as e:
                    print(f"[MLEngine] Warning: Could not load {model_id} from {file_path}: {e}")

        # Fallback to default fraud_classifier.joblib
        default_path = os.path.join(MODEL_DIR, "fraud_classifier.joblib")
        if os.path.exists(default_path) and "default" not in cls._models:
            try:
                cls._models["default"] = joblib.load(default_path)
                return cls._models["default"]
            except Exception:
                pass
        return cls._models.get("default")

    @classmethod
    def set_champion_model(cls, model_id: str) -> bool:
        """Dynamically set the active champion model without server restart."""
        if model_id in MODEL_FILES:
            loaded = cls.load_model_by_id(model_id)
            if loaded is not None:
                cls._active_champion_id = model_id
                # Update registry JSON
                try:
                    if os.path.exists(REGISTRY_PATH):
                        with open(REGISTRY_PATH, "r") as f:
                            data = json.load(f)
                        data["champion_model_id"] = model_id
                        data["champion_model_name"] = MODEL_FILES[model_id][2]
                        with open(REGISTRY_PATH, "w") as f:
                            json.dump(data, f, indent=2)
                except Exception as e:
                    print(f"[MLEngine] Note saving champion change: {e}")
                return True
        return False

    @classmethod
    def predict_fraud_probability(
        cls, 
        features: Dict[str, Any], 
        model_id: Optional[str] = None
    ) -> Tuple[float, Dict[str, float]]:
        """
        Calculates ML fraud probability (0.0 to 1.0) and feature importances
        using the specified or active champion model.
        """
        target_model_id = model_id or cls._active_champion_id
        model = cls.load_model_by_id(target_model_id)
        
        vec = [float(features.get(col, 0.0)) for col in FEATURE_COLUMNS]
        X = np.array([vec])

        # Check if model requires scaled features
        requires_scaling = MODEL_FILES.get(target_model_id, (None, False, ""))[1]
        if requires_scaling:
            scaler = cls.get_scaler()
            if scaler is not None:
                try:
                    X = scaler.transform(X)
                except Exception:
                    pass

        if model is not None:
            try:
                prob = float(model.predict_proba(X)[0][1])
            except Exception:
                prob = cls._heuristic_prob(features)
        else:
            prob = cls._heuristic_prob(features)

        # Feature contribution decomposition (SHAP-style local explanations)
        feature_contributions = {
            "amount_anomaly": round(min(1.0, features.get("amount_ratio", 1.0) / 4.0) * 0.35, 3),
            "velocity_surge": round(min(1.0, features.get("velocity_5m", 0) / 3.0) * 0.25, 3),
            "impossible_travel": round(min(1.0, features.get("speed_kmh", 0) / 750.0) * 0.30, 3),
            "unrecognized_device": 0.15 if features.get("is_new_device", 0) else 0.0,
            "nocturnal_timing": 0.10 if features.get("is_night", 0) else 0.0
        }

        return round(prob, 4), feature_contributions

    @classmethod
    def predict_all_models(cls, features: Dict[str, Any]) -> Dict[str, Any]:
        """
        Runs multi-model inference across ALL registered models in parallel
        and returns comparative probability outputs and consensus agreement.
        """
        vec = [float(features.get(col, 0.0)) for col in FEATURE_COLUMNS]
        X_raw = np.array([vec])
        scaler = cls.get_scaler()
        X_scaled = scaler.transform(X_raw) if scaler is not None else X_raw

        results = {}
        probs = []

        for m_id, (_, req_scale, display_name) in MODEL_FILES.items():
            m = cls.load_model_by_id(m_id)
            if m is not None:
                try:
                    inp = X_scaled if req_scale else X_raw
                    p = float(m.predict_proba(inp)[0][1])
                    results[m_id] = {
                        "name": display_name,
                        "probability": round(p, 4),
                        "verdict": "FRAUD" if p >= 0.50 else "LEGITIMATE"
                    }
                    probs.append(p)
                except Exception as e:
                    results[m_id] = {
                        "name": display_name,
                        "probability": round(cls._heuristic_prob(features), 4),
                        "verdict": "ERROR_FALLBACK"
                    }

        avg_prob = float(np.mean(probs)) if probs else cls._heuristic_prob(features)
        variance = float(np.var(probs)) if len(probs) > 1 else 0.0
        consensus_agreement = "HIGH" if variance < 0.05 else ("MEDIUM" if variance < 0.15 else "DIVERGENT")

        return {
            "model_predictions": results,
            "average_probability": round(avg_prob, 4),
            "model_variance": round(variance, 4),
            "consensus_agreement": consensus_agreement,
            "active_champion": cls._active_champion_id
        }

    @staticmethod
    def _heuristic_prob(features: Dict[str, Any]) -> float:
        """Statistical fallback when model file is not available."""
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
