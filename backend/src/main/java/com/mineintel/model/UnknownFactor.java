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
@Table(name = "unknown_factors")
public class UnknownFactor {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String description; // e.g., "subsurface depth", "economic viability"

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_id")
    @JsonIgnore
    private ExplorationTarget target;
}
