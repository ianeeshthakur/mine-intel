package com.mineintel.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * MlClientService — calls the Python FastAPI microservice for ML scoring.
 *
 * Graceful degradation:
 *   - If the ML service is unreachable, returns null (caller uses stale/fallback score).
 *   - Never throws to the analysis flow — a missing ML service degrades gracefully.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MlClientService {

    private static final String ML_BASE_URL = "http://localhost:8000";
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final RestTemplate restTemplate = new RestTemplate();

    /** Check if ML service is alive. */
    public boolean isHealthy() {
        try {
            Map<?, ?> resp = restTemplate.getForObject(ML_BASE_URL + "/health", Map.class);
            return resp != null && Boolean.TRUE.equals(resp.get("model_loaded"));
        } catch (RestClientException e) {
            log.warn("ML service health check failed: {}", e.getMessage());
            return false;
        }
    }

    /** Predict a single cell, returns null on failure. */
    public MlPrediction predict(CellFeatureVector cell) {
        try {
            Map<?, ?> result = restTemplate.postForObject(
                ML_BASE_URL + "/predict", cell, Map.class);
            return parsePrediction(result);
        } catch (Exception e) {
            log.warn("ML predict failed for cell {}: {}", cell.cell_id(), e.getMessage());
            return null;
        }
    }

    /** Batch predict — returns list matching input order, nulls where failed. */
    public List<MlPrediction> predictBatch(List<CellFeatureVector> cells) {
        try {
            Map<String, Object> request = Map.of("cells", cells);
            Object[] results = restTemplate.postForObject(
                ML_BASE_URL + "/predict/batch", request, Object[].class);
            if (results == null) return List.of();
            return java.util.Arrays.stream(results)
                .map(r -> parsePrediction((Map<?, ?>) r))
                .toList();
        } catch (Exception e) {
            log.warn("ML batch predict failed: {}", e.getMessage());
            return List.of();
        }
    }

    /** Fetch model metrics from ML service. */
    public Map<?, ?> getModelMetrics() {
        try {
            return restTemplate.getForObject(ML_BASE_URL + "/model/metrics", Map.class);
        } catch (RestClientException e) {
            log.warn("ML metrics fetch failed: {}", e.getMessage());
            return Map.of("error", "ML service unavailable");
        }
    }

    @SuppressWarnings("unchecked")
    private MlPrediction parsePrediction(Map<?, ?> raw) {
        if (raw == null) return null;
        try {
            int score = ((Number) raw.get("prospectivity_score")).intValue();
            String contribJson = objectMapper.writeValueAsString(raw.get("feature_contributions"));
            Object expObj = raw.get("explanation_text");
            String explanation = expObj != null ? expObj.toString() : "";
            return new MlPrediction(score, contribJson, explanation);
        } catch (JsonProcessingException | ClassCastException e) {
            log.warn("Failed to parse ML prediction: {}", e.getMessage());
            return null;
        }
    }

    // ── Inner types ───────────────────────────────────────────────────────

    public record CellFeatureVector(
        String cell_id,
        double satellite_spectral_anomaly,
        double lithology_compatibility,
        double structural_proximity,
        double mineralization_proximity,
        double soil_support_score,
        double terrain_score,
        double data_quality
    ) {}

    public record MlPrediction(
        int prospectivityScore,
        String featureContributionsJson,
        String explanationText
    ) {}
}
