package com.pocketarc.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record HoldingResponse(
        Long transactionId,
        String symbol,
        String companyName,
        BigDecimal shares,
        BigDecimal purchasePriceUsd,
        BigDecimal purchasePriceBhd,
        BigDecimal currentPriceUsd,
        BigDecimal currentPriceBhd,
        BigDecimal totalCostBhd,
        BigDecimal currentValueBhd,
        BigDecimal profitLossBhd,
        BigDecimal profitLossPercent,
        LocalDateTime purchaseDate
) {}