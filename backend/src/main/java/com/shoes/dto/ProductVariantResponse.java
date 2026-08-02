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
public class ProductVariantResponse {
    private UUID id;
    private String sku;
    private String colorVi;
    private String colorEn;
    private String size;
    private Integer stockQuantity;
    private BigDecimal priceModifier;
}
