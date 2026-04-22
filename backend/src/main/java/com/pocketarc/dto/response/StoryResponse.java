package com.pocketarc.dto.response;

import com.pocketarc.model.enums.AuthorType;
import com.pocketarc.model.enums.DifficultyLevel;
import com.pocketarc.model.enums.StoryCategory;
import com.pocketarc.model.enums.StoryStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record StoryResponse(
        Long id,
        String title,
        DifficultyLevel difficulty,
        StoryCategory category,
        BigDecimal rewardPerCorrect,
        BigDecimal penaltyPerWrong,
        String openingContent,
        AuthorType authorType,
        StoryStatus status,
        LocalDateTime createdAt,
        LocalDateTime publishedAt,
        List<QuestionResponse> questions,
        // user-specific fields
        String playStatus,   // PLAY, RESUME, PLAYED
        Integer playedCount  // admin only
) {
    public record QuestionResponse(
            Long id,
            Integer questionOrder,
            String questionText,
            List<OptionResponse> options
    ) {}

    public record OptionResponse(
            Long id,
            Integer optionOrder,
            String optionText,
            Boolean isCorrect,
            String reasoningText
    ) {}
}