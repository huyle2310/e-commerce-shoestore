package com.shoes.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderResponse {
    private UUID id;
    private String fullName;
    private String phone;
    private String shippingAddress;
    private String orderNote;

    /** Tổng tiền hàng (chưa gồm ship, chưa trừ giảm giá) */
    private BigDecimal totalAmount;

    /** Phí vận chuyển – do backend tính, frontend chỉ hiển thị */
    private BigDecimal shippingFee;

    /** Số tiền giảm giá từ voucher */
    private BigDecimal discountAmount;

    /** Thành tiền cuối cùng = totalAmount + shippingFee - discountAmount */
    private BigDecimal finalAmount;

    private String paymentMethod;
    private String paymentStatus;
    private String orderStatus;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<OrderItemResponse> items;
}
