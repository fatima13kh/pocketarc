package com.pocketarc.dto.request;

import com.pocketarc.model.enums.DifficultyLevel;
import com.pocketarc.model.enums.StoryCategory;
import jakarta.validation.constraints.NotNull;

public record GenerateStoryRequest(
        @NotNull(message = "Difficulty is required")
        DifficultyLevel difficulty,

        @NotNull(message = "Category is required")
        StoryCategory category
) {}