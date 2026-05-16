// src/main/java/com/pocketarc/dto/request/SellStockRequest.java
package com.pocketarc.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record SellStockRequest(
        @NotNull(message = "Transaction ID is required")
        Long transactionId,

        @NotNull(message = "Shares to sell is required")
        @DecimalMin(value = "0.000001", message = "Shares must be greater than 0")
        BigDecimal sharesToSell
) {}