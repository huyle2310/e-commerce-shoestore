package com.shoes.dto;

import lombok.*;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryReceiptRequest {
    private String receiptType; // 'IMPORT', 'AUDIT'
    private String note;
    private List<InventoryReceiptItemRequest> items;
}
