package com.pocketarc.controller;

import com.pocketarc.dto.response.DashboardSummaryResponse;
import com.pocketarc.security.JwtTokenProvider;
import com.pocketarc.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;
    private final JwtTokenProvider jwtTokenProvider;

    private Long extractUserId(String authHeader) {
        String token = authHeader.substring(7);
        return jwtTokenProvider.getUserIdFromToken(token);
    }

    @GetMapping("/summary")
    public ResponseEntity<DashboardSummaryResponse> getDashboardSummary(
            @RequestHeader("Authorization") String authHeader) {
        Long userId = extractUserId(authHeader);
        return ResponseEntity.ok(dashboardService.getDashboardSummary(userId));
    }
}