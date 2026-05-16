package com.pocketarc.dto.response;

import java.math.BigDecimal;

public record StockSearchResponse(
        String symbol,
        String name,
        BigDecimal priceUsd,
        BigDecimal priceBhd,
        BigDecimal changeUsd,
        BigDecimal changePercent,
        String sector
) {}