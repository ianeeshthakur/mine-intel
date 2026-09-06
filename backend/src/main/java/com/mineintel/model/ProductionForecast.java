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
@Table(name = "production_forecasts")
public class ProductionForecast {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private double plannedTonnes;
    private double expectedTonnes;
    private double potentialShortfall;
    private String riskLevel; // Low, Medium, High

    @ElementCollection
    @CollectionTable(name = "shortfall_reasons", joinColumns = @JoinColumn(name = "forecast_id"))
    @Column(name = "reason")
    private List<String> reasons; // e.g. "Equipment downtime -> High impact"

    @ElementCollection
    @CollectionTable(name = "corrective_actions", joinColumns = @JoinColumn(name = "forecast_id"))
    @Column(name = "action")
    private List<String> recommendedActions;
}
