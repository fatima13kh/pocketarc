package com.pocketarc.dto.response;

import java.util.List;

public record StoryPageResponse(
        List<StoryResponse> stories,
        int currentPage,
        int totalPages,
        long totalElements
) {}