from typing import Dict, Any, List, Tuple
from app.core.config import settings

class RiskCalculator:
    @staticmethod
    def calculate_unified_risk(
        ml_prob: float,
        anomaly_score: float,
        rule_score: float,
        features: Dict[str, Any],
        reasons: List[str]
    ) -> Tuple[float, str, str, float, Dict[str, Any]]:
        """
        Synthesizes multiple defense layers into a normalized 0-100 Unified Risk Score.
        Returns:
            - final_risk_score (0.0 to 100.0)
            - risk_level ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')
            - status ('APPROVED', 'FLAGGED', 'BLOCKED')
            - velocity_score (0.0 to 100.0)
            - feature_breakdown (Waterfall data for Explainable AI UI)
        """
        # 1. Compute velocity score
        v5m = features.get("velocity_5m", 0)
        v1h = features.get("velocity_1h", 0)
        velocity_score = min(100.0, (v5m * 25.0) + (max(0, v1h - 4) * 10.0))

        # 2. Convert ML probability to 0-100 scale
        ml_score = ml_prob * 100.0

        # 3. Weighted hybrid combination
        raw_score = (
            (settings.WEIGHT_ML * ml_score) +
            (settings.WEIGHT_ANOMALY * anomaly_score) +
            (settings.WEIGHT_RULES * rule_score) +
            (settings.WEIGHT_VELOCITY * velocity_score)
        )

        # 4. Deterministic Safety Constraints (Hard Overrides)
        # Impossible physical travel or blatant multi-transaction bot spray cannot be overridden by ML
        if features.get("speed_kmh", 0.0) > 750.0:
            raw_score = max(raw_score, 88.0)
        if v5m >= 4:
            raw_score = max(raw_score, 85.0)
        if features.get("amount_ratio", 1.0) >= 6.0 and features.get("is_new_device", 0):
            raw_score = max(raw_score, 82.0)

        final_score = round(min(100.0, max(0.0, raw_score)), 1)

        # 5. Risk Level Classification
        if final_score <= settings.RISK_LOW_MAX:
            risk_level = "LOW"
            status = "APPROVED"
        elif final_score <= settings.RISK_MEDIUM_MAX:
            risk_level = "MEDIUM"
            status = "APPROVED" # Or Flagged for 3DS
        elif final_score <= settings.RISK_HIGH_MAX:
            risk_level = "HIGH"
            status = "FLAGGED"
        else:
            risk_level = "CRITICAL"
            status = "BLOCKED"

        # 6. Build Explainable AI Breakdown
        feature_breakdown = {
            "ml_contribution": round(settings.WEIGHT_ML * ml_score, 1),
            "anomaly_contribution": round(settings.WEIGHT_ANOMALY * anomaly_score, 1),
            "rule_contribution": round(settings.WEIGHT_RULES * rule_score, 1),
            "velocity_contribution": round(settings.WEIGHT_VELOCITY * velocity_score, 1),
            "ml_probability_raw": round(ml_prob, 4),
            "anomaly_score_raw": anomaly_score,
            "rule_score_raw": rule_score,
            "velocity_score_raw": velocity_score,
            "speed_kmh": features.get("speed_kmh", 0.0),
            "amount_ratio": features.get("amount_ratio", 1.0),
            "is_new_device": bool(features.get("is_new_device", 0)),
            "is_night": bool(features.get("is_night", 0)),
        }

        # Add ML and Anomaly reasons if elevated
        if ml_prob >= 0.75:
            reasons.append(f"Supervised ML model flagged elevated fraud pattern confidence ({ml_prob*100:.1f}%).")
        if anomaly_score >= 65.0:
            reasons.append(f"Behavioral anomaly detector identified severe deviation from user historical baseline (Score: {anomaly_score}/100).")

        return final_score, risk_level, status, velocity_score, feature_breakdown
