import os
import json
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, IsolationForest
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, roc_auc_score, average_precision_score, confusion_matrix

MODEL_DIR = os.path.join(os.path.dirname(__file__), "models_store")
os.makedirs(MODEL_DIR, exist_ok=True)

FEATURE_COLUMNS = [
    "amount", "amount_ratio", "z_score", "hour", "is_night",
    "is_preferred_hour", "is_new_device", "is_new_location",
    "distance_from_base_km", "speed_kmh", "velocity_5m",
    "velocity_1h", "velocity_24h", "is_new_beneficiary"
]

def generate_synthetic_training_data(n_samples: int = 15000):
    """
    Synthesize realistic financial transaction distributions mimicking real bank telemetry.
    ~1.8% fraud rate with realistic multi-modal distributions.
    """
    np.random.seed(42)
    n_fraud = int(n_samples * 0.018)
    n_legit = n_samples - n_fraud

    # --- Legitimate Transactions ---
    legit_amount = np.random.exponential(scale=2200.0, size=n_legit) + 80.0
    legit_amount_ratio = np.random.gamma(shape=2.0, scale=0.5, size=n_legit) # Centered around ~1.0
    legit_z_score = (legit_amount_ratio - 1.0) / 0.6
    legit_hour = np.random.choice(range(8, 23), size=n_legit) # Normal active hours
    legit_is_night = (legit_hour < 6).astype(int)
    legit_is_preferred = np.ones(n_legit, dtype=int)
    legit_is_new_device = np.random.choice([0, 1], p=[0.94, 0.06], size=n_legit)
    legit_is_new_loc = np.random.choice([0, 1], p=[0.92, 0.08], size=n_legit)
    legit_dist = np.random.exponential(scale=15.0, size=n_legit)
    legit_speed = np.random.uniform(0.0, 60.0, size=n_legit) # Walking / driving speeds
    legit_v5m = np.random.choice([0, 1, 2], p=[0.85, 0.12, 0.03], size=n_legit)
    legit_v1h = np.random.poisson(lam=1.5, size=n_legit)
    legit_v24h = legit_v1h + np.random.poisson(lam=3.0, size=n_legit)
    legit_new_ben = np.random.choice([0, 1], p=[0.93, 0.07], size=n_legit)
    legit_labels = np.zeros(n_legit, dtype=int)

    # --- Fraudulent Transactions ---
    # High amounts, night activity, impossible speeds, device jumps, velocity bursts
    fraud_amount = np.random.exponential(scale=35000.0, size=n_fraud) + 12000.0
    fraud_amount_ratio = np.random.uniform(3.5, 9.0, size=n_fraud)
    fraud_z_score = np.random.uniform(3.0, 7.5, size=n_fraud)
    fraud_hour = np.random.choice(range(24), size=n_fraud)
    fraud_is_night = np.random.choice([0, 1], p=[0.45, 0.55], size=n_fraud)
    fraud_is_preferred = np.random.choice([0, 1], p=[0.75, 0.25], size=n_fraud)
    fraud_is_new_device = np.random.choice([0, 1], p=[0.15, 0.85], size=n_fraud)
    fraud_is_new_loc = np.random.choice([0, 1], p=[0.10, 0.90], size=n_fraud)
    fraud_dist = np.random.uniform(500.0, 6500.0, size=n_fraud)
    fraud_speed = np.random.choice([0.0, 850.0, 1200.0, 4500.0], p=[0.2, 0.35, 0.25, 0.2], size=n_fraud)
    fraud_v5m = np.random.choice([1, 2, 4, 6], p=[0.1, 0.2, 0.4, 0.3], size=n_fraud)
    fraud_v1h = fraud_v5m + np.random.poisson(lam=4.0, size=n_fraud)
    fraud_v24h = fraud_v1h + np.random.poisson(lam=5.0, size=n_fraud)
    fraud_new_ben = np.random.choice([0, 1], p=[0.2, 0.8], size=n_fraud)
    fraud_labels = np.ones(n_fraud, dtype=int)

    # Combine
    X = np.vstack([
        np.column_stack([
            legit_amount, legit_amount_ratio, legit_z_score, legit_hour, legit_is_night,
            legit_is_preferred, legit_is_new_device, legit_is_new_loc, legit_dist,
            legit_speed, legit_v5m, legit_v1h, legit_v24h, legit_new_ben
        ]),
        np.column_stack([
            fraud_amount, fraud_amount_ratio, fraud_z_score, fraud_hour, fraud_is_night,
            fraud_is_preferred, fraud_is_new_device, fraud_is_new_loc, fraud_dist,
            fraud_speed, fraud_v5m, fraud_v1h, fraud_v24h, fraud_new_ben
        ])
    ])
    y = np.concatenate([legit_labels, fraud_labels])

    # Shuffle
    idx = np.random.permutation(len(y))
    return pd.DataFrame(X[idx], columns=FEATURE_COLUMNS), y[idx]

