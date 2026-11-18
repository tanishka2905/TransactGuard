from typing import Dict, Any, List, Tuple

class RuleEngine:
    @staticmethod
    def evaluate_rules(features: Dict[str, Any]) -> Tuple[float, List[str], Dict[str, float]]:
        """
        Evaluate deterministic security rules against extracted features.
        Returns:
            - rule_score (0.0 to 100.0)
            - reasons (List of human-readable explanations)
            - rule_contributions (Dict of rule name to score contribution)
        """
        reasons = []
        rule_contributions = {}
        total_penalty = 0.0

        # Rule 1: High-Value Anomaly
        amount_ratio = features.get("amount_ratio", 1.0)
        z_score = features.get("z_score", 0.0)
        if amount_ratio >= 4.0 or z_score >= 3.5:
            penalty = min(50.0, 20.0 + (amount_ratio * 4.0))
            total_penalty += penalty
            rule_contributions["high_value_spike"] = round(penalty, 1)
            reasons.append(f"Transaction amount is {amount_ratio}x higher than user's historical average (₹{features.get('user_avg_amount', 0):,.2f}).")
        elif amount_ratio >= 2.5:
            penalty = 18.0
            total_penalty += penalty
            rule_contributions["elevated_value"] = penalty
            reasons.append(f"Elevated transaction amount ({amount_ratio}x user normal range).")

        # Rule 2: Impossible Travel (Physical Velocity Violation)
        speed_kmh = features.get("speed_kmh", 0.0)
        if speed_kmh > 750.0: # Exceeds commercial flight speed or instant jump
            penalty = 65.0
            total_penalty += penalty
            rule_contributions["impossible_travel"] = penalty
            reasons.append(f"Impossible travel detected: Implied transit speed of {speed_kmh:,.0f} km/h between consecutive transactions.")

        # Rule 3: High-Frequency Transaction Velocity Burst
        velocity_5m = features.get("velocity_5m", 0)
        if velocity_5m >= 3:
            penalty = min(45.0, 15.0 * velocity_5m)
            total_penalty += penalty
            rule_contributions["velocity_burst"] = round(penalty, 1)
            reasons.append(f"High-frequency velocity: {velocity_5m + 1} transactions initiated in the last 5 minutes.")

        # Rule 4: New / Unrecognized Device
        is_new_device = features.get("is_new_device", 0)
        if is_new_device:
            penalty = 22.0
            if amount_ratio > 2.0:
                penalty += 15.0 # Combined risk multiplier
            total_penalty += penalty
            rule_contributions["unrecognized_device"] = penalty
            reasons.append("Transaction originated from an unrecognized device hardware identifier.")

        # Rule 5: Nocturnal Outlier (Night-time Anomaly)
        is_night = features.get("is_night", 0)
        is_preferred_hour = features.get("is_preferred_hour", 1)
        if is_night and not is_preferred_hour:
            penalty = 18.0
            total_penalty += penalty
            rule_contributions["nocturnal_anomaly"] = penalty
            reasons.append(f"Unusual transaction timestamp: Initiated at {features.get('hour', 0):02d}:00 outside user's active baseline hours.")

        # Rule 6: New Beneficiary Surge
        is_new_beneficiary = features.get("is_new_beneficiary", 0)
        if is_new_beneficiary and amount_ratio >= 2.5:
            penalty = 25.0
            total_penalty += penalty
            rule_contributions["new_beneficiary_high_val"] = penalty
            reasons.append("High-value transfer routed to a newly registered, unverified beneficiary.")

        # Rule 7: Geographic Distance from Base
        distance_km = features.get("distance_from_base_km", 0.0)
        is_new_location = features.get("is_new_location", 0)
        if is_new_location and distance_km > 1500.0:
            penalty = 20.0
            total_penalty += penalty
            rule_contributions["distant_location"] = penalty
            reasons.append(f"Transaction location is {distance_km:,.0f} km away from user's primary operating region.")

        # Normalize total penalty to 0 - 100
        rule_score = min(100.0, total_penalty)
        return round(rule_score, 1), reasons, rule_contributions
