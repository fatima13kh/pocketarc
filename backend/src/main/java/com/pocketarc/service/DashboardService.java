// src/main/java/com/pocketarc/service/DashboardService.java
package com.pocketarc.service;

import com.pocketarc.dto.response.AdminDashboardResponse;
import com.pocketarc.dto.response.UserDashboardResponse;
import com.pocketarc.service.dashboard.AdminDashboardService;
import com.pocketarc.service.dashboard.UserDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final UserDashboardService userDashboardService;
    private final AdminDashboardService adminDashboardService;

    public UserDashboardResponse getUserDashboard(Long userId) {
        return userDashboardService.getUserDashboard(userId);
    }

    public AdminDashboardResponse getAdminDashboard() {
        return adminDashboardService.getAdminDashboard();
    }
}