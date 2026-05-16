// src/main/java/com/pocketarc/repository/InvestmentTransactionRepository.java
package com.pocketarc.repository;

import com.pocketarc.model.InvestmentTransaction;
import com.pocketarc.model.enums.TransactionType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface InvestmentTransactionRepository extends JpaRepository<InvestmentTransaction, Long> {

    List<InvestmentTransaction> findAllByUserIdOrderByTransactionDateDesc(Long userId);

    List<InvestmentTransaction> findAllByUserIdOrderByTransactionDateAsc(Long userId);

    List<InvestmentTransaction> findAllByUserIdAndStockId(Long userId, Long stockId);

    List<InvestmentTransaction> findAllByUserIdAndStockIdOrderByTransactionDateDesc(Long userId, Long stockId);

    List<InvestmentTransaction> findAllByUserIdAndTransactionType(Long userId, TransactionType transactionType);

    Optional<InvestmentTransaction> findFirstByUserIdAndStockIdAndTransactionTypeOrderByTransactionDateDesc(
            Long userId, Long stockId, TransactionType transactionType);

    List<InvestmentTransaction> findAllByUserIdAndStockIdAndTransactionType(Long userId, Long stockId, TransactionType transactionType);

    List<InvestmentTransaction> findAllByUserIdAndStockIdAndTransactionTypeOrderByTransactionDateAsc(
            Long userId, Long stockId, TransactionType transactionType);

    List<InvestmentTransaction> findAllByUserIdAndTransactionTypeOrderByTransactionDateAsc(
            Long userId, TransactionType transactionType);
}