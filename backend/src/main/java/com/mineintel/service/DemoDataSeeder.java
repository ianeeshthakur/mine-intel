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
}
