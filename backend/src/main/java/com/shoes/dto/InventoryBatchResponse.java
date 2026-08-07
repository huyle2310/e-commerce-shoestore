package com.shoes.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Response DTO cho InventoryBatch.
 * Dùng trong giao diện Quản lý Kho mới.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InventoryBatchResponse {

    // --- Thông tin lô (Batch) ---
    private UUID id;
    private String batchCode;
    private Integer quantity;
    private String warehouseType;    // INVENTORY | CLEARANCE
    private String productStatus;    // ACTIVE | DISPOSED
    
    // Nguồn gốc
    private UUID receiptItemId;
    private UUID parentBatchId;

    // --- Thông tin variant cơ bản (Parent info) ---
    private UUID variantId;
    private String sku;
    private String colorVi;
    private String colorEn;
    private String size;
    private BigDecimal priceModifier;

    // --- Thông tin sản phẩm cha ---
    private UUID productId;
    private String productNameVi;
    private String productNameEn;
    private String productSlug;
    private BigDecimal basePrice;
    private String primaryImageUrl;
    private String imageUrl;

    // --- Kiểm kê (Inspect) ---
    private Integer qualityPercentage;
    private String conditionNote;

    // --- Thanh lý ---
    private BigDecimal clearancePrice;

    // --- Thông tin nhập ---
    private LocalDateTime importDate;
    private BigDecimal importPrice;
}
