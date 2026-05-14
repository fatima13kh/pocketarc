package com.pocketarc.controller;

import com.pocketarc.dto.request.CreateGoalRequest;
import com.pocketarc.dto.request.UpdateGoalRequest;
import com.pocketarc.dto.response.GoalResponse;
import com.pocketarc.security.JwtTokenProvider;
import com.pocketarc.service.GoalService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

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

    @PostMapping(consumes = {MediaType.MULTIPART_FORM_DATA_VALUE, MediaType.APPLICATION_JSON_VALUE})
    public ResponseEntity<GoalResponse> createGoal(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam(value = "name", required = false) String name,
            @RequestParam(value = "targetAmount", required = false) BigDecimal targetAmount,
            @RequestParam(value = "category", required = false) String category,
            @RequestParam(value = "coverImage", required = false) MultipartFile coverImage) {

        Long userId = extractUserId(authHeader);

        CreateGoalRequest request = CreateGoalRequest.builder()
                .name(name)
                .targetAmount(targetAmount)
                .category(category)
                .coverImage(coverImage)
                .build();

        GoalResponse response = goalService.createGoal(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{goalId}")
    public ResponseEntity<GoalResponse> updateGoal(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long goalId,
            @Valid @RequestBody UpdateGoalRequest request) {
        Long userId = extractUserId(authHeader);
        return ResponseEntity.ok(goalService.updateGoal(goalId, userId, request));
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