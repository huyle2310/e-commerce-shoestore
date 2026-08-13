package com.shoes.dto;

import lombok.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryReceiptResponse {
    private UUID id;
    private String receiptType;
    private String referenceCode;
    private String status;
    private String note;
    private String supplierName;
    private String createdBy; // User full name or email
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<InventoryReceiptItemResponse> items;
}
