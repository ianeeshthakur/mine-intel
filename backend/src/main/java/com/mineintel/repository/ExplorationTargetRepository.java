package com.mineintel.repository;

import com.mineintel.model.ExplorationTarget;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExplorationTargetRepository extends JpaRepository<ExplorationTarget, Long> {
    List<ExplorationTarget> findTop100ByOrderByProspectivityScoreDesc();
}
