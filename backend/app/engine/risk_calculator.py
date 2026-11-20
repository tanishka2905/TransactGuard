from typing import Dict, Any, List, Tuple
from app.core.config import settings

class RiskCalculator:
    @staticmethod
    def calculate_unified_risk(
        ml_prob: float,
        anomaly_score: float,
        rule_score: float,
        features: Dict[str, Any],
        reasons: List[str],
        model_name: str = "Consensus Ensemble"
    ) -> Tuple[float, str, str, float, Dict[str, Any]]:
        """
        Synthesizes multiple defense layers into a normalized 0-100 Unified Risk Score.
        Returns:
            - final_risk_score (0.0 to 100.0)
            - risk_level ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')
            - status ('APPROVED', 'STEP_UP_REQUIRED', 'FLAGGED', 'BLOCKED')
            - velocity_score (0.0 to 100.0)
            - feature_breakdown (Full Explainable AI telemetry)
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
        if features.get("speed_kmh", 0.0) > 750.0:
            raw_score = max(raw_score, 88.0)
        if v5m >= 4:
            raw_score = max(raw_score, 85.0)
        if features.get("amount_ratio", 1.0) >= 6.0 and features.get("is_new_device", 0):
            raw_score = max(raw_score, 82.0)

        final_score = round(min(100.0, max(0.0, raw_score)), 1)

        # 5. Adaptive Step-Up Friction Matrix (Dynamic Risk Escalation)
        # Low Risk (< 25 pts): Instant 1-click execution (Zero Friction).
        # Medium Risk (25 – 60 pts): Step-up authentication challenge (Security Question).
        # High Risk (60 – 80 pts): Hardware Passkey (FIDO2 / WebAuthn).
        # Critical Risk (> 80 pts): Automated 15-minute escrow cooling-off period or manual SOC Analyst review.
        escrow_until = None
        if final_score < 25.0:
            risk_level = "LOW"
            status = "APPROVED"
            recommended_action = "ZERO_FRICTION_EXECUTION"
            challenge_type = "NONE"
            friction_tier = "TIER_1_ZERO_FRICTION"
            friction_description = "Low Risk (<25 pts): Instant 1-click execution (Zero Friction)."
        elif final_score <= 60.0:
            risk_level = "MEDIUM"
            status = "STEP_UP_REQUIRED"
            recommended_action = "REQUIRE_SECURITY_QUESTION"
            challenge_type = "SECURITY_QUESTION"
            friction_tier = "TIER_2_SECURITY_QUESTION"
            friction_description = "Medium Risk (25–60 pts): Step-up authentication challenge (Security Question)."
        elif final_score <= 80.0:
            risk_level = "HIGH"
            status = "STEP_UP_REQUIRED"
            recommended_action = "REQUIRE_HARDWARE_PASSKEY"
            challenge_type = "HARDWARE_PASSKEY"
            friction_tier = "TIER_3_HARDWARE_PASSKEY"
            friction_description = "High Risk (60–80 pts): Hardware Passkey / WebAuthn FIDO2 verification required."
        else:
            risk_level = "CRITICAL"
            status = "BLOCKED"
            recommended_action = "ESCROW_15M_OR_SOC_REVIEW"
            challenge_type = "ESCROW_COOLING_OFF"
            friction_tier = "TIER_4_ESCROW_OR_SOC_REVIEW"
            friction_description = "Critical Risk (>80 pts): Automated 15-minute escrow cooling-off period or manual SOC Analyst review."
            escrow_until = (datetime.datetime.utcnow() + datetime.timedelta(minutes=15)).isoformat()

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
            "active_model": model_name,
            "recommended_action": recommended_action,
            "challenge_type": challenge_type,
            "friction_tier": friction_tier,
            "friction_description": friction_description,
            "escrow_until": escrow_until
        }

        # Add ML and Anomaly reasons if elevated
        if ml_prob >= 0.70:
            reasons.append(f"Champion model [{model_name}] flagged elevated fraud pattern confidence ({ml_prob*100:.1f}%).")
        if anomaly_score >= 65.0:
            reasons.append(f"Dual anomaly detector (Isolation Forest + Mahalanobis) identified severe deviation from baseline ({anomaly_score}/100).")

        return final_score, risk_level, status, velocity_score, feature_breakdown
