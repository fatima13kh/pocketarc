// src/main/java/com/pocketarc/service/dashboard/AdminDashboardService.java
package com.pocketarc.service.dashboard;

import com.pocketarc.dto.response.AdminDashboardResponse;
import com.pocketarc.model.*;
import com.pocketarc.model.enums.TransactionType;
import com.pocketarc.model.enums.StoryStatus;
import com.pocketarc.repository.*;
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
public class AdminDashboardService extends BaseDashboardService {

    private final UserRepository userRepository;
    private final SavingsGoalRepository savingsGoalRepository;
    private final UserStoryProgressRepository storyProgressRepository;
    private final StoryRepository storyRepository;

    public AdminDashboardService(
            InvestmentTransactionRepository transactionRepository,
            StockRepository stockRepository,
            UserRepository userRepository,
            SavingsGoalRepository savingsGoalRepository,
            UserStoryProgressRepository storyProgressRepository,
            StoryRepository storyRepository) {
        super(transactionRepository, stockRepository);
        this.userRepository = userRepository;
        this.savingsGoalRepository = savingsGoalRepository;
        this.storyProgressRepository = storyProgressRepository;
        this.storyRepository = storyRepository;
    }

    @Transactional(readOnly = true)
    public AdminDashboardResponse getAdminDashboard() {
        List<User> allUsers = userRepository.findAll();
        List<Story> allStories = storyRepository.findAll();

        // Calculate goals reached
        List<SavingsGoal> allGoals = savingsGoalRepository.findAll();
        long goalsReached = allGoals.stream()
                .filter(goal -> goal.getCurrentAmount().compareTo(goal.getTargetAmount()) >= 0)
                .count();

        return AdminDashboardResponse.builder()
                // User statistics
                .totalUsers((int) allUsers.stream().filter(u -> !u.getIsAdmin()).count())
                .usersJoinedThisMonth((int) allUsers.stream()
                        .filter(u -> !u.getIsAdmin() && u.getCreatedAt().isAfter(LocalDateTime.now().minusDays(30))).count())

                // Financial statistics
                .totalCashInSystem(calculateTotalCash(allUsers))
                .totalInvestments(calculateSystemTotalInvestments())
                .totalSavings(calculateSystemTotalSavings())

                // Activity statistics
                .totalTransactions((int) transactionRepository.count())
                .totalBuyTransactions(getTransactionCountByType(TransactionType.BUY))
                .totalSellTransactions(getTransactionCountByType(TransactionType.SELL))
                .totalStoriesPlayed((int) storyProgressRepository.count())
                .totalStoriesUnplayed(calculateUnplayedStories(allStories))
                .totalGoalsCreated((int) allGoals.size())
                .totalGoalsReached((int) goalsReached)

                // Top lists
                .popularStocks(getPopularStocks())
                .storyPerformance(getTopPlayedStories(allStories))
                .build();
    }

    private int calculateUnplayedStories(List<Story> stories) {
        long publishedStories = stories.stream()
                .filter(s -> s.getStatus() == StoryStatus.PUBLISHED)
                .count();
        long playedStories = stories.stream()
                .filter(s -> storyProgressRepository.existsByStoryId(s.getId()))
                .count();
        return (int) (publishedStories - playedStories);
    }

    private BigDecimal calculateTotalCash(List<User> users) {
        return users.stream()
                .filter(u -> !u.getIsAdmin())
                .map(User::getCashBalance)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal calculateSystemTotalInvestments() {
        List<InvestmentTransaction> allTransactions = transactionRepository.findAll();
        Map<Long, BigDecimal> holdings = calculateHoldings(allTransactions);
        return calculateTotalInvestmentsValue(holdings);
    }

    private BigDecimal calculateSystemTotalSavings() {
        return savingsGoalRepository.findAll().stream()
                .map(SavingsGoal::getCurrentAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private int getTransactionCountByType(TransactionType type) {
        return (int) transactionRepository.findAll().stream()
                .filter(tx -> tx.getTransactionType() == type)
                .count();
    }

    private List<AdminDashboardResponse.PopularStocksPoint> getPopularStocks() {
        Map<String, Integer> stockUserCount = new HashMap<>();
        Map<String, BigDecimal> stockTotalValue = new HashMap<>();

        for (InvestmentTransaction tx : transactionRepository.findAll()) {
            String symbol = tx.getStock().getSymbol();
            stockUserCount.put(symbol, stockUserCount.getOrDefault(symbol, 0) + 1);
            stockTotalValue.put(symbol, stockTotalValue.getOrDefault(symbol, BigDecimal.ZERO).add(tx.getTotalAmountBhd()));
        }

        List<AdminDashboardResponse.PopularStocksPoint> popular = new ArrayList<>();
        for (Map.Entry<String, Integer> entry : stockUserCount.entrySet()) {
            Stock stock = stockRepository.findBySymbol(entry.getKey()).orElse(null);
            if (stock != null) {
                popular.add(AdminDashboardResponse.PopularStocksPoint.builder()
                        .symbol(entry.getKey())
                        .companyName(stock.getCompanyName())
                        .sector(stock.getSector())
                        .currentPriceBhd(stock.getCurrentPriceBhd())
                        .changePercent(stock.getChangePercentage())
                        .userCount(entry.getValue())
                        .totalValue(stockTotalValue.getOrDefault(entry.getKey(), BigDecimal.ZERO))
                        .averageHolding(stockTotalValue.getOrDefault(entry.getKey(), BigDecimal.ZERO)
                                .divide(BigDecimal.valueOf(entry.getValue()), 2, RoundingMode.HALF_UP))
                        .build());
            }
        }

        popular.sort((a, b) -> b.getUserCount().compareTo(a.getUserCount()));
        return popular.stream().limit(5).collect(Collectors.toList());
    }

    private List<AdminDashboardResponse.StoryPerformancePoint> getTopPlayedStories(List<Story> stories) {
        return stories.stream()
                .filter(story -> story.getStatus() == StoryStatus.PUBLISHED)
                .map(story -> AdminDashboardResponse.StoryPerformancePoint.builder()
                        .id(story.getId())
                        .title(story.getTitle())
                        .playsCount((int) storyProgressRepository.countByStoryId(story.getId()))
                        .averageReward(story.getRewardPerCorrect())
                        .difficulty(story.getDifficulty().toString())
                        .build())
                .sorted((a, b) -> b.getPlaysCount().compareTo(a.getPlaysCount()))
                .limit(5)
                .collect(Collectors.toList());
    }
}