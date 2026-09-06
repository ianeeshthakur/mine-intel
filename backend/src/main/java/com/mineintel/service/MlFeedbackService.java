package com.mineintel.service;

import com.mineintel.model.ExplorationTarget;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Service
@Slf4j
public class MlFeedbackService {

    private final RestTemplate restTemplate = new RestTemplate();
    private final String ML_SERVICE_URL = "http://localhost:8000";

    public void sendFeedbackAndRetrain(ExplorationTarget target) {
        if (target.getFieldStatus() == ExplorationTarget.FieldStatus.CONFIRMED || 
            target.getFieldStatus() == ExplorationTarget.FieldStatus.NOT_CONFIRMED) {
            
            try {
                // 1. Send Feedback
                Map<String, Object> payload = new HashMap<>();
                payload.put("satellite_spectral_anomaly", target.getFeatureSatellite());
                payload.put("lithology_compatibility", target.getFeatureLithology());
                payload.put("structural_proximity", target.getFeatureStructural());
                payload.put("mineralization_proximity", target.getFeatureMineralization());
                payload.put("soil_support_score", target.getFeatureSoil());
                payload.put("terrain_score", target.getFeatureTerrain());
                payload.put("data_quality", target.getFeatureDataQuality());
                payload.put("label", target.getFieldStatus() == ExplorationTarget.FieldStatus.CONFIRMED ? 1 : 0);

                restTemplate.postForObject(ML_SERVICE_URL + "/feedback", payload, String.class);
                log.info("Sent ML feedback for target {}", target.getTargetId());

                // 2. Trigger Retrain
                String retrainResponse = restTemplate.postForObject(ML_SERVICE_URL + "/retrain", null, String.class);
                log.info("ML Service retrained successfully: {}", retrainResponse);

            } catch (Exception e) {
                log.error("Failed to update ML model with feedback: {}", e.getMessage());
            }
        }
    }
}
