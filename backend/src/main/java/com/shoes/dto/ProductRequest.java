package com.shoes.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductRequest {
    private String nameVi;
    private String nameEn;
    private String descriptionVi;
    private String descriptionEn;
    private BigDecimal basePrice;
    private String targetAudience;
    private Boolean isActive;
    
    private Integer categoryId;
    private Integer brandId;
    
    private List<ProductVariantRequest> variants;
    private List<ProductImageRequest> images;
}
