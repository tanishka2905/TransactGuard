import os
import json
from typing import Dict, Any, List
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

from app.engine.ml_engine import MLEngine, MODEL_FILES, MODEL_DIR, REGISTRY_PATH

router = APIRouter(prefix="/models", tags=["Model Intelligence & Tournament Registry"])

class SelectChampionRequest(BaseModel):
    model_id: str

class CompareInferenceRequest(BaseModel):
    amount: float = 5000.0
    amount_ratio: float = 1.0
    z_score: float = 0.0
    hour: int = 14
    is_night: int = 0
    is_preferred_hour: int = 1
    is_new_device: int = 0
    is_new_location: int = 0
    distance_from_base_km: float = 10.0
    speed_kmh: float = 0.0
    velocity_5m: int = 0
    velocity_1h: int = 1
    velocity_24h: int = 3
    is_new_beneficiary: int = 0

@router.get("/registry")
def get_model_registry() -> Dict[str, Any]:
    """
    Returns the comprehensive Model Tournament Leaderboard,
    including PR-AUC, ROC-AUC, F1-scores, latencies, and confusion matrices
    for all 6 registered machine learning models.
    """
    if os.path.exists(REGISTRY_PATH):
        try:
            with open(REGISTRY_PATH, "r") as f:
                data = json.load(f)
            # Ensure active champion reflects live memory state
            data["champion_model_id"] = MLEngine.get_active_model_id()
            if data["champion_model_id"] in MODEL_FILES:
                data["champion_model_name"] = MODEL_FILES[data["champion_model_id"]][2]
            return data
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to read model registry: {e}")

    # Fallback if registry not on disk
    return {
        "version": "v3.0.0",
        "champion_model_id": MLEngine.get_active_model_id(),
        "champion_model_name": "Consensus Ensemble",
        "active_models_count": len(MODEL_FILES),
        "leaderboard": [],
        "feature_importances": {}
    }

@router.post("/select-champion")
def select_champion_model(payload: SelectChampionRequest) -> Dict[str, Any]:
    """
    Dynamically switches the active champion model used for live inference
    without requiring a server restart.
    """
    if payload.model_id not in MODEL_FILES:
        valid_models = list(MODEL_FILES.keys())
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid model_id '{payload.model_id}'. Valid choices: {valid_models}"
        )

    success = MLEngine.set_champion_model(payload.model_id)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to load and activate model.")

    display_name = MODEL_FILES[payload.model_id][2]
    return {
        "status": "SUCCESS",
        "message": f"Active champion model successfully switched to [{display_name}]",
        "champion_model_id": payload.model_id,
        "champion_model_name": display_name
    }

@router.post("/compare-inference")
def compare_model_inferences(features: CompareInferenceRequest) -> Dict[str, Any]:
    """
    Executes live multi-model inference across ALL registered models simultaneously
    to inspect model variance and consensus agreement on a single feature vector.
    """
    feat_dict = features.dict()
    comparison = MLEngine.predict_all_models(feat_dict)
    return comparison

@router.post("/retrain")
def trigger_pipeline_retrain() -> Dict[str, Any]:
    """
    Triggers an on-demand re-execution of the multi-model training and evaluation pipeline.
    """
    try:
        from train_model import train_and_export
        train_and_export()
        return {
            "status": "SUCCESS",
            "message": "Model training pipeline executed successfully. All models and registry updated."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Retraining failed: {e}")
