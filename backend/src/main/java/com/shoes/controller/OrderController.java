package com.shoes.controller;

import com.shoes.dto.OrderRequest;
import com.shoes.dto.OrderResponse;
import com.shoes.security.CustomUserDetails;
import com.shoes.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/orders")
@RequiredArgsConstructor
@CrossOrigin("*")
public class OrderController {

    private final OrderService orderService;

    @org.springframework.security.access.prepost.PreAuthorize("hasRole('CUSTOMER')")
    @PostMapping
    public ResponseEntity<OrderResponse> placeOrder(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody OrderRequest request) {
        return ResponseEntity.ok(orderService.placeOrder(userDetails.getId(), request));
    }

    @PostMapping("/guest")
    public ResponseEntity<OrderResponse> placeGuestOrder(@Valid @RequestBody OrderRequest request) {
        return ResponseEntity.ok(orderService.placeGuestOrder(request));
    }

    @org.springframework.security.access.prepost.PreAuthorize("hasRole('CUSTOMER')")
    @GetMapping
    public ResponseEntity<List<OrderResponse>> getUserOrders(@AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(orderService.getUserOrders(userDetails.getId()));
    }

    @org.springframework.security.access.prepost.PreAuthorize("hasRole('CUSTOMER')")
    @GetMapping("/{id}")
    public ResponseEntity<OrderResponse> getOrderById(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID id) {
        return ResponseEntity.ok(orderService.getOrderById(userDetails.getId(), id));
    }

    // --- USER APIs ---
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('CUSTOMER')")
    @PutMapping("/{id}/cancel")
    public ResponseEntity<OrderResponse> cancelOrder(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID id) {
        return ResponseEntity.ok(orderService.cancelOrder(userDetails.getId(), id));
    }

    // --- ADMIN APIs ---
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('ADMIN', 'SALES_STAFF')")
    @GetMapping("/admin/all")
    public ResponseEntity<List<OrderResponse>> getAllOrdersAdmin() {
        return ResponseEntity.ok(orderService.getUserOrders(null));
    }

    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('ADMIN', 'SALES_STAFF')")
    @PutMapping("/{id}/status")
    public ResponseEntity<OrderResponse> updateOrderStatus(
            @PathVariable UUID id,
            @RequestParam String status) {
        return ResponseEntity.ok(orderService.updateOrderStatus(id, status));
    }

    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('ADMIN', 'SALES_STAFF')")
    @PutMapping("/{id}/payment-status")
    public ResponseEntity<OrderResponse> updatePaymentStatus(
            @PathVariable UUID id,
            @RequestParam String status) {
        return ResponseEntity.ok(orderService.updatePaymentStatus(id, status));
    }
}
