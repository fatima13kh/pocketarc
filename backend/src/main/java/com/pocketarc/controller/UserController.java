package com.pocketarc.controller;

import com.pocketarc.dto.request.*;
import com.pocketarc.dto.response.*;
import com.pocketarc.security.JwtTokenProvider;
import com.pocketarc.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final JwtTokenProvider jwtTokenProvider;

    // GET /api/users/me
    @GetMapping("/me")
    public ResponseEntity<UserResponse> getCurrentUser(
            @RequestHeader("Authorization") String authHeader) {
        Long userId = extractUserId(authHeader);
        return ResponseEntity.ok(userService.getCurrentUser(userId));
    }

    // PATCH /api/users/me
    @PatchMapping("/me")
    public ResponseEntity<UserResponse> updateProfile(
            @RequestHeader("Authorization") String authHeader,
            @Valid @RequestBody UpdateProfileRequest request) {
        Long userId = extractUserId(authHeader);
        return ResponseEntity.ok(userService.updateProfile(userId, request));
    }

    // DELETE /api/users/me
    @DeleteMapping("/me")
    public ResponseEntity<ApiResponse> deleteAccount(
            @RequestHeader("Authorization") String authHeader,
            @Valid @RequestBody DeleteAccountRequest request) {
        Long userId = extractUserId(authHeader);
        return ResponseEntity.ok(userService.deleteAccount(userId, request));
    }

    private Long extractUserId(String authHeader) {
        String token = authHeader.substring(7);
        return jwtTokenProvider.getUserIdFromToken(token);
    }
}