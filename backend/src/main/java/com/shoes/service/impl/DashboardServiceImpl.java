package com.shoes.service.impl;

import com.shoes.dto.DailyStat;
import com.shoes.dto.DashboardStatsResponse;
import com.shoes.entity.Order;
import com.shoes.entity.Role;
import com.shoes.repository.OrderRepository;
import com.shoes.repository.ProductRepository;
import com.shoes.repository.UserRepository;
import com.shoes.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DashboardServiceImpl implements DashboardService {

    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;

    @Override
    public DashboardStatsResponse getDashboardStats(String type, LocalDate startDate, LocalDate endDate) {
        long totalProducts = productRepository.count();
        long totalCustomers = userRepository.countByRole(Role.CUSTOMER);
        
        long totalOrders = 0;
        double totalRevenue = 0;

        List<DailyStat> chartData = new ArrayList<>();
        
        if ("custom".equalsIgnoreCase(type) && startDate != null && endDate != null) {
            LocalDateTime start = startDate.atStartOfDay();
            LocalDateTime end = endDate.atTime(23, 59, 59);
            List<Order> recentOrders = orderRepository.findByCreatedAtBetween(start, end);
            
            long daysBetween = java.time.temporal.ChronoUnit.DAYS.between(startDate, endDate);
            if (daysBetween <= 60) {
                DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM");
                for (int i = 0; i <= daysBetween; i++) {
                    LocalDate date = startDate.plusDays(i);
                    String name = date.format(formatter);
                    double sales = 0;
                    int orders = 0;
                    for (Order order : recentOrders) {
                        if (order.getCreatedAt().toLocalDate().equals(date)) {
                            orders++;
                            if (!"CANCELLED".equals(order.getOrderStatus())) {
                                sales += order.getFinalAmount().doubleValue();
                            }
                        }
                    }
                    chartData.add(new DailyStat(name, sales, orders));
                }
            } else {
                DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MM/yyyy");
                java.time.YearMonth startYM = java.time.YearMonth.from(startDate);
                java.time.YearMonth endYM = java.time.YearMonth.from(endDate);
                
                java.time.YearMonth current = startYM;
                while (!current.isAfter(endYM)) {
                    String name = current.format(formatter);
                    double sales = 0;
                    int orders = 0;
                    
                    for (Order order : recentOrders) {
                        if (java.time.YearMonth.from(order.getCreatedAt()).equals(current)) {
                            orders++;
                            if (!"CANCELLED".equals(order.getOrderStatus())) {
                                sales += order.getFinalAmount().doubleValue();
                            }
                        }
                    }
                    chartData.add(new DailyStat(name, sales, orders));
                    current = current.plusMonths(1);
                }
            }
        } else if ("year".equalsIgnoreCase(type)) {
            // Dữ liệu 5 năm gần nhất
            LocalDateTime fiveYearsAgo = LocalDateTime.now().minusYears(4).withDayOfYear(1).withHour(0).withMinute(0).withSecond(0);
            List<Order> recentOrders = orderRepository.findByCreatedAtAfter(fiveYearsAgo);
            
            for (int i = 4; i >= 0; i--) {
                int year = LocalDate.now().getYear() - i;
                String name = String.valueOf(year);
                
                double sales = 0;
                int orders = 0;
                
                for (Order order : recentOrders) {
                    if (order.getCreatedAt().getYear() == year) {
                        orders++;
                        if (!"CANCELLED".equals(order.getOrderStatus())) {
                            sales += order.getFinalAmount().doubleValue();
                        }
                    }
                }
                chartData.add(new DailyStat(name, sales, orders));
            }
        } else if ("month".equalsIgnoreCase(type)) {
            // Dữ liệu 6 tháng gần nhất
            LocalDateTime sixMonthsAgo = LocalDateTime.now().minusMonths(5).withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0);
            List<Order> recentOrders = orderRepository.findByCreatedAtAfter(sixMonthsAgo);
            
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MM/yyyy");
            
            for (int i = 5; i >= 0; i--) {
                java.time.YearMonth ym = java.time.YearMonth.now().minusMonths(i);
                String name = ym.format(formatter);
                
                double sales = 0;
                int orders = 0;
                
                for (Order order : recentOrders) {
                    if (java.time.YearMonth.from(order.getCreatedAt()).equals(ym)) {
                        orders++;
                        if (!"CANCELLED".equals(order.getOrderStatus())) {
                            sales += order.getFinalAmount().doubleValue();
                        }
                    }
                }
                chartData.add(new DailyStat(name, sales, orders));
            }
        } else {
            // Mặc định: 7 ngày gần nhất
            LocalDateTime sevenDaysAgo = LocalDateTime.now().minusDays(6).withHour(0).withMinute(0).withSecond(0);
            List<Order> recentOrders = orderRepository.findByCreatedAtAfter(sevenDaysAgo);

            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM");

            for (int i = 6; i >= 0; i--) {
                LocalDate date = LocalDate.now().minusDays(i);
                String name = date.format(formatter);
                
                double sales = 0;
                int orders = 0;
                
                for (Order order : recentOrders) {
                    if (order.getCreatedAt().toLocalDate().equals(date)) {
                        orders++;
                        if (!"CANCELLED".equals(order.getOrderStatus())) {
                            sales += order.getFinalAmount().doubleValue();
                        }
                    }
                }
                
                chartData.add(new DailyStat(name, sales, orders));
            }
        }

        long filteredOrders = chartData.stream().mapToLong(DailyStat::getOrders).sum();
        double filteredRevenue = chartData.stream().mapToDouble(DailyStat::getSales).sum();

        return DashboardStatsResponse.builder()
                .totalProducts(totalProducts)
                .totalOrders(filteredOrders)
                .revenue(filteredRevenue)
                .customers(totalCustomers)
                .productsTrend("+0%") // Fake trend for now
                .ordersTrend("+0%")
                .revenueTrend("+0%")
                .customersTrend("+0%")
                .chartData(chartData)
                .build();
    }
}
