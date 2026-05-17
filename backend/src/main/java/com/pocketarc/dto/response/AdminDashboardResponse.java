// src/main/java/com/pocketarc/dto/response/AdminDashboardResponse.java
package com.pocketarc.dto.response;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
@Builder
public class AdminDashboardResponse {
    // System Overview
    private Integer totalUsers;
    private Integer verifiedUsers;
    private Integer unverifiedUsers;
    private Integer adminUsers;
    private Integer usersJoinedThisMonth;

    // Financial Overview
    private BigDecimal totalCashInSystem;
    private BigDecimal totalInvestments;
    private BigDecimal totalSavings;
    private BigDecimal totalNetWorthSystem;

    // Content Overview
    private Integer totalStories;
    private Integer publishedStories;
    private Integer draftStories;
    private Integer pendingReviewStories;
    private Integer totalAiGeneratedStories;
    private Integer totalAdminCreatedStories;

    // Activity Overview
    private Integer totalTransactions;
    private Integer totalBuyTransactions;
    private Integer totalSellTransactions;
    private Integer totalStoriesPlayed;
    private Integer totalGoalsCreated;

    // Charts Data
    private List<UserRegistrationPoint> userRegistrations;
    private List<SystemGrowthPoint> systemGrowth;
    private List<PopularStocksPoint> popularStocks;
    private List<StoryPerformancePoint> storyPerformance;
    private List<ActivityTimelinePoint> activityTimeline;

    @Data
    @Builder
    public static class UserRegistrationPoint {
        private String date;
        private Integer registrations;
        private Integer verified;
    }

    @Data
    @Builder
    public static class SystemGrowthPoint {
        private String date;
        private BigDecimal totalNetWorth;
        private BigDecimal totalInvestments;
        private BigDecimal totalCash;
    }

    @Data
    @Builder
    public static class PopularStocksPoint {
        private String symbol;
        private String companyName;
        private Integer userCount;
        private BigDecimal totalValue;
        private BigDecimal averageHolding;
    }

    @Data
    @Builder
    public static class StoryPerformancePoint {
        private String title;
        private Integer playsCount;
        private BigDecimal averageReward;
        private String difficulty;
    }

    @Data
    @Builder
    public static class ActivityTimelinePoint {
        private String date;
        private Integer transactions;
        private Integer storiesPlayed;
        private Integer goalsCreated;
    }
}