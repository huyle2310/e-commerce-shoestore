package com.shoes.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "inventory_batches")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryBatch {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    /** Mã lô, sinh tự động từ phiếu nhập VD: B20260804001 */
    @Column(name = "batch_code", nullable = false, unique = true, length = 50)
    private String batchCode;

    /** Lô thuộc về Variant nào */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "variant_id", nullable = false)
    private ProductVariant variant;

    /**
     * Nguồn gốc từ ReceiptItem nào (cho phép null nếu lô được tạo thủ công hoặc migration)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "receipt_item_id")
    private InventoryReceiptItem receiptItem;

    /** Lô mẹ (Nếu lô này được sinh ra do thao tác Split Batch khi kiểm kê/thanh lý) */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_batch_id")
    private InventoryBatch parentBatch;

    /** Số lượng còn lại trong lô này */
    @Column(nullable = false)
    private Integer quantity;

    /** INVENTORY hoặc CLEARANCE */
    @Enumerated(EnumType.STRING)
    @Column(name = "warehouse_type", length = 20)
    @Builder.Default
    private WarehouseType warehouseType = WarehouseType.INVENTORY;

    /** ACTIVE hoặc DISPOSED */
    @Enumerated(EnumType.STRING)
    @Column(name = "product_status", length = 20)
    @Builder.Default
    private ProductStatus productStatus = ProductStatus.ACTIVE;

    /** Chất lượng % */
    @Column(name = "quality_percentage")
    @Builder.Default
    private Integer qualityPercentage = 100;

    /** Tình trạng */
    @Column(name = "condition_note", columnDefinition = "TEXT")
    private String conditionNote;

    /** Giá xả kho (chỉ áp dụng khi warehouseType = CLEARANCE) */
    @Column(name = "clearance_price")
    private BigDecimal clearancePrice;

    /** Ngày nhập (Lấy từ ngày approve phiếu, hoặc kế thừa từ lô mẹ) */
    @Column(name = "import_date")
    private LocalDateTime importDate;

    /** Giá nhập (Lấy từ InventoryReceiptItem, dùng tính giá vốn FIFO sau này) */
    @Column(name = "import_price")
    private BigDecimal importPrice;

    /** Ảnh chụp thực tế của lô hàng thanh lý (nếu có) */
    @Column(name = "image_url")
    private String imageUrl;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Version
    @Column(columnDefinition = "bigint default 0")
    private Long version;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (warehouseType == null) warehouseType = WarehouseType.INVENTORY;
        if (productStatus == null) productStatus = ProductStatus.ACTIVE;
        if (qualityPercentage == null) qualityPercentage = 100;
        if (importDate == null) importDate = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
