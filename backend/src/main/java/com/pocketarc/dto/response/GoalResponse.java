package com.pocketarc.dto.response;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class GoalResponse {
    private Long id;
    private String name;
    private BigDecimal targetAmount;
    private BigDecimal currentAmount;
    private String coverImageUrl;
    private String category;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}