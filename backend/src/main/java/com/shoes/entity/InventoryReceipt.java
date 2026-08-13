package com.shoes.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;
import java.util.List;

@Entity
@Table(name = "inventory_receipts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryReceipt {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "receipt_type", nullable = false, length = 20)
    private String receiptType; // 'IMPORT' or 'AUDIT'

    @Column(name = "reference_code", nullable = false, unique = true, length = 50)
    private String referenceCode; // Mã phiếu nhập / kiểm kê

    @Column(name = "status", nullable = false, length = 20)
    private String status; // 'PENDING' or 'COMPLETED'

    @Column(columnDefinition = "TEXT")
    private String note;

    @Column(name = "supplier_name", length = 255)
    private String supplierName;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @OneToMany(mappedBy = "receipt", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<InventoryReceiptItem> items;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null) status = "PENDING";
        if (referenceCode == null) {
            referenceCode = (receiptType != null ? receiptType : "REC") + "-" + System.currentTimeMillis();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
