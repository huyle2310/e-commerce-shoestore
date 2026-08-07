package com.shoes.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "inventory_receipt_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryReceiptItem {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "receipt_id", nullable = false)
    private InventoryReceipt receipt;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "variant_id", nullable = false)
    private ProductVariant variant;

    // Snapshot data để lưu trữ lịch sử không bị thay đổi nếu Product/Variant bị xóa hoặc đổi tên
    @Column(name = "product_name")
    private String productName;

    @Column(name = "sku", length = 100)
    private String sku;

    @Column(name = "color", length = 50)
    private String color;

    @Column(name = "size", length = 20)
    private String size;

    @Column(name = "expected_quantity")
    private Integer expectedQuantity; // Tồn kho hiện tại (dùng cho Kiểm kê)

    @Column(name = "actual_quantity", nullable = false)
    private Integer actualQuantity; // Số lượng thực tế kiểm kê HOẶC Số lượng nhập kho

    @Column(name = "import_price")
    private BigDecimal importPrice; // Giá nhập (dùng cho Nhập kho)
}
