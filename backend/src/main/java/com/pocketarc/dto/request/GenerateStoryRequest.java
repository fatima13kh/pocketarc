package com.pocketarc.dto.request;

import com.pocketarc.model.enums.DifficultyLevel;
import com.pocketarc.model.enums.StoryCategory;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record GenerateStoryRequest(
        @NotNull(message = "Difficulty is required")
        DifficultyLevel difficulty,

        @NotNull(message = "Category is required")
        StoryCategory category,

        @Min(value = 1, message = "Number of questions must be at least 1")
        @Max(value = 5, message = "Number of questions cannot exceed 5")
        Integer numberOfQuestions
) {}