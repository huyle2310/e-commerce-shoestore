package com.shoes.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CartItemResponse {
    private UUID id;
    private UUID variantId;
    private String sku;
    private String productName;
    private String color;
    private String size;
    private String imageUrl;
    private java.math.BigDecimal unitPrice;
    private Integer quantity;
    private Integer stockQuantity;
    private java.math.BigDecimal totalPrice;
}
