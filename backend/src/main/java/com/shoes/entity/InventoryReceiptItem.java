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

    @Column(name = "expected_quantity")
    private Integer expectedQuantity; // Tồn kho hiện tại (dùng cho Kiểm kê)

    @Column(name = "actual_quantity", nullable = false)
    private Integer actualQuantity; // Số lượng thực tế kiểm kê HOẶC Số lượng nhập kho

    @Column(name = "import_price")
    private BigDecimal importPrice; // Giá nhập (dùng cho Nhập kho)
}
