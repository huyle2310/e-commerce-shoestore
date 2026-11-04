package com.shoes.controller;

import com.shoes.dto.SePayWebhookRequest;
import com.shoes.entity.Order;
import com.shoes.repository.OrderRepository;
import com.shoes.service.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/payment/sepay")
@RequiredArgsConstructor
public class SePayController {

    private final OrderRepository orderRepository;
    private final EmailService emailService;

    @Value("${sepay.webhook-secret:}")
    private String webhookSecret;

    @Value("${sepay.bank-acc:}")
    private String bankAcc;

    @Value("${sepay.bank-name:}")
    private String bankName;

    @GetMapping("/config")
    public ResponseEntity<?> getSePayConfig() {
        return ResponseEntity.ok(Map.of(
                "bankAcc", bankAcc,
                "bankName", bankName
        ));
    }

    @PostMapping("/webhook")
    public ResponseEntity<?> handleWebhook(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestBody SePayWebhookRequest request) {

        // Validate Token: webhookSecret must be configured and match Authorization header
        if (webhookSecret == null || webhookSecret.trim().isEmpty() ||
                authorization == null || !java.security.MessageDigest.isEqual(
                        authorization.getBytes(java.nio.charset.StandardCharsets.UTF_8),
                        ("Apikey " + webhookSecret).getBytes(java.nio.charset.StandardCharsets.UTF_8))) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("success", false, "message", "Invalid Token"));
        }

        // Only process incoming transfers
        if ("in".equalsIgnoreCase(request.getTransferType()) && request.getTransferAmount() != null && request.getTransferAmount() > 0) {
            String content = request.getContent() != null ? request.getContent().toUpperCase() : "";

            // Find order by looking at pending orders
            List<Order> pendingOrders = orderRepository.findAll().stream()
                    .filter(o -> "UNPAID".equals(o.getPaymentStatus()))
                    .toList();

            for (Order order : pendingOrders) {
                // Generate the expected code: first part of UUID
                String expectedCode = order.getId().toString().split("-")[0].toUpperCase();
                
                // If content contains the code
                if (content.contains(expectedCode)) {
                    // Verify Amount
                    if (order.getFinalAmount().longValue() == request.getTransferAmount().longValue()) {
                        order.setPaymentStatus("PAID");
                        orderRepository.save(order);
                        
                        // Send confirmation email
                        if (order.getEmail() != null && !order.getEmail().trim().isEmpty()) {
                            emailService.sendOrderConfirmation(order.getEmail(), order);
                        } else if (order.getUser() != null) {
                            emailService.sendOrderConfirmation(order.getUser().getEmail(), order);
                        }
                        
                        return ResponseEntity.ok(Map.of("success", true, "message", "Order updated to PAID"));
                    }
                }
            }
        }

        return ResponseEntity.ok(Map.of("success", true, "message", "Acknowledged but no matching order found"));
    }

    @GetMapping("/status")
    public ResponseEntity<?> getPaymentStatus(@RequestParam("orderId") UUID orderId) {
        Order order = orderRepository.findById(orderId).orElse(null);
        if (order == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Order not found"));
        }
        return ResponseEntity.ok(Map.of(
                "orderId", order.getId(),
                "paymentStatus", order.getPaymentStatus()
        ));
    }
}
