package com.pocketarc.dto.request;

import jakarta.validation.constraints.NotNull;

public record SubmitAnswerRequest(
        @NotNull(message = "Question ID is required")
        Long questionId,

        @NotNull(message = "Option ID is required")
        Long selectedOptionId
) {}