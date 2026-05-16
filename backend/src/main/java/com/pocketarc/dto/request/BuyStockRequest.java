// src/main/java/com/pocketarc/dto/request/BuyStockRequest.java
package com.pocketarc.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record BuyStockRequest(
        @NotBlank(message = "Stock symbol is required")
        String symbol,

        @NotBlank(message = "Company name is required")
        String companyName,

        @NotNull(message = "Amount is required")
        @DecimalMin(value = "0.01", message = "Amount must be greater than 0")
        BigDecimal amountBhd
) {}