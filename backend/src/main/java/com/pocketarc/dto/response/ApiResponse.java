package com.pocketarc.dto.response;

public record ApiResponse(
        Boolean success,
        String message
) {}