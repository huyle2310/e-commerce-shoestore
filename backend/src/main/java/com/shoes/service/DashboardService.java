package com.shoes.service;

import com.shoes.dto.DashboardStatsResponse;

public interface DashboardService {
    DashboardStatsResponse getDashboardStats(String type, java.time.LocalDate startDate, java.time.LocalDate endDate);
}
