package com.mineintel.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mineintel.model.ExplorationTarget;
import com.mineintel.repository.ExplorationTargetRepository;
import com.mineintel.service.GeminiService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/assistant")
@CrossOrigin(origins = {"http://localhost:5173", "https://frontend-one-red-33.vercel.app"})
@RequiredArgsConstructor
@Slf4j
public class AssistantController {

    private final ExplorationTargetRepository repository;
    private final GeminiService geminiService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public record ChatRequest(String message, String targetId, String currentPage) {}
    public record ChatResponse(String reply) {}

    @PostMapping("/chat")
    public ResponseEntity<ChatResponse> chat(@RequestBody ChatRequest request) {
        log.info("Assistant chat request — targetId={}, page={}, message='{}'",
                request.targetId(), request.currentPage(), request.message());

        String contextData = buildContextData(request.targetId(), request.currentPage());
        String reply = geminiService.chat(request.message(), contextData);

        return ResponseEntity.ok(new ChatResponse(reply));
    }

    private String buildContextData(String targetId, String currentPage) {
        StringBuilder ctx = new StringBuilder();

        // Always include region-level summary stats
        List<ExplorationTarget> allTargets = repository.findAll();
        long totalTargets = allTargets.size();
        long mlScoredCount = allTargets.stream().filter(ExplorationTarget::isMlScored).count();
        long veryHighCount = allTargets.stream()
                .filter(t -> t.getPriority() == ExplorationTarget.Priority.VERY_HIGH).count();
        long highCount = allTargets.stream()
                .filter(t -> t.getPriority() == ExplorationTarget.Priority.HIGH).count();
        long confirmedCount = allTargets.stream()
                .filter(t -> t.getFieldStatus() == ExplorationTarget.FieldStatus.CONFIRMED).count();
        long notConfirmedCount = allTargets.stream()
                .filter(t -> t.getFieldStatus() == ExplorationTarget.FieldStatus.NOT_CONFIRMED).count();

        double avgScore = allTargets.stream()
                .mapToInt(ExplorationTarget::getProspectivityScore).average().orElse(0);

        ctx.append("=== REGION SUMMARY (Balaghat District, Madhya Pradesh) ===\n");
        ctx.append(String.format("Total exploration targets: %d\n", totalTargets));
        ctx.append(String.format("ML-scored targets: %d\n", mlScoredCount));
        ctx.append(String.format("Average prospectivity score: %.1f/100\n", avgScore));
        ctx.append(String.format("Priority breakdown: VERY_HIGH=%d, HIGH=%d\n", veryHighCount, highCount));
        ctx.append(String.format("Field verification: CONFIRMED=%d, NOT_CONFIRMED=%d, PENDING=%d\n",
                confirmedCount, notConfirmedCount, totalTargets - confirmedCount - notConfirmedCount));
        ctx.append("Priority tier thresholds: >=80 → VERY_HIGH, >=60 → HIGH, >=35 → MEDIUM, <35 → LOW\n");
        ctx.append("Score scale: 0-100 (ML model output, NOT ground truth — requires field verification)\n\n");

        // Top 5 targets summary
        List<ExplorationTarget> top5 = repository.findTop100ByOrderByProspectivityScoreDesc()
                .stream().limit(5).toList();
        ctx.append("=== TOP 5 TARGETS ===\n");
        for (ExplorationTarget t : top5) {
            ctx.append(String.format("  %s: score=%d, priority=%s, mlScored=%s\n",
                    t.getTargetId(), t.getProspectivityScore(), t.getPriority(), t.isMlScored()));
        }
        ctx.append("\n");

        // If a specific target is selected, include its full data
        if (targetId != null && !targetId.isBlank()) {
            ExplorationTarget target = allTargets.stream()
                    .filter(t -> t.getTargetId().equals(targetId))
                    .findFirst().orElse(null);

            if (target != null) {
                ctx.append(String.format("=== SELECTED TARGET: %s (DETAILED) ===\n", targetId));
                ctx.append(String.format("Prospectivity score: %d/100\n", target.getProspectivityScore()));
                ctx.append(String.format("Priority: %s\n", target.getPriority()));
                ctx.append(String.format("ML-scored: %s\n", target.isMlScored()));
                ctx.append(String.format("Field status: %s\n", target.getFieldStatus()));
                ctx.append(String.format("Location: %.4f°N, %.4f°E\n", target.getLatitude(), target.getLongitude()));
                ctx.append(String.format("Zone: %s\n", target.getZoneName()));

                if (target.getExplanationText() != null) {
                    ctx.append(String.format("ML Explanation: %s\n", target.getExplanationText()));
                }

                if (target.getFeatureContributionsJson() != null) {
                    ctx.append(String.format("SHAP Feature Contributions (JSON): %s\n",
                            target.getFeatureContributionsJson()));
                }

                // Raw feature vector
                ctx.append(String.format("Feature vector: satellite=%.3f, lithology=%.3f, structural=%.3f, " +
                        "mineralization=%.3f, soil=%.3f, terrain=%.3f, data_quality=%.3f\n",
                        target.getFeatureSatellite(), target.getFeatureLithology(),
                        target.getFeatureStructural(), target.getFeatureMineralization(),
                        target.getFeatureSoil(), target.getFeatureTerrain(),
                        target.getFeatureDataQuality()));

                // Evidences
                if (target.getEvidences() != null) {
                    ctx.append("Supporting evidence:\n");
                    target.getEvidences().forEach(e ->
                        ctx.append(String.format("  - %s (%s): %s\n", e.getCategory(), e.getStrength(), e.getDescription())));
                }
                if (target.getCounterEvidences() != null) {
                    ctx.append("Counter-evidence:\n");
                    target.getCounterEvidences().forEach(ce ->
                        ctx.append(String.format("  - %s\n", ce.getDescription())));
                }
                if (target.getUnknownFactors() != null) {
                    ctx.append("Unknown factors:\n");
                    target.getUnknownFactors().forEach(uf ->
                        ctx.append(String.format("  - %s\n", uf.getDescription())));
                }
            } else {
                ctx.append(String.format("Target %s was not found in the database.\n", targetId));
            }
        }

        // Include current page context
        if (currentPage != null && !currentPage.isBlank()) {
            ctx.append(String.format("\nUser is currently viewing: %s\n", currentPage));
        }

        return ctx.toString();
    }
}
