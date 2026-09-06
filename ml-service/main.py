"""
main.py — MINE-INTEL ML Microservice
────────────────────────────────────
FastAPI service exposing:
  GET  /health                  — liveness probe (Spring Boot pings before calling predict)
  GET  /model/metrics           — training metrics + feature importances
  POST /predict                 — score a single cell
  POST /predict/batch           — score many cells at once (used by Analyze Area flow)

Explanation text generation:
  Uses SHAP TreeExplainer for per-prediction feature contributions.
  Converts SHAP values → natural-language paragraph (deterministic template).
  Never calls any external LLM — fast, free, reproducible.
"""

import json
import pickle
from pathlib import Path
from typing import List, Optional

import numpy as np
import shap
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# ── Paths ────────────────────────────────────────────────────────────────────
BASE       = Path(__file__).parent
MODEL_PATH = BASE / "models" / "model.pkl"
META_PATH  = BASE / "models" / "model_metadata.json"

# ── Feature order must match train_model.py ───────────────────────────────
FEATURES = [
    "satellite_spectral_anomaly",
    "lithology_compatibility",
    "structural_proximity",
    "mineralization_proximity",
    "soil_support_score",
    "terrain_score",
    "data_quality",
]

# ── Human-readable labels (spec §43) ─────────────────────────────────────
FEATURE_LABELS = {
    "satellite_spectral_anomaly": "Satellite Spectral Anomaly",
    "lithology_compatibility":    "Lithology Compatibility",
    "structural_proximity":       "Geological Structure",
    "mineralization_proximity":   "Mineralization Proximity",
    "soil_support_score":         "Soil Properties",
    "terrain_score":              "Terrain Context",
    "data_quality":               "Data Quality",
}

# ── Load model at startup ─────────────────────────────────────────────────
app = FastAPI(title="MINE-INTEL ML Service", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

_model = None
_explainer = None
_metadata: dict = {}

@app.on_event("startup")
def load_model():
    global _model, _explainer, _metadata
    if not MODEL_PATH.exists():
        raise RuntimeError(f"Model not found at {MODEL_PATH}. Run train_model.py first.")
    with open(MODEL_PATH, "rb") as f:
        _model = pickle.load(f)
    # SHAP TreeExplainer — works natively with RandomForest, very fast
    _explainer = shap.TreeExplainer(_model)
    if META_PATH.exists():
        with open(META_PATH) as f:
            _metadata = json.load(f)
    print("Model loaded, SHAP explainer ready.")


# ── Schemas ───────────────────────────────────────────────────────────────
class CellFeatures(BaseModel):
    satellite_spectral_anomaly: float = Field(..., ge=0, le=1)
    lithology_compatibility:    float = Field(..., ge=0, le=1)
    structural_proximity:       float = Field(..., ge=0, le=1)
    mineralization_proximity:   float = Field(..., ge=0, le=1)
    soil_support_score:         float = Field(..., ge=0, le=1)
    terrain_score:              float = Field(..., ge=0, le=1)
    data_quality:               float = Field(..., ge=0, le=1)
    cell_id:                    Optional[str] = None


class FeatureContribution(BaseModel):
    feature_name:       str
    label:              str
    shap_value:         float
    contribution_pct:   float   # % of total |SHAP| for this prediction


class PredictionResult(BaseModel):
    cell_id:                Optional[str]
    prospectivity_score:    int            # 0-100
    probability:            float
    feature_contributions:  List[FeatureContribution]
    explanation_text:       str
    model_version:          str = "rf-v1-synthetic"


class BatchRequest(BaseModel):
    cells: List[CellFeatures]


# ── Core prediction logic ─────────────────────────────────────────────────
def _predict_one(cell: CellFeatures) -> PredictionResult:
    x = np.array([[getattr(cell, f) for f in FEATURES]])
    prob = float(_model.predict_proba(x)[0, 1])
    score = min(100, max(0, int(round(prob * 100))))

    # SHAP values — shape (1, n_features) for positive class
    shap_vals = _explainer.shap_values(x)
    # For RandomForest binary: shap_values returns list [neg_class, pos_class]
    if isinstance(shap_vals, list):
        sv = shap_vals[1][0]
    else:
        sv = shap_vals[0]

    total_abs = float(np.sum(np.abs(sv))) or 1e-9
    contributions = []
    for i, fname in enumerate(FEATURES):
        contributions.append(FeatureContribution(
            feature_name=fname,
            label=FEATURE_LABELS[fname],
            shap_value=float(sv[i]),
            contribution_pct=round(abs(float(sv[i])) / total_abs * 100, 1),
        ))
    # Sort by absolute contribution descending
    contributions.sort(key=lambda c: c.contribution_pct, reverse=True)

    explanation = _generate_explanation(contributions, score)

    return PredictionResult(
        cell_id=cell.cell_id,
        prospectivity_score=score,
        probability=round(prob, 4),
        feature_contributions=contributions,
        explanation_text=explanation,
    )


def _generate_explanation(contributions: List[FeatureContribution], score: int) -> str:
    """
    Deterministic template-based NL explanation from SHAP contributions.
    No LLM — fast, free, reproducible for demo.
    """
    top3 = contributions[:3]
    sentences = []
    for i, c in enumerate(top3):
        direction = "supported" if c.shap_value >= 0 else "reduced"
        rank_word = ["strongest", "second", "third"][i]
        sentences.append(
            f"{c.label} was the {rank_word} contributor, {direction} the prospectivity "
            f"score by {c.contribution_pct:.0f}% of the model's evidence weighting."
        )
    paragraph = " ".join(sentences)
    paragraph += (
        f" Overall prospectivity score: {score}/100. "
        "Multiple independent evidence layers support further investigation. "
        "Field verification is required before any operational decision."
    )
    return paragraph


# ── Endpoints ─────────────────────────────────────────────────────────────
@app.get("/health")
def health():
    return {"status": "ok", "model_loaded": _model is not None}


@app.get("/model/metrics")
def model_metrics():
    if not _metadata:
        raise HTTPException(status_code=503, detail="Metadata not available")
    return _metadata


@app.post("/predict", response_model=PredictionResult)
def predict(cell: CellFeatures):
    return _predict_one(cell)


@app.post("/predict/batch", response_model=List[PredictionResult])
def predict_batch(request: BatchRequest):
    return [_predict_one(cell) for cell in request.cells]


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
