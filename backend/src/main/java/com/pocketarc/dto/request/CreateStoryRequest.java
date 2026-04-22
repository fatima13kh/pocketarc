package com.pocketarc.dto.request;

import com.pocketarc.model.enums.DifficultyLevel;
import com.pocketarc.model.enums.StoryCategory;
import com.pocketarc.model.enums.StoryStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.List;

public record CreateStoryRequest(

        @NotBlank(message = "Title is required")
        String title,

        @NotNull(message = "Difficulty is required")
        DifficultyLevel difficulty,

        @NotNull(message = "Category is required")
        StoryCategory category,

        String openingContent,

        @NotNull(message = "Reward per correct is required")
        BigDecimal rewardPerCorrect,

        @NotNull(message = "Penalty per wrong is required")
        BigDecimal penaltyPerWrong,

        @NotNull(message = "Status is required")
        StoryStatus status,

        @NotNull(message = "Questions are required")
        List<QuestionRequest> questions
) {
    public record QuestionRequest(
            @NotBlank(message = "Question text is required")
            String questionText,
            Integer questionOrder,
            List<OptionRequest> options
    ) {}

    public record OptionRequest(
            @NotBlank(message = "Option text is required")
            String optionText,
            Integer optionOrder,
            Boolean isCorrect,
            String reasoningText
    ) {}
}