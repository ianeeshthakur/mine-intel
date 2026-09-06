package com.mineintel.repository;

import com.mineintel.model.ProductionForecast;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProductionForecastRepository extends JpaRepository<ProductionForecast, Long> {
}