def train_and_export():
    print("[Pipeline] Generating synthetic bank transaction baseline...")
    df_X, y = generate_synthetic_training_data(18000)

    X_train, X_test, y_train, y_test = train_test_split(
        df_X, y, test_size=0.25, random_state=42, stratify=y
    )

    print(f"[Pipeline] Training Supervised Random Forest Classifier on {len(X_train)} samples...")
    # class_weight='balanced' to handle severe imbalance
    rf = RandomForestClassifier(
        n_estimators=120,
        max_depth=10,
        class_weight="balanced",
        random_state=42,
        n_jobs=-1
    )
    rf.fit(X_train, y_train)

    y_pred = rf.predict(X_test)
    y_prob = rf.predict_proba(X_test)[:, 1]

    roc_auc = float(roc_auc_score(y_test, y_prob))
    pr_auc = float(average_precision_score(y_test, y_prob))
    cm = confusion_matrix(y_test, y_pred).tolist()

    print("\n--- Model Evaluation Results ---")
    print(f"ROC-AUC Score: {roc_auc:.4f}")
    print(f"PR-AUC Score:  {pr_auc:.4f}")
    print("Confusion Matrix:")
    print(cm)
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=["Legitimate", "Fraud"]))

    # Save RF model
    rf_path = os.path.join(MODEL_DIR, "fraud_classifier.joblib")
    joblib.dump(rf, rf_path)
    print(f"[Pipeline] Saved Supervised Classifier to {rf_path}")

    # Train Unsupervised Isolation Forest on normal data
    print("\n[Pipeline] Training Unsupervised Isolation Forest for behavioral anomaly detection...")
    X_legit_only = X_train[y_train == 0]
    iforest = IsolationForest(
        n_estimators=100,
        contamination=0.02,
        random_state=42,
        n_jobs=-1
    )
    iforest.fit(X_legit_only)

    iforest_path = os.path.join(MODEL_DIR, "isolation_forest.joblib")
    joblib.dump(iforest, iforest_path)
    print(f"[Pipeline] Saved Isolation Forest to {iforest_path}")

    # Feature Importance
    importances = {col: round(float(imp), 4) for col, imp in zip(FEATURE_COLUMNS, rf.feature_importances_)}
    sorted_importances = dict(sorted(importances.items(), key=lambda item: item[1], reverse=True))

    metadata = {
        "version": "v2.4.0",
        "model_type": "RandomForestClassifier + IsolationForest",
        "training_samples": len(X_train),
        "test_samples": len(X_test),
        "roc_auc": round(roc_auc, 4),
        "pr_auc": round(pr_auc, 4),
        "confusion_matrix": cm,
        "feature_importances": sorted_importances,
        "feature_columns": FEATURE_COLUMNS
    }

    meta_path = os.path.join(MODEL_DIR, "metadata.json")
    with open(meta_path, "w") as f:
        json.dump(metadata, f, indent=2)
    print(f"[Pipeline] Saved Model Metadata & Benchmarks to {meta_path}")

if __name__ == "__main__":
    train_and_export()
