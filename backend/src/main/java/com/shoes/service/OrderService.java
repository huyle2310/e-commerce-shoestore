package com.shoes.service;

import com.shoes.dto.OrderRequest;
import com.shoes.dto.OrderResponse;
import java.util.List;
import java.util.UUID;

public interface OrderService {
    OrderResponse placeOrder(UUID userId, OrderRequest request);

    OrderResponse placeGuestOrder(OrderRequest request);

    OrderResponse getOrderById(UUID userId, UUID orderId);

    List<OrderResponse> getUserOrders(UUID userId);

    OrderResponse updateOrderStatus(UUID orderId, String status); // Admin or system

    OrderResponse updatePaymentStatus(UUID orderId, String status); // Admin

    OrderResponse cancelOrder(UUID userId, UUID orderId);
}
