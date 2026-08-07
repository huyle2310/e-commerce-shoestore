package com.shoes.controller;

import com.shoes.dto.*;
import com.shoes.security.CustomUserDetails;
import com.shoes.service.WarehouseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * REST Controller quản lý kho theo mô hình InventoryBatch:
 * - Kho nhập (INVENTORY)
 * - Kho thanh lý (CLEARANCE)
 * - Kiểm kê, thanh lý, tiêu hủy theo lô (Batch)
 */
@RestController
@RequestMapping("/api/v1/warehouse")
@RequiredArgsConstructor
public class WarehouseController {

    private final WarehouseService warehouseService;

    // ================================================================
    // Danh sách các Lô
    // ================================================================

    /**
     * GET /api/v1/warehouse/inventory
     * Lấy danh sách các lô ở kho nhập (INVENTORY)
     */
    @GetMapping("/inventory")
    @PreAuthorize("hasAnyRole('ADMIN', 'INVENTORY_STAFF')")
    public ResponseEntity<List<InventoryBatchResponse>> getInventoryBatches(
            @RequestParam(required = false) String productStatus,
            @RequestParam(required = false) Integer qualityMin,
            @RequestParam(required = false) Integer qualityMax) {
        return ResponseEntity.ok(warehouseService.getInventoryBatches(productStatus, qualityMin, qualityMax));
    }

    /**
     * GET /api/v1/warehouse/clearance
     * Lấy danh sách các lô ở kho thanh lý (CLEARANCE)
     */
    @GetMapping("/clearance")
    @PreAuthorize("hasAnyRole('ADMIN', 'INVENTORY_STAFF')")
    public ResponseEntity<List<InventoryBatchResponse>> getClearanceBatches(
            @RequestParam(required = false) String productStatus,
            @RequestParam(required = false) Integer qualityMin,
            @RequestParam(required = false) Integer qualityMax) {
        return ResponseEntity.ok(warehouseService.getClearanceBatches(productStatus, qualityMin, qualityMax));
    }

    /**
     * GET /api/v1/warehouse/variants/{variantId}/batches
     * Dùng cho TreeTable: Lấy danh sách Lô của 1 Variant
     */
    @GetMapping("/variants/{variantId}/batches")
    @PreAuthorize("hasAnyRole('ADMIN', 'INVENTORY_STAFF')")
    public ResponseEntity<List<InventoryBatchResponse>> getBatchesByVariant(@PathVariable UUID variantId) {
        return ResponseEntity.ok(warehouseService.getBatchesByVariant(variantId));
    }

    // ================================================================
    // Thao tác trên Lô (Batch)
    // ================================================================

    /**
     * PUT /api/v1/warehouse/batches/{id}/inspect
     * Kiểm kê 1 phần hoặc toàn bộ lô
     */
    @PutMapping("/batches/{id}/inspect")
    @PreAuthorize("hasAnyRole('ADMIN', 'INVENTORY_STAFF')")
    public ResponseEntity<InventoryBatchResponse> inspectBatch(
            @PathVariable UUID id,
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody InspectRequest request) {
        return ResponseEntity.ok(warehouseService.inspectBatch(id, userDetails.getId(), request));
    }

    /**
     * PUT /api/v1/warehouse/batches/{id}/adjust
     * Điều chỉnh chất lượng lô hàng (Tự động merge nếu có lô tương tự)
     */
    @PutMapping("/batches/{id}/adjust")
    @PreAuthorize("hasAnyRole('ADMIN', 'INVENTORY_STAFF')")
    public ResponseEntity<InventoryBatchResponse> adjustBatch(
            @PathVariable UUID id,
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody AdjustRequest request) {
        return ResponseEntity.ok(warehouseService.adjustBatch(id, userDetails.getId(), request));
    }

    /**
     * POST /api/v1/warehouse/batches/{id}/clearance
     * Thanh lý 1 phần hoặc toàn bộ lô
     */
    @PostMapping("/batches/{id}/clearance")
    @PreAuthorize("hasAnyRole('ADMIN', 'INVENTORY_STAFF')")
    public ResponseEntity<InventoryBatchResponse> clearanceBatch(
            @PathVariable UUID id,
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody ClearanceRequest request) {
        return ResponseEntity.ok(warehouseService.clearanceBatch(id, userDetails.getId(), request));
    }

    /**
     * PUT /api/v1/warehouse/batches/{id}/clearance-price
     * Cập nhật giá thanh lý cho lô hàng
     */
    @PutMapping("/batches/{id}/clearance-price")
    @PreAuthorize("hasAnyRole('ADMIN', 'INVENTORY_STAFF')")
    public ResponseEntity<InventoryBatchResponse> updateClearancePrice(
            @PathVariable UUID id,
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody com.shoes.dto.ClearancePriceRequest request) {
        return ResponseEntity.ok(warehouseService.updateClearancePrice(id, userDetails.getId(), request));
    }

    /**
     * POST /api/v1/warehouse/batches/{id}/image
     * Upload ảnh chụp thực tế cho lô hàng thanh lý
     */
    @PostMapping("/batches/{id}/image")
    @PreAuthorize("hasAnyRole('ADMIN', 'INVENTORY_STAFF')")
    public ResponseEntity<InventoryBatchResponse> uploadBatchImage(
            @PathVariable UUID id,
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file) {
        return ResponseEntity.ok(warehouseService.uploadBatchImage(id, userDetails.getId(), file));
    }

    /**
     * POST /api/v1/warehouse/batches/{id}/dispose
     * Đánh dấu lô là DISPOSED
     */
    @PostMapping("/batches/{id}/dispose")
    @PreAuthorize("hasAnyRole('ADMIN', 'INVENTORY_STAFF')")
    public ResponseEntity<InventoryBatchResponse> disposeBatch(
            @PathVariable UUID id,
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody DisposeRequest request) {
        return ResponseEntity.ok(warehouseService.disposeBatch(id, userDetails.getId(), request.getDisposedReason()));
    }

    /**
     * POST /api/v1/warehouse/batches/{id}/restore
     * Phục hồi lô hàng bị tiêu hủy
     */
    @PostMapping("/batches/{id}/restore")
    @PreAuthorize("hasAnyRole('ADMIN', 'INVENTORY_STAFF')")
    public ResponseEntity<InventoryBatchResponse> restoreBatch(
            @PathVariable UUID id,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(warehouseService.restoreBatch(id, userDetails.getId()));
    }
    /**
     * POST /api/v1/warehouse/batches/{id}/revert-clearance
     * Phục hồi lô hàng từ kho thanh lý về kho nhập
     */
    @PostMapping("/batches/{id}/revert-clearance")
    @PreAuthorize("hasAnyRole('ADMIN', 'INVENTORY_STAFF')")
    public ResponseEntity<InventoryBatchResponse> revertClearance(
            @PathVariable UUID id,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(warehouseService.revertClearance(id, userDetails.getId()));
    }
}
