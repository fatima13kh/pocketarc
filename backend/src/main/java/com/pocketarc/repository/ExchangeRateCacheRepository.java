package com.pocketarc.repository;

import com.pocketarc.model.ExchangeRateCache;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface ExchangeRateCacheRepository extends JpaRepository<ExchangeRateCache, Long> {
    Optional<ExchangeRateCache> findTopByOrderByLastUpdatedDesc();
}