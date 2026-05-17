// src/main/java/com/pocketarc/dto/response/UserDashboardResponse.java
package com.pocketarc.dto.response;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
public class UserDashboardResponse {
    // User Info
    private String username;
    private String email;
    private Long memberSince;

    // Financial Summary
    private BigDecimal cashBalance;           // Your spendable cash
    private BigDecimal totalInvestments;       // Current value of stocks you own
    private BigDecimal totalSharesOwned;       // Total shares owned across all stocks
    private BigDecimal totalSavingsGoals;      // Total amount saved in goals
    private BigDecimal totalStoryRewards;      // Total rewards from completed stories

    // Charts Data
    private List<NetWorthHistoryPoint> netWorthHistory;
    private List<PortfolioAllocation> portfolioAllocation;
    private List<GoalsProgressPoint> goalsProgress;
    private List<MonthlyActivityPoint> monthlyActivity;

    // Recent Activity
    private List<RecentTransaction> recentTransactions;
    private List<RecentStory> recentStories;

    @Data
    @Builder
    public static class NetWorthHistoryPoint {
        private String date;
        private BigDecimal cashBalance;
        private BigDecimal investmentsValue;
        private BigDecimal storyRewards;
    }

    @Data
    @Builder
    public static class PortfolioAllocation {
        private String symbol;
        private String companyName;
        private BigDecimal value;
        private BigDecimal percentage;
        private String sector;
    }

    @Data
    @Builder
    public static class GoalsProgressPoint {
        private String goalName;
        private BigDecimal currentAmount;
        private BigDecimal targetAmount;
        private Integer progressPercent;
    }

    @Data
    @Builder
    public static class MonthlyActivityPoint {
        private String month;
        private BigDecimal deposits;
        private BigDecimal withdrawals;
        private BigDecimal profitLoss;
    }

    @Data
    @Builder
    public static class RecentTransaction {
        private String symbol;
        private String type;
        private BigDecimal shares;
        private BigDecimal amount;
        private String date;
    }

    @Data
    @Builder
    public static class RecentStory {
        private String title;
        private String completedAt;
        private BigDecimal reward;
    }
}