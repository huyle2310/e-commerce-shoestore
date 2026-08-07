package com.shoes.service;

import com.shoes.dto.*;

import java.util.List;
import java.util.UUID;

/**
 * Service xử lý nghiệp vụ quản lý kho (Mô hình InventoryBatch):
 * - Kho nhập (INVENTORY)
 * - Kho thanh lý (CLEARANCE)
 * - Kiểm kê chất lượng
 * - Chuyển sang thanh lý
 * - Tiêu hủy sản phẩm
 */
public interface WarehouseService {

    /**
     * Lấy danh sách Lô hàng đang ở kho nhập (INVENTORY).
     * @param productStatus lọc theo trạng thái (ACTIVE/DISPOSED), null = tất cả
     * @param qualityMin    lọc chất lượng từ (%), null = không lọc
     * @param qualityMax    lọc chất lượng đến (%), null = không lọc
     */
    List<InventoryBatchResponse> getInventoryBatches(String productStatus, Integer qualityMin, Integer qualityMax);

    /**
     * Lấy danh sách các Lô hàng đang ở kho thanh lý (CLEARANCE).
     * @param productStatus lọc theo trạng thái (ACTIVE/DISPOSED), null = tất cả
     * @param qualityMin    lọc chất lượng từ (%)
     * @param qualityMax    lọc chất lượng đến (%)
     */
    List<InventoryBatchResponse> getClearanceBatches(String productStatus, Integer qualityMin, Integer qualityMax);

    /**
     * Lấy danh sách Batch thuộc 1 Variant (Dùng để hiển thị cấp con của TreeTable).
     */
    List<InventoryBatchResponse> getBatchesByVariant(UUID variantId);

    /**
     * Kiểm kê (KCS) một lô hàng.
     * Có thể dẫn đến Split Batch nếu chỉ một phần bị giảm chất lượng.
     */
    InventoryBatchResponse inspectBatch(UUID batchId, UUID adminId, InspectRequest request);

    /**
     * Thanh lý một lô hàng (chuyển sang kho CLEARANCE).
     * Có thể thanh lý một phần (Split Batch).
     */
    InventoryBatchResponse clearanceBatch(UUID batchId, UUID adminId, ClearanceRequest request);

    /**
     * Tiêu hủy lô hàng. Đổi trạng thái thành DISPOSED và set quantity = 0.
     */
    InventoryBatchResponse disposeBatch(UUID batchId, UUID adminId, String reason);

    /**
     * Phục hồi lô hàng đã tiêu hủy về kho INVENTORY.
     */
    InventoryBatchResponse restoreBatch(UUID batchId, UUID adminId);

    /**
     * Chuyển lô hàng từ kho CLEARANCE về lại kho INVENTORY.
     */
    InventoryBatchResponse revertClearance(UUID batchId, UUID adminId);

    /**
     * Điều chỉnh chất lượng lô hàng (Adjust Quality) kèm theo tự động merge
     */
    InventoryBatchResponse adjustBatch(UUID batchId, UUID adminId, AdjustRequest request);
    /**
     * Cập nhật giá thanh lý cho lô hàng
     */
    InventoryBatchResponse updateClearancePrice(UUID batchId, UUID adminId, ClearancePriceRequest request);

    /**
     * Upload ảnh chụp thực tế cho lô hàng thanh lý
     */
    InventoryBatchResponse uploadBatchImage(UUID batchId, UUID adminId, org.springframework.web.multipart.MultipartFile file);
}
