package com.mineintel.service;

import com.mineintel.model.*;
import com.mineintel.repository.ExplorationTargetRepository;
import com.mineintel.repository.ProductionForecastRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;

@Service
@RequiredArgsConstructor
public class DemoDataSeeder {

    private final ExplorationTargetRepository targetRepository;
    private final ProductionForecastRepository productionRepository;

    @PostConstruct
    public void seed() {
        if (targetRepository.count() == 0) {
            seedTargets();
        }
        if (productionRepository.count() == 0) {
            seedProduction();
        }
    }

    private void seedTargets() {
        Random random = new Random();
        // Balaghat approx center: 21.8, 80.2
        double baseLat = 21.8;
        double baseLng = 80.2;

        List<ExplorationTarget> targets = new ArrayList<>();
        for (int i = 1; i <= 100; i++) {
            int score = 75 + random.nextInt(21); // 75 to 95
            
            ExplorationTarget.Priority priority = score > 90 ? ExplorationTarget.Priority.VERY_HIGH :
                    score > 85 ? ExplorationTarget.Priority.HIGH :
                            score > 80 ? ExplorationTarget.Priority.MEDIUM : ExplorationTarget.Priority.LOW;
            
            ExplorationTarget.FieldStatus status = ExplorationTarget.FieldStatus.PENDING;
            if (i % 5 == 0) status = ExplorationTarget.FieldStatus.CONFIRMED;
            if (i % 7 == 0) status = ExplorationTarget.FieldStatus.NOT_CONFIRMED;

            // ── Generate realistic ML feature vectors ──────────────────────
            // Features are correlated with score to ensure ML output is consistent
            double scoreFraction = (score - 75.0) / 25.0; // 0-1 across score range
            double fLithology      = 0.4 + scoreFraction * 0.4 + (random.nextDouble() - 0.5) * 0.15;
            double fMineralization = 0.3 + scoreFraction * 0.45 + (random.nextDouble() - 0.5) * 0.15;
            double fStructural     = 0.35 + scoreFraction * 0.4 + (random.nextDouble() - 0.5) * 0.20;
            double fSatellite      = 0.3 + scoreFraction * 0.35 + (random.nextDouble() - 0.5) * 0.20;
            double fSoil           = 0.4 + random.nextDouble() * 0.4;
            double fTerrain        = 0.45 + random.nextDouble() * 0.35;
            double fDataQuality    = 0.6 + random.nextDouble() * 0.4;

            ExplorationTarget target = ExplorationTarget.builder()
                    .targetId(String.format("T-%03d", i))
                    .latitude(baseLat + (random.nextDouble() - 0.5) * 0.5)
                    .longitude(baseLng + (random.nextDouble() - 0.5) * 0.5)
                    .prospectivityScore(score)
                    .priority(priority)
                    .fieldStatus(status)
                    .mainEvidence("Spectral + Lithology")
                    .counterEvidenceSummary("Surface cover")
                    .zoneName("Zone " + (char)('A' + random.nextInt(5)))
                    // ML feature vector (used by AnalysisController)
                    .featureSatellite(clamp(fSatellite))
                    .featureLithology(clamp(fLithology))
                    .featureStructural(clamp(fStructural))
                    .featureMineralization(clamp(fMineralization))
                    .featureSoil(clamp(fSoil))
                    .featureTerrain(clamp(fTerrain))
                    .featureDataQuality(clamp(fDataQuality))
                    .mlScored(false)
                    .build();

            // Add evidences
            target.setEvidences(List.of(
                Evidence.builder().category("Satellite").description("Strong surface spectral anomaly").strength("Strong").target(target).build(),
                Evidence.builder().category("Lithology").description("Geological unit compatible with manganese").strength("Very Strong").target(target).build(),
                Evidence.builder().category("Structure").description("Occurs near relevant structural feature").strength("Strong").target(target).build(),
                Evidence.builder().category("Soil").description("Soil properties provide supporting evidence").strength("Supporting").target(target).build()
            ));

            target.setCounterEvidences(List.of(
                CounterEvidence.builder().description("Surface cover may obscure underlying geology").target(target).build(),
                CounterEvidence.builder().description("No drilling confirmation available").target(target).build()
            ));

            target.setUnknownFactors(List.of(
                UnknownFactor.builder().description("Subsurface depth").target(target).build(),
                UnknownFactor.builder().description("Ore thickness and grade").target(target).build()
            ));

            targets.add(target);
        }
        targetRepository.saveAll(targets);
    }

    private void seedProduction() {
        ProductionForecast forecast = ProductionForecast.builder()
                .plannedTonnes(15000)
                .expectedTonnes(12500)
                .potentialShortfall(2500)
                .riskLevel("Medium")
                .reasons(List.of(
                        "Equipment downtime → High impact",
                        "Rainfall → Medium impact",
                        "Blasting delay → Medium impact"
                ))
                .recommendedActions(List.of(
                        "Prioritize alternate production zone",
                        "Re-deploy available equipment",
                        "Review blasting schedule"
                ))
                .build();
        productionRepository.save(forecast);
    }

    private double clamp(double v) {
        return Math.max(0.0, Math.min(1.0, v));
    }
}
