package com.pocketarc.controller;

import com.pocketarc.dto.request.CreateGoalRequest;
import com.pocketarc.dto.request.UpdateGoalRequest;
import com.pocketarc.dto.response.GoalResponse;
import com.pocketarc.security.JwtTokenProvider;
import com.pocketarc.service.GoalService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/goals")
@RequiredArgsConstructor
public class GoalController {

    private final GoalService goalService;
    private final JwtTokenProvider jwtTokenProvider;

    private Long extractUserId(String authHeader) {
        String token = authHeader.substring(7);
        return jwtTokenProvider.getUserIdFromToken(token);
    }

    @GetMapping
    public ResponseEntity<List<GoalResponse>> getUserGoals(
            @RequestHeader("Authorization") String authHeader) {
        Long userId = extractUserId(authHeader);
        return ResponseEntity.ok(goalService.getUserGoals(userId));
    }

    @GetMapping("/{goalId}")
    public ResponseEntity<GoalResponse> getGoal(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long goalId) {
        Long userId = extractUserId(authHeader);
        return ResponseEntity.ok(goalService.getGoal(goalId, userId));
    }

    // Accept JSON with Base64 image
    @PostMapping
    public ResponseEntity<GoalResponse> createGoal(
            @RequestHeader("Authorization") String authHeader,
            @Valid @RequestBody CreateGoalRequest request) {
        try {
            System.out.println("=== CREATE GOAL REQUEST ===");
            System.out.println("Name: " + request.getName());
            System.out.println("Target Amount: " + request.getTargetAmount());
            System.out.println("Category: " + request.getCategory());
            System.out.println("Has Base64 Image: " + (request.getCoverImageBase64() != null));
        Long userId = extractUserId(authHeader);

        GoalResponse response = goalService.createGoal(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            System.err.println("=== ERROR CREATING GOAL ===");
            e.printStackTrace(); // This will print the full stack trace
            throw e;
        }
    }

    // Accept JSON with Base64 image for update
    @PutMapping("/{goalId}")
    public ResponseEntity<GoalResponse> updateGoal(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long goalId,
            @Valid @RequestBody UpdateGoalRequest request) {

        Long userId = extractUserId(authHeader);

        GoalResponse response = goalService.updateGoal(goalId, userId, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{goalId}")
    public ResponseEntity<Void> deleteGoal(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long goalId) {
        Long userId = extractUserId(authHeader);
        goalService.deleteGoal(goalId, userId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{goalId}/add-funds")
    public ResponseEntity<GoalResponse> addFunds(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long goalId,
            @RequestParam BigDecimal amount) {
        Long userId = extractUserId(authHeader);
        return ResponseEntity.ok(goalService.addFunds(goalId, userId, amount));
    }

    @PostMapping("/{goalId}/withdraw")
    public ResponseEntity<GoalResponse> withdrawFunds(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long goalId,
            @RequestParam BigDecimal amount) {
        Long userId = extractUserId(authHeader);
        return ResponseEntity.ok(goalService.withdrawFunds(goalId, userId, amount));
    }
}