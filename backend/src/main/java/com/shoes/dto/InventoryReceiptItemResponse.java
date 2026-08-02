package com.shoes.dto;

import lombok.*;
import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryReceiptItemResponse {
    private UUID id;
    private UUID variantId;
    private String productName;
    private String sku;
    private String color;
    private String size;
    private Integer expectedQuantity;
    private Integer actualQuantity;
    private BigDecimal importPrice;
}
