package com.pocketarc.repository;

import com.pocketarc.model.InvestmentTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface InvestmentTransactionRepository extends JpaRepository<InvestmentTransaction, Long> {
    List<InvestmentTransaction> findAllByUserId(Long userId);
    List<InvestmentTransaction> findAllByUserIdAndStockId(Long userId, Long stockId);
}