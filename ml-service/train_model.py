"""
train_model.py
──────────────
Trains a RandomForestClassifier on the synthetic exploration dataset.

Key design decisions (matching spec §29 — spatial validation):
  • Spatial train/test split by zone_id:
      Training zones: A B C D E F  (75% of data)
      Test zones:     G H           (25% of data, geographically separate)
    This avoids spatial leakage — the model never saw nearby cells during training.

Outputs:
  • models/model.pkl              — trained RandomForest
  • models/model_metadata.json   — metrics + feature names (read by API + UI)
  • Prints metrics to stdout     — displayed on Model/Admin screen
"""

import json
import pickle
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (accuracy_score, classification_report,
                             f1_score, precision_score, recall_score,
                             roc_auc_score)

BASE = Path(__file__).parent
DATA_PATH  = BASE / "data" / "synthetic_cells.csv"
MODEL_DIR  = BASE / "models"
MODEL_PATH = MODEL_DIR / "model.pkl"
META_PATH  = MODEL_DIR / "model_metadata.json"

MODEL_DIR.mkdir(exist_ok=True)

FEATURES = [
    "satellite_spectral_anomaly",
    "lithology_compatibility",
    "structural_proximity",
    "mineralization_proximity",
    "soil_support_score",
    "terrain_score",
    "data_quality",
]

# ── Load data ───────────────────────────────────────────────────────────────
df = pd.read_csv(DATA_PATH)
print(f"Loaded {len(df):,} rows. Positive rate: {df['label'].mean():.2%}\n")

# ── Spatial split (zones G, H → test; rest → train) ─────────────────────────
train_df = df[~df["zone_id"].isin(["G", "H"])].copy()
test_df  = df[ df["zone_id"].isin(["G", "H"])].copy()

X_train, y_train = train_df[FEATURES].values, train_df["label"].values
X_test,  y_test  = test_df[FEATURES].values,  test_df["label"].values

print(f"Spatial split: train={len(X_train):,} (zones A-F) | test={len(X_test):,} (zones G-H)")

# ── Train ───────────────────────────────────────────────────────────────────
clf = RandomForestClassifier(
    n_estimators=200,
    max_depth=10,
    min_samples_leaf=5,
    class_weight="balanced",     # handles imbalanced positive rate
    random_state=42,
    n_jobs=-1,
)
clf.fit(X_train, y_train)

# ── Evaluate ────────────────────────────────────────────────────────────────
y_pred      = clf.predict(X_test)
y_prob      = clf.predict_proba(X_test)[:, 1]

accuracy    = accuracy_score(y_test, y_pred)
precision   = precision_score(y_test, y_pred, zero_division=0)
recall      = recall_score(y_test, y_pred, zero_division=0)
f1          = f1_score(y_test, y_pred, zero_division=0)
roc_auc     = roc_auc_score(y_test, y_prob)

print("\n── Model Diagnostics (DEMO METRICS — synthetic data) ──────────────────")
print(f"  Accuracy : {accuracy:.4f}")
print(f"  Precision: {precision:.4f}")
print(f"  Recall   : {recall:.4f}")
print(f"  F1-Score : {f1:.4f}")
print(f"  ROC-AUC  : {roc_auc:.4f}")
print("\n── Full classification report ─────────────────────────────────────────")
print(classification_report(y_test, y_pred, target_names=["No indication", "Indication"]))

# ── Feature importances ─────────────────────────────────────────────────────
importances = clf.feature_importances_
fi_sorted = sorted(
    zip(FEATURES, importances),
    key=lambda x: x[1], reverse=True
)
print("── Feature importances (mean decrease in impurity) ────────────────────")
for fname, imp in fi_sorted:
    bar = "█" * int(imp * 40)
    print(f"  {fname:<35} {imp:.4f}  {bar}")

# ── Save model ──────────────────────────────────────────────────────────────
with open(MODEL_PATH, "wb") as f:
    pickle.dump(clf, f)
print(f"\nModel saved → {MODEL_PATH}")

# ── Save metadata (read by API + UI) ────────────────────────────────────────
metadata = {
    "features": FEATURES,
    "n_estimators": 200,
    "spatial_split": True,
    "train_zones": ["A", "B", "C", "D", "E", "F"],
    "test_zones": ["G", "H"],
    "train_size": len(X_train),
    "test_size": len(X_test),
    "metrics": {
        "accuracy":   round(accuracy, 4),
        "precision":  round(precision, 4),
        "recall":     round(recall, 4),
        "f1":         round(f1, 4),
        "roc_auc":    round(roc_auc, 4),
    },
    "feature_importances": {f: round(float(i), 4) for f, i in fi_sorted},
    "data_note": "DEMO METRICS — trained on 10,000 synthetic cells (Balaghat simulation)"
}
with open(META_PATH, "w") as f:
    json.dump(metadata, f, indent=2)
print(f"Metadata saved → {META_PATH}")
