package com.shoes.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.util.UUID;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductResponse {
    private UUID id;
    private CategoryResponse category;
    private BrandResponse brand;
    private String nameVi;
    private String nameEn;
    private String slug;
    private String descriptionVi;
    private String descriptionEn;
    private BigDecimal basePrice;
    private String targetAudience;
    private Boolean isActive;
    private List<ProductImageResponse> images;
    private List<ProductVariantResponse> variants;
    private Double averageRating;
    private Integer totalReviews;
    private Integer soldQuantity;
    private java.time.LocalDateTime createdAt;
}
