package com.pocketarc.dto.response;

import java.math.BigDecimal;
import java.util.List;

public record StoryCompletionResponse(
        String storyTitle,
        BigDecimal totalReward,
        BigDecimal finalBalance,
        List<AnswerSummary> answers
) {
    public record AnswerSummary(
            String questionText,
            String selectedOption,
            Boolean isCorrect,
            BigDecimal cashEffect,
            String reasoningText
    ) {}
}