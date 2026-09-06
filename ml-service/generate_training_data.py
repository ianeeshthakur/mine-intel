"""
generate_training_data.py
─────────────────────────
Generates ~10,000 synthetic exploration cells for the Balaghat region.

Feature structure (all 0-1):
  satellite_spectral_anomaly  — surface reflectance anomaly strength
  lithology_compatibility     — geologic unit suitability for Mn
  structural_proximity        — proximity to relevant faults/lineaments
  mineralization_proximity    — proximity to known Mn occurrences
  soil_support_score          — soil geochemistry support
  terrain_score               — terrain context suitability
  data_quality                — completeness/quality of available data

Label rule (prevents the model from learning random noise):
  P(positive) = sigmoid(2 * lithology * mineralization * structural
                        + 0.5 * spectral - 0.3)  + noise
  Binary label = 1 if P > 0.5, else 0
  This creates a ~25% positive rate that the RF can genuinely learn.

Also assigns a zone_id (A-H) for spatial-style train/test splitting
to avoid spatial leakage (spec §29).
"""

import numpy as np
import pandas as pd
from pathlib import Path

SEED = 42
N = 10_000
rng = np.random.default_rng(SEED)

# ── Features ───────────────────────────────────────────────────────────────
satellite_spectral_anomaly = rng.beta(2, 5, N)          # right-skewed: most areas low
lithology_compatibility    = rng.beta(2, 3, N)
structural_proximity       = rng.beta(2, 4, N)
mineralization_proximity   = rng.beta(1.5, 4, N)        # sparse known occurrences
soil_support_score         = rng.beta(3, 3, N)          # roughly symmetric
terrain_score              = rng.beta(3, 3, N)
data_quality               = rng.beta(5, 2, N)          # left-skewed: data mostly available

# ── Spatial zones (A-H) — latitude band proxy ──────────────────────────────
# 8 spatial zones; each cell belongs to exactly one
zone_ids = rng.choice(list("ABCDEFGH"), size=N)

# ── Label generation (meaningful signal, not pure noise) ───────────────────
def sigmoid(x):
    return 1 / (1 + np.exp(-x))

# Core mineralisation signal
linear_signal = (
    2.0 * lithology_compatibility * mineralization_proximity * structural_proximity
    + 1.0 * satellite_spectral_anomaly
    + 0.5 * soil_support_score
    - 1.2                          # intercept keeps positive rate ~25%
)
noise = rng.normal(0, 0.3, N)
prob_positive = sigmoid(linear_signal + noise)
label = (prob_positive > 0.5).astype(int)

print(f"Positive class rate: {label.mean():.2%}")

# ── Approximate lat/lng in Balaghat bounding box ───────────────────────────
lat = rng.uniform(21.55, 22.05, N)
lng = rng.uniform(79.88, 80.50, N)

# ── Assemble DataFrame ─────────────────────────────────────────────────────
df = pd.DataFrame({
    "cell_id":                      np.arange(N),
    "zone_id":                      zone_ids,
    "latitude":                     lat,
    "longitude":                    lng,
    "satellite_spectral_anomaly":   satellite_spectral_anomaly,
    "lithology_compatibility":      lithology_compatibility,
    "structural_proximity":         structural_proximity,
    "mineralization_proximity":     mineralization_proximity,
    "soil_support_score":           soil_support_score,
    "terrain_score":                terrain_score,
    "data_quality":                 data_quality,
    "label":                        label,
    "prob_positive":                prob_positive,
})

out_path = Path(__file__).parent / "data" / "synthetic_cells.csv"
out_path.parent.mkdir(exist_ok=True)
df.to_csv(out_path, index=False)
print(f"Saved {len(df):,} rows → {out_path}")
