package com.mineintel.controller;

import com.mineintel.model.ExplorationTarget;
import com.mineintel.repository.ExplorationTargetRepository;
import com.mineintel.service.MlClientService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/analysis")
@CrossOrigin(origins = {"http://localhost:5173", "https://frontend-one-red-33.vercel.app"})
@RequiredArgsConstructor
@Slf4j
public class AnalysisController {

    private final ExplorationTargetRepository repository;
    private final MlClientService mlClientService;

    @PostMapping("/run")
    public ResponseEntity<?> runAnalysis() {
        log.info("Starting ML analysis run...");
        List<ExplorationTarget> targets = repository.findAll();

        if (mlClientService.isHealthy()) {
            List<MlClientService.CellFeatureVector> features = targets.stream()
                .map(t -> new MlClientService.CellFeatureVector(
                    t.getTargetId(),
                    t.getFeatureSatellite(),
                    t.getFeatureLithology(),
                    t.getFeatureStructural(),
                    t.getFeatureMineralization(),
                    t.getFeatureSoil(),
                    t.getFeatureTerrain(),
                    t.getFeatureDataQuality()
                )).toList();

            List<MlClientService.MlPrediction> predictions = mlClientService.predictBatch(features);
            
            if (predictions != null && predictions.size() == targets.size()) {
                for (int i = 0; i < targets.size(); i++) {
                    ExplorationTarget t = targets.get(i);
                    MlClientService.MlPrediction p = predictions.get(i);
                    if (p != null) {
                        t.setProspectivityScore(p.prospectivityScore());
                        t.setFeatureContributionsJson(p.featureContributionsJson());
                        t.setExplanationText(p.explanationText());
                        t.setMlScored(true);
                        
                        // Update priority based on the new ML score
                        ExplorationTarget.Priority priority = p.prospectivityScore() > 90 ? ExplorationTarget.Priority.VERY_HIGH :
                            p.prospectivityScore() > 85 ? ExplorationTarget.Priority.HIGH :
                            p.prospectivityScore() > 80 ? ExplorationTarget.Priority.MEDIUM : ExplorationTarget.Priority.LOW;
                        t.setPriority(priority);
                    }
                }
                repository.saveAll(targets);
                log.info("ML analysis completed successfully. Updated {} targets.", targets.size());
            } else {
                log.warn("ML analysis returned invalid batch results. Falling back to cached scores.");
            }
        } else {
            log.warn("ML service is unhealthy or unreachable. Using cached scores.");
        }

        // Return top 100 targets after analysis
        List<ExplorationTarget> topTargets = repository.findTop100ByOrderByProspectivityScoreDesc();
        return ResponseEntity.ok(Map.of(
            "status", "completed",
            "message", mlClientService.isHealthy() ? "ML scoring applied" : "ML service offline, using cached scores",
            "targets_analyzed", targets.size(),
            "results", topTargets
        ));
    }

    @GetMapping("/model-metrics")
    public ResponseEntity<?> getModelMetrics() {
        return ResponseEntity.ok(mlClientService.getModelMetrics());
    }
}
