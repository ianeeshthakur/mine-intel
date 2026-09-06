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

    private int prospectivityScore; // 0-100, now populated by ML service

    @Enumerated(EnumType.STRING)
    private Priority priority;

    @Enumerated(EnumType.STRING)
    private FieldStatus fieldStatus;

    private String mainEvidence;
    private String counterEvidenceSummary;
    private String zoneName; // e.g., "Zone A"

    // ── ML input features (0.0 – 1.0 each) ────────────────────────────────
    @Column(name = "f_satellite", columnDefinition = "DOUBLE DEFAULT 0")
    private double featureSatellite;

    @Column(name = "f_lithology", columnDefinition = "DOUBLE DEFAULT 0")
    private double featureLithology;

    @Column(name = "f_structural", columnDefinition = "DOUBLE DEFAULT 0")
    private double featureStructural;

    @Column(name = "f_mineralization", columnDefinition = "DOUBLE DEFAULT 0")
    private double featureMineralization;

    @Column(name = "f_soil", columnDefinition = "DOUBLE DEFAULT 0")
    private double featureSoil;

    @Column(name = "f_terrain", columnDefinition = "DOUBLE DEFAULT 0")
    private double featureTerrain;

    @Column(name = "f_data_quality", columnDefinition = "DOUBLE DEFAULT 1")
    private double featureDataQuality;

    // ── ML output (stored after analysis run) ──────────────────────────────
    @Column(columnDefinition = "TEXT")
    private String featureContributionsJson; // JSON array of FeatureContribution objects

    @Column(columnDefinition = "TEXT")
    private String explanationText;          // AI-generated NL explanation

    @Column(columnDefinition = "BOOLEAN DEFAULT FALSE")
    private boolean mlScored;               // true once ML service has processed this

    // ── Relations ──────────────────────────────────────────────────────────
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
