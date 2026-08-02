package com.shoes.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStatsResponse {
    private long totalProducts;
    private long totalOrders;
    private double revenue;
    private long customers;
    
    private String productsTrend;
    private String ordersTrend;
    private String revenueTrend;
    private String customersTrend;
    
    private List<DailyStat> chartData;
}
