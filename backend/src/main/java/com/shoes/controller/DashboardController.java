package com.shoes.controller;

import com.shoes.dto.DashboardStatsResponse;
import com.shoes.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/dashboard")
@RequiredArgsConstructor
@CrossOrigin("*")
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/stats")
    public ResponseEntity<DashboardStatsResponse> getDashboardStats(@org.springframework.web.bind.annotation.RequestParam(defaultValue = "day") String type) {
        return ResponseEntity.ok(dashboardService.getDashboardStats(type));
    }
}
