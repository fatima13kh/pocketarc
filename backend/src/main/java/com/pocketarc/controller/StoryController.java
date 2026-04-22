package com.pocketarc.controller;

import com.pocketarc.dto.request.*;
import com.pocketarc.dto.response.*;
import com.pocketarc.security.JwtTokenProvider;
import com.pocketarc.service.StoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/stories")
@RequiredArgsConstructor
public class StoryController {

    private final StoryService     storyService;
    private final JwtTokenProvider jwtTokenProvider;

    // ── USER ENDPOINTS ────────────────────────────────────────────────────────

    @GetMapping
    public ResponseEntity<StoryPageResponse> getUserStories(
            @RequestHeader("Authorization") String auth,
            @RequestParam(defaultValue = "") String search,
            @RequestParam(defaultValue = "") String difficulty,
            @RequestParam(defaultValue = "") String category,
            @RequestParam(defaultValue = "") String sortBy,
            @RequestParam(defaultValue = "0") int page) {
        Long userId = extractUserId(auth);
        return ResponseEntity.ok(storyService.getUserStories(
                userId, search, difficulty, category, sortBy, page));
    }

    @GetMapping("/{storyId}")
    public ResponseEntity<StoryResponse> getStory(
            @RequestHeader("Authorization") String auth,
            @PathVariable Long storyId) {
        Long userId = extractUserId(auth);
        boolean isAdmin = jwtTokenProvider.isAdminFromToken(auth.substring(7));
        return ResponseEntity.ok(storyService.getStory(storyId, userId, isAdmin));
    }

    @PostMapping("/{storyId}/start")
    public ResponseEntity<StoryResponse> startStory(
            @RequestHeader("Authorization") String auth,
            @PathVariable Long storyId) {
        return ResponseEntity.ok(
                storyService.startOrResumeStory(storyId, extractUserId(auth)));
    }

    @PostMapping("/{storyId}/answer")
    public ResponseEntity<AnswerResultResponse> submitAnswer(
            @RequestHeader("Authorization") String auth,
            @PathVariable Long storyId,
            @Valid @RequestBody SubmitAnswerRequest request) {
        return ResponseEntity.ok(
                storyService.submitAnswer(storyId, extractUserId(auth), request));
    }

    @PostMapping("/{storyId}/complete")
    public ResponseEntity<StoryCompletionResponse> completeStory(
            @RequestHeader("Authorization") String auth,
            @PathVariable Long storyId) {
        return ResponseEntity.ok(
                storyService.completeStory(storyId, extractUserId(auth)));
    }

    // ── ADMIN ENDPOINTS ───────────────────────────────────────────────────────

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<StoryPageResponse> getAdminStories(
            @RequestParam(defaultValue = "") String search,
            @RequestParam(defaultValue = "") String difficulty,
            @RequestParam(defaultValue = "") String category,
            @RequestParam(defaultValue = "") String status,
            @RequestParam(defaultValue = "") String sortBy,
            @RequestParam(defaultValue = "0") int page) {
        return ResponseEntity.ok(storyService.getAdminStories(
                search, difficulty, category, status, sortBy, page));
    }

    @PostMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<StoryResponse> createStory(
            @Valid @RequestBody CreateStoryRequest request) {
        return ResponseEntity.ok(storyService.createStory(request));
    }

    @PatchMapping("/admin/{storyId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<StoryResponse> updateStory(
            @PathVariable Long storyId,
            @RequestBody UpdateStoryRequest request) {
        return ResponseEntity.ok(storyService.updateStory(storyId, request));
    }

    @DeleteMapping("/admin/{storyId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse> deleteStory(@PathVariable Long storyId) {
        return ResponseEntity.ok(storyService.deleteStory(storyId));
    }

    @PostMapping("/admin/{storyId}/publish")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<StoryResponse> publishStory(@PathVariable Long storyId) {
        return ResponseEntity.ok(storyService.publishStory(storyId));
    }

    @PostMapping("/admin/{storyId}/draft")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<StoryResponse> draftStory(@PathVariable Long storyId) {
        return ResponseEntity.ok(storyService.draftStory(storyId));
    }

    @PostMapping("/admin/generate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<StoryResponse> generateStory(
            @Valid @RequestBody GenerateStoryRequest request) {
        return ResponseEntity.ok(storyService.generateStory(request));
    }

    @GetMapping("/admin/check-similar")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> checkSimilar(
            @RequestParam String title) {
        return ResponseEntity.ok(storyService.checkSimilarStory(title));
    }

    private Long extractUserId(String authHeader) {
        return jwtTokenProvider.getUserIdFromToken(authHeader.substring(7));
    }
}