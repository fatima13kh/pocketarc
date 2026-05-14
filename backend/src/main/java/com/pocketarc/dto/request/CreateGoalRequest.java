package com.pocketarc.dto.request;

import lombok.Builder;
import lombok.Data;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

@Data
@Builder
public class CreateGoalRequest {

    @NotBlank(message = "Goal name is required")
    @Size(min = 2, max = 50, message = "Goal name must be between 2 and 50 characters")
    private String name;

    @NotNull(message = "Target amount is required")
    @DecimalMin(value = "0.01", message = "Target amount must be greater than 0")
    private BigDecimal targetAmount;

    @NotBlank(message = "Category is required")
    private String category;

    private String coverImageBase64;
}