package com.shoes.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderItemResponse {
    private UUID id;
    private String productName;
    private String color;
    private String size;
    private Integer quantity;

    /** Giá gốc lưu trong đơn hàng */
    private BigDecimal unitPrice;
    private BigDecimal totalPrice;

    private String imageUrl;
    
    // Clearance info
    private UUID inventoryBatchId;
    private Integer qualityPercentage;
    private String conditionNote;
    private String slug;

    /**
     * Giá hiệu lực (lấy bằng unitPrice)
     */
    private BigDecimal effectivePrice;
}
