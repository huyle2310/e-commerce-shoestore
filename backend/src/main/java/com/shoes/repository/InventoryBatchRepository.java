package com.shoes.repository;

import com.shoes.entity.InventoryBatch;
import com.shoes.entity.ProductStatus;
import com.shoes.entity.WarehouseType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface InventoryBatchRepository extends JpaRepository<InventoryBatch, UUID> {
    
    /** Tìm tất cả các lô thuộc một Variant */
    List<InventoryBatch> findByVariantId(UUID variantId);

    /** Tìm các lô ACTIVE thuộc về kho cụ thể */
    List<InventoryBatch> findByVariantIdAndWarehouseTypeAndProductStatusOrderByImportDateAsc(
        UUID variantId, WarehouseType warehouseType, ProductStatus productStatus);

    List<InventoryBatch> findByWarehouseTypeAndProductStatus(WarehouseType warehouseType, ProductStatus productStatus);
    
    List<InventoryBatch> findByWarehouseTypeAndProductStatusAndQuantityGreaterThan(WarehouseType warehouseType, ProductStatus productStatus, Integer quantity);

    @Query("SELECT b FROM InventoryBatch b WHERE b.warehouseType = :type " +
           "AND (:status IS NULL OR b.productStatus = :status) " +
           "AND b.quantity > 0")
    List<InventoryBatch> findInventoryBatches(
        @Param("type") WarehouseType type,
        @Param("status") ProductStatus status);

    @Query("SELECT b FROM InventoryBatch b WHERE b.warehouseType = :type " +
           "AND (:status IS NULL OR b.productStatus = :status)")
    List<InventoryBatch> findClearanceBatches(
        @Param("type") WarehouseType type,
        @Param("status") ProductStatus status);

    /** Truy vấn phục vụ thuật toán xuất kho Order Deduction */
    @Query("SELECT b FROM InventoryBatch b " +
           "WHERE b.variant.id = :variantId AND b.productStatus = 'ACTIVE' AND b.quantity > 0 " +
           "ORDER BY " +
           "  CASE WHEN b.warehouseType = 'CLEARANCE' THEN 0 ELSE 1 END ASC, " +
           "  b.qualityPercentage ASC, " +
           "  b.importDate ASC")
    List<InventoryBatch> findActiveBatchesForDeduction(@Param("variantId") UUID variantId);

    /** Lấy tổng tồn kho ACTIVE của 1 variant */
    @Query("SELECT COALESCE(SUM(b.quantity), 0) FROM InventoryBatch b " +
           "WHERE b.variant.id = :variantId AND b.productStatus = 'ACTIVE'")
    Integer sumActiveStockByVariantId(@Param("variantId") UUID variantId);
}
