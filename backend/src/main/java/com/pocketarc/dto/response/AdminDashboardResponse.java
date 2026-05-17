// src/main/java/com/pocketarc/dto/response/AdminDashboardResponse.java
package com.pocketarc.dto.response;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
public class AdminDashboardResponse {
    // User Statistics
    private Integer totalUsers;
    private Integer usersJoinedThisMonth;

    // Financial Statistics
    private BigDecimal totalCashInSystem;
    private BigDecimal totalInvestments;
    private BigDecimal totalSavings;

    // Activity Statistics
    private Integer totalTransactions;
    private Integer totalBuyTransactions;
    private Integer totalSellTransactions;
    private Integer totalStoriesPlayed;
    private Integer totalStoriesUnplayed;
    private Integer totalGoalsCreated;
    private Integer totalGoalsReached;

    // Top Lists
    private List<PopularStocksPoint> popularStocks;
    private List<StoryPerformancePoint> storyPerformance;

    @Data
    @Builder
    public static class PopularStocksPoint {
        private String symbol;
        private String companyName;
        private String sector;
        private BigDecimal currentPriceBhd;
        private BigDecimal changePercent;
        private Integer userCount;
        private BigDecimal totalValue;
        private BigDecimal averageHolding;
    }

    @Data
    @Builder
    public static class StoryPerformancePoint {
        private Long id;
        private String title;
        private Integer playsCount;
        private BigDecimal averageReward;
        private String difficulty;
    }
}