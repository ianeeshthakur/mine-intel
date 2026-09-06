package com.mineintel.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "evidences")
public class Evidence {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String category; // e.g., "Satellite", "Lithology"
    private String description; // e.g., "A strong surface spectral anomaly is present."
    private String strength; // e.g., "Strong", "Very Strong", "Supporting"

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_id")
    @JsonIgnore
    private ExplorationTarget target;
}
