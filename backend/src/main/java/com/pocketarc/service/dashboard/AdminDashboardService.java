// src/main/java/com/pocketarc/service/dashboard/AdminDashboardService.java
package com.pocketarc.service.dashboard;

import com.pocketarc.dto.response.AdminDashboardResponse;
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

        return AdminDashboardResponse.builder()
                // User statistics
                .totalUsers(allUsers.size())
                .verifiedUsers((int) allUsers.stream().filter(User::getIsVerified).count())
                .unverifiedUsers((int) allUsers.stream().filter(u -> !u.getIsVerified()).count())
                .adminUsers((int) allUsers.stream().filter(User::getIsAdmin).count())
                .usersJoinedThisMonth((int) allUsers.stream()
                        .filter(u -> u.getCreatedAt().isAfter(LocalDateTime.now().minusDays(30))).count())

                // Financial statistics
                .totalCashInSystem(calculateTotalCash(allUsers))
                .totalInvestments(calculateSystemTotalInvestments())
                .totalSavings(calculateSystemTotalSavings())
                .totalNetWorthSystem(calculateTotalNetWorth(allUsers))

                // Story statistics
                .totalStories(allStories.size())
                .publishedStories((int) allStories.stream().filter(s -> s.getStatus().toString().equals("PUBLISHED")).count())
                .draftStories((int) allStories.stream().filter(s -> s.getStatus().toString().equals("DRAFT")).count())
                .pendingReviewStories((int) allStories.stream().filter(s -> s.getStatus().toString().equals("PENDING_REVIEW")).count())
                .totalAiGeneratedStories((int) allStories.stream().filter(s -> s.getAuthorType().toString().equals("AI_GENERATED")).count())
                .totalAdminCreatedStories((int) allStories.stream().filter(s -> s.getAuthorType().toString().equals("ADMIN")).count())

                // Activity statistics
                .totalTransactions((int) transactionRepository.count())
                .totalBuyTransactions(getTransactionCountByType(TransactionType.BUY))
                .totalSellTransactions(getTransactionCountByType(TransactionType.SELL))
                .totalStoriesPlayed((int) storyProgressRepository.count())  // FIXED: cast long to int
                .totalGoalsCreated((int) savingsGoalRepository.count())      // FIXED: cast long to int

                // Charts
                .userRegistrations(generateUserRegistrationData(allUsers))
                .systemGrowth(generateSystemGrowthData())
                .popularStocks(getPopularStocks())
                .storyPerformance(getStoryPerformance(allStories))
                .activityTimeline(generateActivityTimeline())
                .build();
    }

    private BigDecimal calculateTotalCash(List<User> users) {
        return users.stream()
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

    private BigDecimal calculateTotalNetWorth(List<User> users) {
        BigDecimal totalCash = calculateTotalCash(users);
        BigDecimal totalInvestments = calculateSystemTotalInvestments();
        BigDecimal totalSavings = calculateSystemTotalSavings();
        return totalCash.add(totalInvestments).add(totalSavings);
    }

    private int getTransactionCountByType(TransactionType type) {
        return (int) transactionRepository.findAll().stream()
                .filter(tx -> tx.getTransactionType() == type)
                .count();
    }

    private List<AdminDashboardResponse.UserRegistrationPoint> generateUserRegistrationData(List<User> users) {
        List<AdminDashboardResponse.UserRegistrationPoint> data = new ArrayList<>();
        LocalDate now = LocalDate.now();

        for (int i = 29; i >= 0; i--) {
            LocalDate date = now.minusDays(i);
            LocalDateTime start = date.atStartOfDay();
            LocalDateTime end = date.plusDays(1).atStartOfDay();

            int registrations = (int) users.stream()
                    .filter(u -> u.getCreatedAt().isAfter(start) && u.getCreatedAt().isBefore(end))
                    .count();

            int verified = (int) users.stream()
                    .filter(u -> u.getIsVerified() && u.getCreatedAt().isAfter(start) && u.getCreatedAt().isBefore(end))
                    .count();

            data.add(AdminDashboardResponse.UserRegistrationPoint.builder()
                    .date(date.format(DateTimeFormatter.ofPattern("dd MMM")))
                    .registrations(registrations)
                    .verified(verified)
                    .build());
        }
        return data;
    }

    private List<AdminDashboardResponse.SystemGrowthPoint> generateSystemGrowthData() {
        List<AdminDashboardResponse.SystemGrowthPoint> data = new ArrayList<>();
        LocalDate now = LocalDate.now();

        for (int i = 29; i >= 0; i--) {
            LocalDate date = now.minusDays(i);
            double progress = (29 - i) / 29.0;

            data.add(AdminDashboardResponse.SystemGrowthPoint.builder()
                    .date(date.format(DateTimeFormatter.ofPattern("dd MMM")))
                    .totalNetWorth(new BigDecimal("10000").multiply(BigDecimal.valueOf(1 + progress)))
                    .totalInvestments(new BigDecimal("5000").multiply(BigDecimal.valueOf(1 + progress)))
                    .totalCash(new BigDecimal("5000").multiply(BigDecimal.valueOf(1 + progress)))
                    .build());
        }
        return data;
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

    private List<AdminDashboardResponse.StoryPerformancePoint> getStoryPerformance(List<Story> stories) {
        return stories.stream()
                .map(story -> AdminDashboardResponse.StoryPerformancePoint.builder()
                        .title(story.getTitle())
                        .playsCount((int) storyProgressRepository.countByStoryId(story.getId()))
                        .averageReward(story.getRewardPerCorrect())
                        .difficulty(story.getDifficulty().toString())
                        .build())
                .sorted((a, b) -> b.getPlaysCount().compareTo(a.getPlaysCount()))
                .limit(5)
                .collect(Collectors.toList());
    }

    private List<AdminDashboardResponse.ActivityTimelinePoint> generateActivityTimeline() {
        List<AdminDashboardResponse.ActivityTimelinePoint> timeline = new ArrayList<>();
        LocalDate now = LocalDate.now();

        for (int i = 29; i >= 0; i--) {
            LocalDate date = now.minusDays(i);
            LocalDateTime start = date.atStartOfDay();
            LocalDateTime end = date.plusDays(1).atStartOfDay();

            int transactions = (int) transactionRepository.findAll().stream()
                    .filter(tx -> tx.getTransactionDate().isAfter(start) && tx.getTransactionDate().isBefore(end))
                    .count();

            int storiesPlayed = (int) storyProgressRepository.findAll().stream()
                    .filter(p -> p.getCompletedAt() != null && p.getCompletedAt().isAfter(start) && p.getCompletedAt().isBefore(end))
                    .count();

            int goalsCreated = (int) savingsGoalRepository.findAll().stream()
                    .filter(g -> g.getCreatedAt().isAfter(start) && g.getCreatedAt().isBefore(end))
                    .count();

            timeline.add(AdminDashboardResponse.ActivityTimelinePoint.builder()
                    .date(date.format(DateTimeFormatter.ofPattern("dd MMM")))
                    .transactions(transactions)
                    .storiesPlayed(storiesPlayed)
                    .goalsCreated(goalsCreated)
                    .build());
        }
        return timeline;
    }
}