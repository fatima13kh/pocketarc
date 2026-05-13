package com.pocketarc.dto.response;

public record UserAnswerResponse(
        Long questionId,
        String questionText,
        Long selectedOptionId,
        String selectedOptionText,
        Boolean isCorrect,
        String selectedOptionReasoning,
        Long correctOptionId,
        String correctOptionText,
        String correctOptionReasoning
) {
    // Constructor for simple version (backward compatible)
    public UserAnswerResponse(Long questionId, Long selectedOptionId, Boolean isCorrect) {
        this(questionId, null, selectedOptionId, null, isCorrect, null, null, null, null);
    }
}