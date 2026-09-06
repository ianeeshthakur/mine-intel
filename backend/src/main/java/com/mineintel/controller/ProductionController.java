package com.mineintel.controller;

import com.mineintel.model.ProductionForecast;
import com.mineintel.repository.ProductionForecastRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/production")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class ProductionController {

    private final ProductionForecastRepository repository;

    @GetMapping("/forecast")
    public ResponseEntity<ProductionForecast> getLatestForecast() {
        List<ProductionForecast> forecasts = repository.findAll();
        if (forecasts.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(forecasts.get(0)); // Return the mock forecast
    }
}
