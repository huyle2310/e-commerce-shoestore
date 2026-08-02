package com.shoes.dto;

import lombok.*;
import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryReceiptItemRequest {
    private UUID variantId;
    private Integer expectedQuantity;
    private Integer actualQuantity;
    private BigDecimal importPrice;
}
