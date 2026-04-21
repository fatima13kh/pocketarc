package com.pocketarc.dto.response;

public record AuthResponse(
        String token,
        String username,
        String email,
        Boolean isAdmin
) {}