// src/main/java/com/pocketarc/service/dashboard/UserDashboardService.java
package com.pocketarc.service.dashboard;

import com.pocketarc.dto.response.UserDashboardResponse;
import com.pocketarc.model.*;
import com.pocketarc.model.enums.TransactionType;
import com.pocketarc.repository.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
public class UserDashboardService extends BaseDashboardService {

    private final UserRepository userRepository;
    private final SavingsGoalRepository savingsGoalRepository;
    private final UserStoryProgressRepository storyProgressRepository;

    private static final BigDecimal STARTING_BALANCE = new BigDecimal("500.00");

    public UserDashboardService(
            InvestmentTransactionRepository transactionRepository,
            StockRepository stockRepository,
            UserRepository userRepository,
            SavingsGoalRepository savingsGoalRepository,
            UserStoryProgressRepository storyProgressRepository) {
        super(transactionRepository, stockRepository);
        this.userRepository = userRepository;
        this.savingsGoalRepository = savingsGoalRepository;
        this.storyProgressRepository = storyProgressRepository;
    }

    @Transactional(readOnly = true)
    public UserDashboardResponse getUserDashboard(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Get current holdings (stocks still owned - net shares > 0)
        List<InvestmentTransaction> allTransactions = transactionRepository.findAllByUserIdOrderByTransactionDateDesc(userId);
        Map<Long, BigDecimal> currentHoldings = calculateCurrentHoldings(allTransactions);

        // Calculate financials
        BigDecimal totalInvestmentsValue = calculateCurrentInvestmentsValue(currentHoldings);
        BigDecimal totalSharesOwned = calculateTotalSharesOwned(currentHoldings);

        // Get savings goals - total amount saved
        List<SavingsGoal> goals = savingsGoalRepository.findAllByUserId(userId);
        BigDecimal totalSavingsAmount = goals.stream()
                .map(SavingsGoal::getCurrentAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Calculate total story rewards
        BigDecimal totalStoryRewards = calculateTotalStoryRewards(userId);

        BigDecimal cashBalance = user.getCashBalance();

        return UserDashboardResponse.builder()
                .username(user.getUsername())
                .email(user.getEmail())
                .memberSince((long) user.getCreatedAt().toLocalDate().getYear())
                .cashBalance(cashBalance)
                .totalInvestments(totalInvestmentsValue)
                .totalSharesOwned(totalSharesOwned)
                .totalSavingsGoals(totalSavingsAmount)
                .totalStoryRewards(totalStoryRewards)
                .netWorthHistory(generateNetWorthHistory(cashBalance, totalInvestmentsValue, totalStoryRewards))
                .portfolioAllocation(generatePortfolioAllocation(currentHoldings))
                .goalsProgress(generateGoalsProgress(goals))
                .monthlyActivity(generateMonthlyActivity(allTransactions))
                .recentTransactions(getRecentTransactions(allTransactions))
                .recentStories(getRecentStories(userId))
                .build();
    }

    private BigDecimal calculateTotalStoryRewards(Long userId) {
        List<UserStoryProgress> completedStories = storyProgressRepository.findAllByUserId(userId).stream()
                .filter(UserStoryProgress::getCompletedStory)
                .collect(Collectors.toList());

        return completedStories.stream()
                .map(UserStoryProgress::getTotalRewardClaimed)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private Map<Long, BigDecimal> calculateCurrentHoldings(List<InvestmentTransaction> transactions) {
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
        // Only keep stocks with positive shares
        holdings.entrySet().removeIf(entry -> entry.getValue().compareTo(BigDecimal.ZERO) <= 0);
        return holdings;
    }

    private BigDecimal calculateTotalSharesOwned(Map<Long, BigDecimal> holdings) {
        return holdings.values().stream()
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal calculateCurrentInvestmentsValue(Map<Long, BigDecimal> holdings) {
        BigDecimal total = BigDecimal.ZERO;
        for (Map.Entry<Long, BigDecimal> entry : holdings.entrySet()) {
            Stock stock = stockRepository.findById(entry.getKey()).orElse(null);
            if (stock != null && stock.getCurrentPriceBhd() != null) {
                total = total.add(entry.getValue().multiply(stock.getCurrentPriceBhd()));
            }
        }
        return total;
    }

    private List<UserDashboardResponse.NetWorthHistoryPoint> generateNetWorthHistory(
            BigDecimal currentCash,
            BigDecimal currentInvestments,
            BigDecimal currentStoryRewards) {

        List<UserDashboardResponse.NetWorthHistoryPoint> history = new ArrayList<>();
        LocalDate today = LocalDate.now();

        for (int i = 29; i >= 0; i--) {
            LocalDate date = today.minusDays(i);
            double progress = (29 - i) / 29.0;

            BigDecimal cash = STARTING_BALANCE.add(currentCash.subtract(STARTING_BALANCE).multiply(BigDecimal.valueOf(progress)));
            BigDecimal investments = currentInvestments.multiply(BigDecimal.valueOf(progress));
            BigDecimal storyRewards = currentStoryRewards.multiply(BigDecimal.valueOf(progress));

            history.add(UserDashboardResponse.NetWorthHistoryPoint.builder()
                    .date(date.format(DateTimeFormatter.ofPattern("dd MMM")))
                    .cashBalance(cash)
                    .investmentsValue(investments)
                    .storyRewards(storyRewards)
                    .build());
        }
        return history;
    }

    private List<UserDashboardResponse.PortfolioAllocation> generatePortfolioAllocation(Map<Long, BigDecimal> holdings) {
        List<UserDashboardResponse.PortfolioAllocation> allocation = new ArrayList<>();
        BigDecimal totalValue = calculateCurrentInvestmentsValue(holdings);

        for (Map.Entry<Long, BigDecimal> entry : holdings.entrySet()) {
            Stock stock = stockRepository.findById(entry.getKey()).orElse(null);
            if (stock != null && stock.getCurrentPriceBhd() != null) {
                BigDecimal value = entry.getValue().multiply(stock.getCurrentPriceBhd());
                BigDecimal percentage = totalValue.compareTo(BigDecimal.ZERO) > 0
                        ? value.divide(totalValue, 4, RoundingMode.HALF_UP).multiply(new BigDecimal(100))
                        : BigDecimal.ZERO;

                allocation.add(UserDashboardResponse.PortfolioAllocation.builder()
                        .symbol(stock.getSymbol())
                        .companyName(stock.getCompanyName())
                        .value(value)
                        .percentage(percentage)
                        .sector(stock.getSector() != null ? stock.getSector() : "General")
                        .build());
            }
        }
        allocation.sort((a, b) -> b.getValue().compareTo(a.getValue()));
        return allocation;
    }

    private List<UserDashboardResponse.GoalsProgressPoint> generateGoalsProgress(List<SavingsGoal> goals) {
        return goals.stream()
                .map(goal -> {
                    int progress = goal.getTargetAmount().compareTo(BigDecimal.ZERO) > 0
                            ? goal.getCurrentAmount().multiply(new BigDecimal(100))
                            .divide(goal.getTargetAmount(), 0, RoundingMode.HALF_UP).intValue()
                            : 0;
                    return UserDashboardResponse.GoalsProgressPoint.builder()
                            .goalName(goal.getName())
                            .currentAmount(goal.getCurrentAmount())
                            .targetAmount(goal.getTargetAmount())
                            .progressPercent(Math.min(progress, 100))
                            .build();
                })
                .collect(Collectors.toList());
    }

    private List<UserDashboardResponse.MonthlyActivityPoint> generateMonthlyActivity(List<InvestmentTransaction> transactions) {
        List<UserDashboardResponse.MonthlyActivityPoint> activity = new ArrayList<>();
        LocalDate now = LocalDate.now();

        for (int i = 5; i >= 0; i--) {
            LocalDate month = now.minusMonths(i);
            LocalDateTime start = month.withDayOfMonth(1).atStartOfDay();
            LocalDateTime end = month.withDayOfMonth(month.lengthOfMonth()).atTime(23, 59, 59);

            BigDecimal deposits = transactions.stream()
                    .filter(t -> t.getTransactionDate().isAfter(start) && t.getTransactionDate().isBefore(end))
                    .filter(t -> t.getTransactionType() == TransactionType.BUY)
                    .map(InvestmentTransaction::getTotalAmountBhd)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal withdrawals = transactions.stream()
                    .filter(t -> t.getTransactionDate().isAfter(start) && t.getTransactionDate().isBefore(end))
                    .filter(t -> t.getTransactionType() == TransactionType.SELL)
                    .map(InvestmentTransaction::getTotalAmountBhd)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            activity.add(UserDashboardResponse.MonthlyActivityPoint.builder()
                    .month(month.format(DateTimeFormatter.ofPattern("MMM yyyy")))
                    .deposits(deposits)
                    .withdrawals(withdrawals)
                    .profitLoss(withdrawals.subtract(deposits))
                    .build());
        }
        return activity;
    }

    private List<UserDashboardResponse.RecentTransaction> getRecentTransactions(List<InvestmentTransaction> transactions) {
        return transactions.stream().limit(5)
                .map(tx -> UserDashboardResponse.RecentTransaction.builder()
                        .symbol(tx.getStock().getSymbol())
                        .type(tx.getTransactionType().toString())
                        .shares(tx.getShares())
                        .amount(tx.getTotalAmountBhd())
                        .date(tx.getTransactionDate().format(DateTimeFormatter.ofPattern("dd MMM yyyy")))
                        .build())
                .collect(Collectors.toList());
    }

    private List<UserDashboardResponse.RecentStory> getRecentStories(Long userId) {
        return storyProgressRepository.findAllByUserId(userId).stream()
                .filter(p -> p.getCompletedStory() && p.getCompletedAt() != null)
                .sorted((a, b) -> b.getCompletedAt().compareTo(a.getCompletedAt()))
                .limit(5)
                .map(p -> UserDashboardResponse.RecentStory.builder()
                        .title(p.getStory().getTitle())
                        .completedAt(p.getCompletedAt().format(DateTimeFormatter.ofPattern("dd MMM yyyy")))
                        .reward(p.getTotalRewardClaimed())
                        .build())
                .collect(Collectors.toList());
    }
}