package com.pocketarc.dto.response;

import java.math.BigDecimal;
import java.util.List;

public record PortfolioSummaryResponse(
        BigDecimal totalValueBhd,
        BigDecimal totalCostBhd,
        BigDecimal totalProfitLossBhd,
        BigDecimal totalProfitLossPercent,
        List<HoldingResponse> holdings
) {}