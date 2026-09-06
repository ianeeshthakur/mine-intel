package com.mineintel.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.util.List;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "exploration_targets")
public class ExplorationTarget {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String targetId; // e.g., T-047

    private double latitude;
    private double longitude;

    private int prospectivityScore; // 0-100

    @Enumerated(EnumType.STRING)
    private Priority priority;

    @Enumerated(EnumType.STRING)
    private FieldStatus fieldStatus;

    private String mainEvidence; // e.g., "Spectral + Lithology"
    private String counterEvidenceSummary; // e.g., "No drilling"

    private String zoneName; // e.g., "Zone A"

    @OneToMany(mappedBy = "target", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Evidence> evidences;

    @OneToMany(mappedBy = "target", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<CounterEvidence> counterEvidences;

    @OneToMany(mappedBy = "target", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<UnknownFactor> unknownFactors;

    public enum Priority {
        LOW, MEDIUM, HIGH, VERY_HIGH
    }

    public enum FieldStatus {
        PENDING, CONFIRMED, NOT_CONFIRMED, UNCERTAIN
    }
}
