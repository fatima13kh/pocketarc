package com.pocketarc.dto.request;

import com.pocketarc.model.enums.DifficultyLevel;
import com.pocketarc.model.enums.StoryCategory;
import com.pocketarc.model.enums.StoryStatus;
import java.math.BigDecimal;
import java.util.List;

public record UpdateStoryRequest(
        String title,
        DifficultyLevel difficulty,
        StoryCategory category,
        String openingContent,
        BigDecimal rewardPerCorrect,
        BigDecimal penaltyPerWrong,
        StoryStatus status,
        List<CreateStoryRequest.QuestionRequest> questions
) {}