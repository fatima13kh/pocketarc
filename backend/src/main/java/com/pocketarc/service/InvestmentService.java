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
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class InvestmentService {

    private final InvestmentTransactionRepository transactionRepository;
    private final UserRepository userRepository;
    private final StockRepository stockRepository;
    private final StockMarketService stockMarketService;
    private final ExchangeRateService exchangeRateService;

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

        BigDecimal currentPriceUsd = quote.price();
        BigDecimal currentPriceBhd = exchangeRateService.convertUsdToBhd(currentPriceUsd);

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
            throw new BusinessException("Unable to fetch stock price");
        }

        BigDecimal currentPriceBhd = exchangeRateService.convertUsdToBhd(quote.price());

        BigDecimal totalSharesOwned = calculateTotalSharesOwned(userId, stock.getId());
        if (request.sharesToSell().compareTo(totalSharesOwned) > 0) {
            throw new BusinessException("Cannot sell more shares than you own");
        }

        BigDecimal sellValue = request.sharesToSell().multiply(currentPriceBhd);

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

        BigDecimal profitLoss = calculateProfitLossOnSale(userId, stock.getId(), request.sharesToSell(), currentPriceBhd);

        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("profitLoss", profitLoss);
        result.put("newCashBalance", user.getCashBalance());

        return result;
    }

    private BigDecimal calculateTotalSharesOwned(Long userId, Long stockId) {
        List<InvestmentTransaction> transactions = transactionRepository.findAllByUserIdAndStockId(userId, stockId);

        BigDecimal totalShares = BigDecimal.ZERO;
        for (InvestmentTransaction tx : transactions) {
            if (tx.getTransactionType() == TransactionType.BUY) {
                totalShares = totalShares.add(tx.getShares());
            } else {
                totalShares = totalShares.subtract(tx.getShares());
            }
        }
        return totalShares;
    }

    private BigDecimal calculateProfitLossOnSale(Long userId, Long stockId, BigDecimal sharesToSell, BigDecimal currentPriceBhd) {
        List<InvestmentTransaction> buyTransactions = transactionRepository
                .findAllByUserIdAndStockIdAndTransactionType(userId, stockId, TransactionType.BUY);

        buyTransactions.sort(Comparator.comparing(InvestmentTransaction::getTransactionDate));

        BigDecimal remainingToSell = sharesToSell;
        BigDecimal totalCostBasis = BigDecimal.ZERO;

        for (InvestmentTransaction buyTx : buyTransactions) {
            if (remainingToSell.compareTo(BigDecimal.ZERO) <= 0) break;

            BigDecimal sharesFromThisTx = remainingToSell.min(buyTx.getShares());
            BigDecimal costBasis = sharesFromThisTx.multiply(buyTx.getPricePerShareBhd());
            totalCostBasis = totalCostBasis.add(costBasis);
            remainingToSell = remainingToSell.subtract(sharesFromThisTx);
        }

        BigDecimal sellValue = sharesToSell.multiply(currentPriceBhd);
        return sellValue.subtract(totalCostBasis);
    }

    @Transactional(readOnly = true)
    public PortfolioSummaryResponse getPortfolio(Long userId) {
        List<InvestmentTransaction> allTransactions = transactionRepository.findAllByUserIdOrderByTransactionDateDesc(userId);

        if (allTransactions.isEmpty()) {
            log.info("No transactions found for user: {}", userId);
            return new PortfolioSummaryResponse(BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, Collections.emptyList());
        }

        log.info("Found {} transactions for user: {}", allTransactions.size(), userId);

        Map<Long, List<InvestmentTransaction>> transactionsByStock = new HashMap<>();
        Map<Long, Stock> stockMap = new HashMap<>();

        for (InvestmentTransaction tx : allTransactions) {
            Long stockId = tx.getStock().getId();
            transactionsByStock.computeIfAbsent(stockId, k -> new ArrayList<>()).add(tx);
            stockMap.putIfAbsent(stockId, tx.getStock());
        }

        List<HoldingResponse> holdings = new ArrayList<>();
        BigDecimal totalValue = BigDecimal.ZERO;
        BigDecimal totalCost = BigDecimal.ZERO;

        for (Map.Entry<Long, List<InvestmentTransaction>> entry : transactionsByStock.entrySet()) {
            Long stockId = entry.getKey();
            List<InvestmentTransaction> txs = entry.getValue();
            Stock stock = stockMap.get(stockId);

            log.info("Processing stock: {} ({})", stock.getSymbol(), stock.getCompanyName());

            BigDecimal netShares = BigDecimal.ZERO;
            BigDecimal totalCostBasis = BigDecimal.ZERO;
            List<InvestmentTransaction> buyTransactions = new ArrayList<>();

            for (InvestmentTransaction tx : txs) {
                if (tx.getTransactionType() == TransactionType.BUY) {
                    netShares = netShares.add(tx.getShares());
                    totalCostBasis = totalCostBasis.add(tx.getTotalAmountBhd());
                    buyTransactions.add(tx);
                    log.info("  BUY: {} shares at {} BHD each, total: {} BHD",
                            tx.getShares(), tx.getPricePerShareBhd(), tx.getTotalAmountBhd());
                } else {
                    if (netShares.compareTo(BigDecimal.ZERO) > 0) {
                        BigDecimal sellRatio = tx.getShares().divide(netShares, 6, RoundingMode.HALF_UP);
                        BigDecimal costToRemove = totalCostBasis.multiply(sellRatio);
                        totalCostBasis = totalCostBasis.subtract(costToRemove);
                        netShares = netShares.subtract(tx.getShares());
                        log.info("  SELL: {} shares, removed cost: {} BHD", tx.getShares(), costToRemove);
                    }
                }
            }

            if (netShares.compareTo(BigDecimal.ZERO) > 0) {
                log.info("  Net shares owned: {}", netShares);
                log.info("  Total cost basis: {} BHD", totalCostBasis);

                // Try to get current price from API first, fallback to database
                var quote = stockMarketService.getStockQuote(stock.getSymbol());
                BigDecimal currentPriceBhd;
                BigDecimal currentPriceUsd;

                if (quote != null) {
                    currentPriceUsd = quote.price();
                    currentPriceBhd = exchangeRateService.convertUsdToBhd(currentPriceUsd);
                    log.info("  Using live price from API: {} BHD", currentPriceBhd);
                } else if (stock.getCurrentPriceBhd() != null && stock.getCurrentPriceBhd().compareTo(BigDecimal.ZERO) > 0) {
                    currentPriceBhd = stock.getCurrentPriceBhd();
                    currentPriceUsd = exchangeRateService.convertBhdToUsd(currentPriceBhd);
                    log.info("  Using cached price from database: {} BHD", currentPriceBhd);
                } else {
                    // Last resort: use average purchase price
                    currentPriceBhd = totalCostBasis.divide(netShares, 4, RoundingMode.HALF_UP);
                    currentPriceUsd = exchangeRateService.convertBhdToUsd(currentPriceBhd);
                    log.info("  Using average purchase price: {} BHD", currentPriceBhd);
                }

                BigDecimal currentValue = netShares.multiply(currentPriceBhd);
                BigDecimal avgCostPerShare = totalCostBasis.divide(netShares, 4, RoundingMode.HALF_UP);
                BigDecimal profitLoss = currentValue.subtract(totalCostBasis);
                BigDecimal profitLossPercent = totalCostBasis.compareTo(BigDecimal.ZERO) > 0
                        ? profitLoss.divide(totalCostBasis, 4, RoundingMode.HALF_UP).multiply(new BigDecimal(100))
                        : BigDecimal.ZERO;

                log.info("  Current value: {} BHD", currentValue);
                log.info("  Profit/Loss: {} BHD ({}%)", profitLoss, profitLossPercent);

                totalValue = totalValue.add(currentValue);
                totalCost = totalCost.add(totalCostBasis);

                InvestmentTransaction latestBuy = buyTransactions.stream()
                        .max(Comparator.comparing(InvestmentTransaction::getTransactionDate))
                        .orElse(txs.get(0));

                holdings.add(new HoldingResponse(
                        latestBuy.getId(),
                        stock.getSymbol(),
                        stock.getCompanyName(),
                        netShares,
                        currentPriceUsd,
                        avgCostPerShare,
                        currentPriceUsd,
                        currentPriceBhd,
                        totalCostBasis,
                        currentValue,
                        profitLoss,
                        profitLossPercent,
                        latestBuy.getTransactionDate()
                ));
            } else {
                log.info("  No net shares remaining for this stock");
            }
        }

        BigDecimal totalProfitLoss = totalValue.subtract(totalCost);
        BigDecimal totalProfitLossPercent = totalCost.compareTo(BigDecimal.ZERO) > 0
                ? totalProfitLoss.divide(totalCost, 4, RoundingMode.HALF_UP).multiply(new BigDecimal(100))
                : BigDecimal.ZERO;

        log.info("Portfolio Summary - Total Value: {} BHD, Total Cost: {} BHD, Total P/L: {} BHD ({}%)",
                totalValue, totalCost, totalProfitLoss, totalProfitLossPercent);
        log.info("Total holdings count: {}", holdings.size());

        return new PortfolioSummaryResponse(totalValue, totalCost, totalProfitLoss, totalProfitLossPercent, holdings);
    }

    @Transactional(readOnly = true)
    public List<HoldingResponse> getHoldings(Long userId) {
        return getPortfolio(userId).holdings();
    }

    private HoldingResponse mapToHoldingResponse(InvestmentTransaction tx, StockMarketService.QuoteData quote, Stock stock) {
        BigDecimal currentPriceBhd = exchangeRateService.convertUsdToBhd(quote.price());
        BigDecimal currentValue = tx.getShares().multiply(currentPriceBhd);
        BigDecimal profitLoss = currentValue.subtract(tx.getTotalAmountBhd());
        BigDecimal profitLossPercent = profitLoss.divide(tx.getTotalAmountBhd(), 4, RoundingMode.HALF_UP).multiply(new BigDecimal(100));

        return new HoldingResponse(
                tx.getId(),
                stock.getSymbol(),
                stock.getCompanyName(),
                tx.getShares(),
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