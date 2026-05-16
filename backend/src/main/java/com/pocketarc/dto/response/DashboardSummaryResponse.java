package com.pocketarc.dto.response;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public record DashboardSummaryResponse(
        BigDecimal cashBalance,
        BigDecimal totalGoalSavings,
        BigDecimal totalInvestmentValue,
        BigDecimal totalNetWorth,
        BigDecimal totalProfitLoss,
        BigDecimal totalProfitLossPercent,
        List<HoldingResponse> recentHoldings,
        Map<String, BigDecimal> netWorthHistory
) {}