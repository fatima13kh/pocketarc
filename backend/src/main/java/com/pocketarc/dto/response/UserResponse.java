package com.pocketarc.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record UserResponse(
        Long id,
        String username,
        String email,
        String phoneNumber,
        Boolean isAdmin,
        BigDecimal cashBalance,
        LocalDateTime createdAt
) {}