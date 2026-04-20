package com.pocketarc.repository;

import com.pocketarc.model.StockPriceHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface StockPriceHistoryRepository extends JpaRepository<StockPriceHistory, Long> {
    List<StockPriceHistory> findAllByStockIdOrderByDateAsc(Long stockId);
    Optional<StockPriceHistory> findByStockIdAndDate(Long stockId, LocalDate date);
}