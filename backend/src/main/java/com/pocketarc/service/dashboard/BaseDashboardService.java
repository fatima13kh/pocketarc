// src/main/java/com/pocketarc/service/dashboard/BaseDashboardService.java
package com.pocketarc.service.dashboard;

import com.pocketarc.model.InvestmentTransaction;
import com.pocketarc.model.Stock;
import com.pocketarc.model.enums.TransactionType;
import com.pocketarc.repository.InvestmentTransactionRepository;
import com.pocketarc.repository.StockRepository;
import lombok.RequiredArgsConstructor;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RequiredArgsConstructor
public class BaseDashboardService {

    protected final InvestmentTransactionRepository transactionRepository;
    protected final StockRepository stockRepository;

    protected Map<Long, BigDecimal> calculateHoldings(List<InvestmentTransaction> transactions) {
        Map<Long, BigDecimal> holdings = new HashMap<>();
        for (InvestmentTransaction tx : transactions) {
            Long stockId = tx.getStock().getId();
            BigDecimal current = holdings.getOrDefault(stockId, BigDecimal.ZERO);
            if (tx.getTransactionType() == TransactionType.BUY) {
                holdings.put(stockId, current.add(tx.getShares()));
            } else {
                holdings.put(stockId, current.subtract(tx.getShares()));
            }
        }
        holdings.entrySet().removeIf(entry -> entry.getValue().compareTo(BigDecimal.ZERO) <= 0);
        return holdings;
    }

    protected BigDecimal calculateTotalInvestmentsValue(Map<Long, BigDecimal> holdings) {
        BigDecimal total = BigDecimal.ZERO;
        for (Map.Entry<Long, BigDecimal> entry : holdings.entrySet()) {
            Stock stock = stockRepository.findById(entry.getKey()).orElse(null);
            if (stock != null && stock.getCurrentPriceBhd() != null) {
                total = total.add(entry.getValue().multiply(stock.getCurrentPriceBhd()));
            }
        }
        return total;
    }

    protected BigDecimal calculateProfitLossPercent(BigDecimal totalInvestments, BigDecimal totalProfitLoss) {
        if (totalInvestments.compareTo(BigDecimal.ZERO) == 0) return BigDecimal.ZERO;
        return totalProfitLoss.divide(totalInvestments, 4, RoundingMode.HALF_UP).multiply(new BigDecimal(100));
    }

    protected BigDecimal getAverageCostBasis(List<InvestmentTransaction> buys, BigDecimal totalShares) {
        BigDecimal totalCost = buys.stream()
                .map(InvestmentTransaction::getTotalAmountBhd)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        if (totalShares.compareTo(BigDecimal.ZERO) == 0) return BigDecimal.ZERO;
        return totalCost.divide(totalShares, 4, RoundingMode.HALF_UP);
    }
}