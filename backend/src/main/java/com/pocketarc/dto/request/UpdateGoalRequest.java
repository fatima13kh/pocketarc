package com.pocketarc.dto.request;

import lombok.Data;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

@Data
public class UpdateGoalRequest {

    @Size(min = 2, max = 50, message = "Goal name must be between 2 and 50 characters")
    private String name;

    @DecimalMin(value = "0.01", message = "Target amount must be greater than 0")
    private BigDecimal targetAmount;

    private String category;
}