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
public class ProductVariantRequest {
    private UUID id; // null if new variant
    private String sku;
    private String colorVi;
    private String colorEn;
    private String size;
    private Integer stockQuantity;
    private BigDecimal priceModifier;
}
