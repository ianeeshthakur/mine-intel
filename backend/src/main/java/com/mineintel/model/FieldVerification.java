package com.mineintel.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "field_verifications")
public class FieldVerification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "target_id", referencedColumnName = "id")
    @JsonIgnore
    private ExplorationTarget target;

    @Enumerated(EnumType.STRING)
    private ExplorationTarget.FieldStatus status;

    private String fieldNotes;
    private String rockObservation;
    private String soilObservation;
    private String sampleId;
    private LocalDateTime verifiedAt;

    private String potentialMissingFeature; // e.g. "Regolith / surface-cover condition"
    
    // Advanced Geological Fields
    private Integer strike;
    private Integer dip;
    private String alterationType;
    private Double gpsAccuracy;
    private Double elevation;
    
    @Column(columnDefinition = "BOOLEAN DEFAULT FALSE")
    private Boolean dispatchedToLab;
}
