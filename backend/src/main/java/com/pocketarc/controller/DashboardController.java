// src/main/java/com/pocketarc/controller/DashboardController.java
package com.pocketarc.controller;

import com.pocketarc.dto.response.AdminDashboardResponse;
import com.pocketarc.dto.response.UserDashboardResponse;
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

    private boolean isAdmin(String authHeader) {
        String token = authHeader.substring(7);
        return jwtTokenProvider.isAdminFromToken(token);
    }

    @GetMapping
    public ResponseEntity<?> getDashboard(@RequestHeader("Authorization") String authHeader) {
        Long userId = extractUserId(authHeader);

        if (isAdmin(authHeader)) {
            return ResponseEntity.ok(dashboardService.getAdminDashboard());
        } else {
            return ResponseEntity.ok(dashboardService.getUserDashboard(userId));
        }
    }
}