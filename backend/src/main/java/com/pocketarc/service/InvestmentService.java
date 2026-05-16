// src/main/java/com/pocketarc/service/InvestmentService.java
package com.pocketarc.service;

import com.pocketarc.dto.request.BuyStockRequest;
import com.pocketarc.dto.request.SellStockRequest;
import com.pocketarc.dto.response.HoldingResponse;
import com.pocketarc.dto.response.PortfolioSummaryResponse;
import com.pocketarc.exception.BusinessException;
import com.pocketarc.model.InvestmentTransaction;
import com.pocketarc.model.Stock;
import com.pocketarc.model.User;
import com.pocketarc.model.enums.TransactionType;
import com.pocketarc.repository.InvestmentTransactionRepository;
import com.pocketarc.repository.StockRepository;
import com.pocketarc.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class InvestmentService {

    private final InvestmentTransactionRepository transactionRepository;
    private final UserRepository userRepository;
    private final StockRepository stockRepository;
    private final StockMarketService stockMarketService;
    private final ExchangeRateService exchangeRateService;

    private static final BigDecimal MINIMUM_SHARES_THRESHOLD = new BigDecimal("0.001");

    @Transactional
    public HoldingResponse buyStock(Long userId, BuyStockRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException("User not found"));

        if (user.getCashBalance().compareTo(request.amountBhd()) < 0) {
            throw new BusinessException("Insufficient cash balance");
        }

        Stock stock = stockRepository.findBySymbol(request.symbol().toUpperCase())
                .orElseGet(() -> {
                    Stock newStock = Stock.builder()
                            .symbol(request.symbol().toUpperCase())
                            .companyName(request.companyName())
                            .build();
                    return stockRepository.save(newStock);
                });

        var quote = stockMarketService.getStockQuote(request.symbol());
        if (quote == null) {
            throw new BusinessException("Unable to fetch stock price");
        }

        BigDecimal currentPriceBhd = exchangeRateService.convertUsdToBhd(quote.price());
        BigDecimal shares = request.amountBhd().divide(currentPriceBhd, 6, RoundingMode.HALF_UP);
        BigDecimal totalCost = shares.multiply(currentPriceBhd);

        InvestmentTransaction transaction = InvestmentTransaction.builder()
                .user(user)
                .stock(stock)
                .transactionType(TransactionType.BUY)
                .shares(shares)
                .pricePerShareBhd(currentPriceBhd)
                .totalAmountBhd(totalCost)
                .transactionDate(LocalDateTime.now())
                .build();

        transactionRepository.save(transaction);
        user.setCashBalance(user.getCashBalance().subtract(totalCost));
        userRepository.save(user);

        stock.setCurrentPriceBhd(currentPriceBhd);
        stock.setChangeAmountBhd(quote.change());
        stock.setChangePercentage(quote.changePercent());
        stock.setLastPriceUpdate(LocalDateTime.now());
        stockRepository.save(stock);

        return mapToHoldingResponse(transaction, quote, stock);
    }

    @Transactional
    public Map<String, Object> sellStock(Long userId, SellStockRequest request) {
        InvestmentTransaction buyTransaction = transactionRepository.findById(request.transactionId())
                .orElseThrow(() -> new BusinessException("Transaction not found"));

        if (!buyTransaction.getUser().getId().equals(userId)) {
            throw new BusinessException("Unauthorized");
        }

        Stock stock = buyTransaction.getStock();
        var quote = stockMarketService.getStockQuote(stock.getSymbol());
        if (quote == null) {
            throw new BusinessException("Unable to fetch current stock price. Please try again.");
        }

        BigDecimal currentPriceBhd = exchangeRateService.convertUsdToBhd(quote.price());
        BigDecimal totalSharesOwned = calculateTotalSharesOwned(userId, stock.getId());

        if (request.sharesToSell().compareTo(totalSharesOwned) > 0) {
            throw new BusinessException("Cannot sell more shares than you own.");
        }

        if (request.sharesToSell().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException("Shares to sell must be greater than zero");
        }

        BigDecimal costBasis = calculateCostBasisForShares(userId, stock.getId(), request.sharesToSell());
        BigDecimal sellValue = request.sharesToSell().multiply(currentPriceBhd);
        BigDecimal realizedPL = sellValue.subtract(costBasis);

        InvestmentTransaction sellTransaction = InvestmentTransaction.builder()
                .user(buyTransaction.getUser())
                .stock(stock)
                .transactionType(TransactionType.SELL)
                .shares(request.sharesToSell())
                .pricePerShareBhd(currentPriceBhd)
                .totalAmountBhd(sellValue)
                .transactionDate(LocalDateTime.now())
                .build();

        transactionRepository.save(sellTransaction);

        User user = buyTransaction.getUser();
        user.setCashBalance(user.getCashBalance().add(sellValue));
        userRepository.save(user);

        stock.setCurrentPriceBhd(currentPriceBhd);
        stock.setChangeAmountBhd(quote.change());
        stock.setChangePercentage(quote.changePercent());
        stock.setLastPriceUpdate(LocalDateTime.now());
        stockRepository.save(stock);

        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("newCashBalance", user.getCashBalance());
        result.put("realizedProfitLoss", realizedPL);

        return result;
    }

    private BigDecimal calculateTotalSharesOwned(Long userId, Long stockId) {
        List<InvestmentTransaction> buyTransactions = transactionRepository
                .findAllByUserIdAndStockIdAndTransactionTypeOrderByTransactionDateAsc(userId, stockId, TransactionType.BUY);
        List<InvestmentTransaction> sellTransactions = transactionRepository
                .findAllByUserIdAndStockIdAndTransactionTypeOrderByTransactionDateAsc(userId, stockId, TransactionType.SELL);

        BigDecimal totalBought = buyTransactions.stream().map(InvestmentTransaction::getShares).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalSold = sellTransactions.stream().map(InvestmentTransaction::getShares).reduce(BigDecimal.ZERO, BigDecimal::add);

        return totalBought.subtract(totalSold).max(BigDecimal.ZERO);
    }

    private BigDecimal calculateCostBasisForShares(Long userId, Long stockId, BigDecimal sharesToSell) {
        List<InvestmentTransaction> buyTransactions = transactionRepository
                .findAllByUserIdAndStockIdAndTransactionTypeOrderByTransactionDateAsc(userId, stockId, TransactionType.BUY);
        List<InvestmentTransaction> sellTransactions = transactionRepository
                .findAllByUserIdAndStockIdAndTransactionTypeOrderByTransactionDateAsc(userId, stockId, TransactionType.SELL);

        BigDecimal totalSoldSoFar = sellTransactions.stream().map(InvestmentTransaction::getShares).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal remainingToSell = sharesToSell;
        BigDecimal totalCostBasis = BigDecimal.ZERO;
        BigDecimal sharesProcessed = BigDecimal.ZERO;

        for (InvestmentTransaction buyTx : buyTransactions) {
            if (remainingToSell.compareTo(BigDecimal.ZERO) <= 0) break;

            BigDecimal sharesFromThisBuy = buyTx.getShares();

            if (sharesProcessed.add(sharesFromThisBuy).compareTo(totalSoldSoFar) <= 0) {
                sharesProcessed = sharesProcessed.add(sharesFromThisBuy);
                continue;
            }

            BigDecimal alreadySoldFromThisBuy = totalSoldSoFar.subtract(sharesProcessed).max(BigDecimal.ZERO);
            BigDecimal availableShares = sharesFromThisBuy.subtract(alreadySoldFromThisBuy).max(BigDecimal.ZERO);

            if (availableShares.compareTo(BigDecimal.ZERO) <= 0) {
                sharesProcessed = sharesProcessed.add(sharesFromThisBuy);
                continue;
            }

            BigDecimal sharesToTake = remainingToSell.min(availableShares);
            totalCostBasis = totalCostBasis.add(sharesToTake.multiply(buyTx.getPricePerShareBhd()));
            remainingToSell = remainingToSell.subtract(sharesToTake);
            sharesProcessed = sharesProcessed.add(sharesFromThisBuy);
        }

        return totalCostBasis;
    }

    @Transactional(readOnly = true)
    public PortfolioSummaryResponse getPortfolio(Long userId) {
        Map<Long, BigDecimal> stockHoldings = getCurrentStockHoldings(userId);

        if (stockHoldings.isEmpty()) {
            return new PortfolioSummaryResponse(BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, Collections.emptyList());
        }

        List<HoldingResponse> holdings = new ArrayList<>();
        BigDecimal totalValue = BigDecimal.ZERO;
        BigDecimal totalCost = BigDecimal.ZERO;

        for (Map.Entry<Long, BigDecimal> entry : stockHoldings.entrySet()) {
            Long stockId = entry.getKey();
            BigDecimal netShares = entry.getValue();

            if (netShares.compareTo(MINIMUM_SHARES_THRESHOLD) < 0) {
                continue;
            }

            Stock stock = stockRepository.findById(stockId).orElse(null);
            if (stock == null) {
                continue;
            }

            BigDecimal totalCostBasis = calculateTotalCostBasisForShares(userId, stockId, netShares);
            if (totalCostBasis.compareTo(BigDecimal.ZERO) <= 0) {
                continue;
            }

            var quote = stockMarketService.getStockQuote(stock.getSymbol());
            BigDecimal currentPriceBhd;
            BigDecimal currentPriceUsd;

            if (quote != null) {
                currentPriceUsd = quote.price();
                currentPriceBhd = exchangeRateService.convertUsdToBhd(currentPriceUsd);
            } else if (stock.getCurrentPriceBhd() != null && stock.getCurrentPriceBhd().compareTo(BigDecimal.ZERO) > 0) {
                currentPriceBhd = stock.getCurrentPriceBhd();
                currentPriceUsd = exchangeRateService.convertBhdToUsd(currentPriceBhd);
            } else {
                currentPriceBhd = totalCostBasis.divide(netShares, 4, RoundingMode.HALF_UP);
                currentPriceUsd = exchangeRateService.convertBhdToUsd(currentPriceBhd);
            }

            BigDecimal roundedShares = netShares.setScale(4, RoundingMode.HALF_UP);
            BigDecimal currentValue = roundedShares.multiply(currentPriceBhd);
            BigDecimal avgCostPerShare = totalCostBasis.divide(roundedShares, 4, RoundingMode.HALF_UP);
            BigDecimal profitLoss = currentValue.subtract(totalCostBasis);
            BigDecimal profitLossPercent = totalCostBasis.compareTo(BigDecimal.ZERO) > 0
                    ? profitLoss.divide(totalCostBasis, 4, RoundingMode.HALF_UP).multiply(new BigDecimal(100))
                    : BigDecimal.ZERO;

            totalValue = totalValue.add(currentValue);
            totalCost = totalCost.add(totalCostBasis);

            Optional<InvestmentTransaction> latestBuy = transactionRepository
                    .findFirstByUserIdAndStockIdAndTransactionTypeOrderByTransactionDateDesc(userId, stockId, TransactionType.BUY);

            holdings.add(new HoldingResponse(
                    latestBuy.map(InvestmentTransaction::getId).orElse(0L),
                    stock.getSymbol(),
                    stock.getCompanyName(),
                    roundedShares,
                    currentPriceUsd,
                    avgCostPerShare,
                    currentPriceUsd,
                    currentPriceBhd,
                    totalCostBasis,
                    currentValue,
                    profitLoss,
                    profitLossPercent,
                    latestBuy.map(InvestmentTransaction::getTransactionDate).orElse(LocalDateTime.now())
            ));
        }

        BigDecimal totalProfitLoss = totalValue.subtract(totalCost);
        BigDecimal totalProfitLossPercent = totalCost.compareTo(BigDecimal.ZERO) > 0
                ? totalProfitLoss.divide(totalCost, 4, RoundingMode.HALF_UP).multiply(new BigDecimal(100))
                : BigDecimal.ZERO;

        return new PortfolioSummaryResponse(totalValue, totalCost, totalProfitLoss, totalProfitLossPercent, holdings);
    }

    private Map<Long, BigDecimal> getCurrentStockHoldings(Long userId) {
        List<InvestmentTransaction> allTransactions = transactionRepository.findAllByUserIdOrderByTransactionDateAsc(userId);
        Map<Long, BigDecimal> stockHoldings = new LinkedHashMap<>();

        for (InvestmentTransaction tx : allTransactions) {
            Long stockId = tx.getStock().getId();
            BigDecimal currentShares = stockHoldings.getOrDefault(stockId, BigDecimal.ZERO);

            if (tx.getTransactionType() == TransactionType.BUY) {
                stockHoldings.put(stockId, currentShares.add(tx.getShares()));
            } else if (tx.getTransactionType() == TransactionType.SELL) {
                BigDecimal newShares = currentShares.subtract(tx.getShares());
                if (newShares.compareTo(MINIMUM_SHARES_THRESHOLD) < 0) {
                    stockHoldings.remove(stockId);
                } else {
                    stockHoldings.put(stockId, newShares);
                }
            }
        }

        return stockHoldings;
    }

    private BigDecimal calculateTotalCostBasisForShares(Long userId, Long stockId, BigDecimal sharesOwned) {
        List<InvestmentTransaction> buyTransactions = transactionRepository
                .findAllByUserIdAndStockIdAndTransactionTypeOrderByTransactionDateAsc(userId, stockId, TransactionType.BUY);

        BigDecimal totalBought = buyTransactions.stream().map(InvestmentTransaction::getShares).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalCost = buyTransactions.stream().map(InvestmentTransaction::getTotalAmountBhd).reduce(BigDecimal.ZERO, BigDecimal::add);

        if (totalBought.compareTo(BigDecimal.ZERO) == 0) return BigDecimal.ZERO;

        BigDecimal avgCostPerShare = totalCost.divide(totalBought, 6, RoundingMode.HALF_UP);
        return sharesOwned.multiply(avgCostPerShare);
    }

    @Transactional(readOnly = true)
    public List<HoldingResponse> getHoldings(Long userId) {
        return getPortfolio(userId).holdings();
    }

    private HoldingResponse mapToHoldingResponse(InvestmentTransaction tx, StockMarketService.QuoteData quote, Stock stock) {
        BigDecimal currentPriceBhd = exchangeRateService.convertUsdToBhd(quote.price());
        BigDecimal roundedShares = tx.getShares().setScale(4, RoundingMode.HALF_UP);
        BigDecimal currentValue = roundedShares.multiply(currentPriceBhd);
        BigDecimal profitLoss = currentValue.subtract(tx.getTotalAmountBhd());
        BigDecimal profitLossPercent = profitLoss.divide(tx.getTotalAmountBhd(), 4, RoundingMode.HALF_UP).multiply(new BigDecimal(100));

        return new HoldingResponse(
                tx.getId(),
                stock.getSymbol(),
                stock.getCompanyName(),
                roundedShares,
                quote.price(),
                tx.getPricePerShareBhd(),
                quote.price(),
                currentPriceBhd,
                tx.getTotalAmountBhd(),
                currentValue,
                profitLoss,
                profitLossPercent,
                tx.getTransactionDate()
        );
    }
}