package com.mineintel.controller;

import com.mineintel.model.ExplorationTarget;
import com.mineintel.model.FieldVerification;
import com.mineintel.repository.ExplorationTargetRepository;
import com.mineintel.repository.FieldVerificationRepository;
import com.mineintel.service.MlFeedbackService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/targets")
@CrossOrigin(origins = "*") // Allow frontend to call backend
@RequiredArgsConstructor
public class TargetController {

    private final ExplorationTargetRepository repository;
    private final FieldVerificationRepository fieldVerificationRepository;
    private final MlFeedbackService mlFeedbackService;

    @GetMapping
    public List<ExplorationTarget> getAllTargets() {
        return repository.findTop100ByOrderByProspectivityScoreDesc();
    }

    @GetMapping("/{id}")
    public ResponseEntity<ExplorationTarget> getTargetById(@PathVariable Long id) {
        return repository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/by-target-id/{targetId}")
    public ResponseEntity<ExplorationTarget> getByTargetId(@PathVariable String targetId) {
        // Just for simplicity, we can filter in memory or add a query method
        return repository.findAll().stream()
                .filter(t -> t.getTargetId().equals(targetId))
                .findFirst()
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/verify")
    public ResponseEntity<ExplorationTarget> verifyTarget(@PathVariable Long id, @RequestBody VerifyRequest request) {
        return repository.findById(id).map(target -> {
            target.setFieldStatus(ExplorationTarget.FieldStatus.valueOf(request.status()));
            repository.save(target);
            
            FieldVerification verification = FieldVerification.builder()
                .target(target)
                .status(target.getFieldStatus())
                .fieldNotes(request.notes())
                .rockObservation(request.rockObservation())
                .sampleId(request.sampleId())
                .verifiedAt(LocalDateTime.now())
                .build();
            fieldVerificationRepository.save(verification);
            
            // Trigger ML Active Learning Loop
            mlFeedbackService.sendFeedbackAndRetrain(target);
            
            return ResponseEntity.ok(target);
        }).orElse(ResponseEntity.notFound().build());
    }

    public record VerifyRequest(String status, String notes, String sampleId, String rockObservation) {}
}
