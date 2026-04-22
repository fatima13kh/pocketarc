package com.pocketarc.dto.response;

import java.math.BigDecimal;

public record AnswerResultResponse(
        Long questionId,
        Long selectedOptionId,
        Boolean isCorrect,
        String reasoningText,
        BigDecimal cashEffect,
        BigDecimal newBalance
) {}