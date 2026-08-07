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

    /**
     * Giá hiệu lực để hiển thị và tính tiền.
     * Tạm thời lấy bằng originalPrice. 
     * Khách hàng sẽ thấy giá giảm thực tế khi đưa vào giỏ hàng hoặc xem phần Xả kho.
     */
    private BigDecimal effectivePrice;

    /**
     * Giá gốc (basePrice + priceModifier).
     */
    private BigDecimal originalPrice;
}
