package com.shoes.service.impl;

import com.shoes.dto.AdjustRequest;
import com.shoes.dto.ClearanceRequest;
import com.shoes.dto.InspectRequest;
import com.shoes.dto.InventoryBatchResponse;
import com.shoes.dto.ClearancePriceRequest;
import com.shoes.entity.*;
import com.shoes.repository.InventoryBatchRepository;
import com.shoes.repository.ProductVariantRepository;
import com.shoes.repository.UserRepository;
import com.shoes.service.WarehouseService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WarehouseServiceImpl implements WarehouseService {

    private final InventoryBatchRepository batchRepository;
    private final ProductVariantRepository variantRepository;
    private final UserRepository userRepository;
    private final com.shoes.service.FileService fileService;

    @Override
    public List<InventoryBatchResponse> getInventoryBatches(String productStatus, Integer qualityMin,
            Integer qualityMax) {
        // Lấy toàn bộ batch INVENTORY, ACTIVE, quantity > 0
        // (Có thể thêm filter theo tham số sau, hiện tại lấy tất cả)
        ProductStatus statusEnum = null;
        if (productStatus != null && !productStatus.isEmpty()) {
            try {
                statusEnum = ProductStatus.valueOf(productStatus.toUpperCase());
            } catch (Exception e) {
            }
        }
        List<InventoryBatch> batches = batchRepository.findInventoryBatches(WarehouseType.INVENTORY, statusEnum);
        return batches.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    public List<InventoryBatchResponse> getClearanceBatches(String productStatus, Integer qualityMin,
            Integer qualityMax) {
        ProductStatus statusEnum = null;
        if (productStatus != null && !productStatus.isEmpty()) {
            try {
                statusEnum = ProductStatus.valueOf(productStatus.toUpperCase());
            } catch (Exception e) {
            }
        }
        List<InventoryBatch> batches = batchRepository.findClearanceBatches(WarehouseType.CLEARANCE, statusEnum);
        return batches.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    public List<InventoryBatchResponse> getBatchesByVariant(UUID variantId) {
        return batchRepository.findByVariantId(variantId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public InventoryBatchResponse inspectBatch(UUID batchId, UUID adminId, InspectRequest request) {
        InventoryBatch batch = findBatch(batchId);

        if (batch.getQuantity() <= 0) {
            throw new RuntimeException("Không thể kiểm kê lô hàng có số lượng = 0.");
        }

        // Nếu request số lượng kiểm kê = toàn bộ số lượng trong lô, hoặc không truyền
        // quantity (mặc định toàn bộ)
        int inspectQty = request.getQuantity() != null ? request.getQuantity() : batch.getQuantity();

        if (inspectQty > batch.getQuantity()) {
            throw new RuntimeException("Số lượng kiểm kê (" + inspectQty + ") không được vượt quá số lượng lô ("
                    + batch.getQuantity() + ")");
        }

        if (inspectQty == batch.getQuantity()) {
            // Đổi chất lượng toàn bộ lô
            batch.setQualityPercentage(request.getQualityPercentage());
            batch.setConditionNote(request.getConditionNote());
            batchRepository.save(batch);
            updateVariantStock(batch.getVariant().getId());
            return mapToResponse(batch);
        } else {
            // Split batch
            // 1. Giảm số lượng lô cũ
            batch.setQuantity(batch.getQuantity() - inspectQty);
            batchRepository.save(batch);

            // 2. Sinh lô mới cho phần kiểm kê
            InventoryBatch splitBatch = InventoryBatch.builder()
                    .batchCode(generateSplitBatchCode(batch.getBatchCode()))
                    .variant(batch.getVariant())
                    .receiptItem(batch.getReceiptItem())
                    .parentBatch(batch)
                    .quantity(inspectQty)
                    .warehouseType(batch.getWarehouseType())
                    .productStatus(batch.getProductStatus())
                    .qualityPercentage(request.getQualityPercentage())
                    .conditionNote(request.getConditionNote())
                    .importDate(batch.getImportDate())
                    .importPrice(batch.getImportPrice())
                    .clearancePrice(batch.getClearancePrice())
                    .build();

            InventoryBatch savedSplit = batchRepository.save(splitBatch);
            updateVariantStock(batch.getVariant().getId());
            return mapToResponse(savedSplit);
        }
    }

    @Override
    @Transactional
    public InventoryBatchResponse clearanceBatch(UUID batchId, UUID adminId, ClearanceRequest request) {
        InventoryBatch batch = findBatch(batchId);

        if (batch.getQuantity() <= 0) {
            throw new RuntimeException("Không thể thanh lý lô hàng có số lượng = 0.");
        }
        if (batch.getWarehouseType() != WarehouseType.INVENTORY) {
            throw new RuntimeException("Chỉ có thể thanh lý lô hàng đang ở kho INVENTORY.");
        }

        int clearanceQty = request.getQuantity() != null ? request.getQuantity() : batch.getQuantity();

        if (clearanceQty > batch.getQuantity()) {
            throw new RuntimeException("Số lượng thanh lý vượt quá số lượng trong lô.");
        }

        if (clearanceQty == batch.getQuantity()) {
            // Đổi kho toàn bộ lô
            batch.setWarehouseType(WarehouseType.CLEARANCE);
            batch.setClearancePrice(request.getClearancePrice());
            batchRepository.save(batch);
            return mapToResponse(batch);
        } else {
            // Split batch
            batch.setQuantity(batch.getQuantity() - clearanceQty);
            batchRepository.save(batch);

            InventoryBatch splitBatch = InventoryBatch.builder()
                    .batchCode(generateSplitBatchCode(batch.getBatchCode()))
                    .variant(batch.getVariant())
                    .receiptItem(batch.getReceiptItem())
                    .parentBatch(batch)
                    .quantity(clearanceQty)
                    .warehouseType(WarehouseType.CLEARANCE)
                    .productStatus(ProductStatus.ACTIVE)
                    .qualityPercentage(batch.getQualityPercentage())
                    .conditionNote(batch.getConditionNote())
                    .importDate(batch.getImportDate())
                    .importPrice(batch.getImportPrice())
                    .clearancePrice(request.getClearancePrice())
                    .build();

            InventoryBatch savedSplit = batchRepository.save(splitBatch);
            // Stock variant không đổi vì chuyển kho vẫn còn bán được
            return mapToResponse(savedSplit);
        }
    }

    @Override
    @Transactional
    public InventoryBatchResponse disposeBatch(UUID batchId, UUID adminId, String reason) {
        InventoryBatch batch = findBatch(batchId);
        batch.setProductStatus(ProductStatus.DISPOSED);
        batch.setConditionNote(
                (batch.getConditionNote() != null ? batch.getConditionNote() + " | " : "") + "Tiêu hủy: " + reason);
        // Không xóa quantity = 0 ngay để còn biết lô này đã từng có bao nhiêu chiếc bị
        // vứt đi.
        // Khi đặt hàng sẽ filter status = ACTIVE nên không lo bán nhầm.
        batchRepository.save(batch);

        updateVariantStock(batch.getVariant().getId());
        return mapToResponse(batch);
    }

    @Override
    @Transactional
    public InventoryBatchResponse restoreBatch(UUID batchId, UUID adminId) {
        InventoryBatch batch = findBatch(batchId);

        if (batch.getProductStatus() != ProductStatus.DISPOSED) {
            throw new RuntimeException("Chỉ có thể phục hồi lô hàng đang ở trạng thái tiêu hủy.");
        }

        batch.setProductStatus(ProductStatus.ACTIVE);

        batch.setConditionNote((batch.getConditionNote() != null ? batch.getConditionNote() + " | " : "")
                + "Phục hồi từ trạng thái Tiêu hủy");
        batchRepository.save(batch);

        updateVariantStock(batch.getVariant().getId());
        return mapToResponse(batch);
    }

    @Override
    @Transactional
    public InventoryBatchResponse revertClearance(UUID batchId, UUID adminId) {
        InventoryBatch batch = findBatch(batchId);

        if (batch.getWarehouseType() != WarehouseType.CLEARANCE) {
            throw new RuntimeException("Lô hàng không ở kho thanh lý.");
        }
        if (batch.getProductStatus() != ProductStatus.ACTIVE) {
            throw new RuntimeException("Chỉ có thể phục hồi lô hàng đang hoạt động.");
        }

        batch.setWarehouseType(WarehouseType.INVENTORY);
        batch.setClearancePrice(null);
        batch.setImageUrl(null);
        batch.setConditionNote((batch.getConditionNote() != null ? batch.getConditionNote() + " | " : "")
                + "Phục hồi từ Kho thanh lý về Kho nhập");
        batchRepository.save(batch);

        return mapToResponse(batch);
    }

    private InventoryBatch findBatch(UUID id) {
        return batchRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy lô hàng"));
    }

    /**
     * Cập nhật lại derived field stockQuantity của Variant
     */
    private void updateVariantStock(UUID variantId) {
        ProductVariant variant = variantRepository.findById(variantId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Variant"));
        Integer totalActiveStock = batchRepository.sumActiveStockByVariantId(variantId);
        variant.setStockQuantity(totalActiveStock != null ? totalActiveStock : 0);
        variantRepository.save(variant);
    }

    private String generateSplitBatchCode(String parentCode) {
        String suffix = "-" + java.util.UUID.randomUUID().toString().substring(0, 4).toUpperCase();
        if (parentCode.length() + suffix.length() > 50) {
            parentCode = parentCode.substring(0, 50 - suffix.length());
        }
        return parentCode + suffix;
    }

    private InventoryBatchResponse mapToResponse(InventoryBatch batch) {
        ProductVariant v = batch.getVariant();
        Product p = v.getProduct();

        return InventoryBatchResponse.builder()
                .id(batch.getId())
                .batchCode(batch.getBatchCode())
                .quantity(batch.getQuantity())
                .warehouseType(batch.getWarehouseType() != null ? batch.getWarehouseType().name() : null)
                .productStatus(batch.getProductStatus() != null ? batch.getProductStatus().name() : null)
                .receiptItemId(batch.getReceiptItem() != null ? batch.getReceiptItem().getId() : null)
                .parentBatchId(batch.getParentBatch() != null ? batch.getParentBatch().getId() : null)

                .variantId(v.getId())
                .sku(v.getSku())
                .colorVi(v.getColorVi())
                .colorEn(v.getColorEn())
                .size(v.getSize())
                .priceModifier(v.getPriceModifier())

                .productId(p.getId())
                .productNameVi(p.getNameVi())
                .productNameEn(p.getNameEn())
                .productSlug(p.getSlug())
                .basePrice(p.getBasePrice())
                .primaryImageUrl(
                        p.getImages() != null && !p.getImages().isEmpty() ? p.getImages().get(0).getImageUrl() : null)

                .qualityPercentage(batch.getQualityPercentage())
                .conditionNote(batch.getConditionNote())
                .clearancePrice(batch.getClearancePrice())
                .imageUrl(batch.getImageUrl())
                .importDate(batch.getImportDate())
                .importPrice(batch.getImportPrice())
                .build();
    }

    @Override
    @Transactional
    public InventoryBatchResponse adjustBatch(UUID id, UUID adminId, AdjustRequest request) {
        InventoryBatch batch = batchRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy lô hàng"));

        int adjustQty = request.getQuantity();
        int newQuality = request.getQualityPercentage();

        if (adjustQty <= 0) {
            throw new RuntimeException("Số lượng điều chỉnh phải lớn hơn 0");
        }
        if (adjustQty > batch.getQuantity()) {
            throw new RuntimeException("Số lượng điều chỉnh (" + adjustQty + ") không được vượt quá số lượng lô ("
                    + batch.getQuantity() + ")");
        }

        // Nếu chất lượng không đổi, chỉ trả về
        if (batch.getQualityPercentage() != null && newQuality == batch.getQualityPercentage()) {
            return mapToResponse(batch);
        }

        // 1. Trừ số lượng khỏi lô nguồn
        batch.setQuantity(batch.getQuantity() - adjustQty);
        batchRepository.save(batch);

        // 2. Tìm lô hàng để merge (Cùng Variant, Cùng Kho INVENTORY, Trạng thái ACTIVE,
        // Cùng chất lượng)
        List<InventoryBatch> candidates = batchRepository
                .findByVariantIdAndWarehouseTypeAndProductStatusOrderByImportDateAsc(
                        batch.getVariant().getId(), WarehouseType.INVENTORY, ProductStatus.ACTIVE);

        InventoryBatch targetBatch = candidates.stream()
                .filter(b -> b.getQualityPercentage() != null && b.getQualityPercentage() == newQuality
                        && !b.getId().equals(batch.getId()))
                .findFirst()
                .orElse(null);

        if (targetBatch != null) {
            // Tự động merge
            targetBatch.setQuantity(targetBatch.getQuantity() + adjustQty);
            batchRepository.save(targetBatch);
            // Stock variant không đổi vì tổng tồn ACTIVE không đổi
            return mapToResponse(targetBatch);
        } else {
            // 3. Không có thì tạo lô mới
            InventoryBatch newBatch = InventoryBatch.builder()
                    .batchCode(generateSplitBatchCode(batch.getBatchCode()))
                    .variant(batch.getVariant())
                    .receiptItem(batch.getReceiptItem())
                    .parentBatch(batch)
                    .quantity(adjustQty)
                    .warehouseType(WarehouseType.INVENTORY)
                    .productStatus(ProductStatus.ACTIVE)
                    .qualityPercentage(newQuality)
                    .conditionNote("Điều chỉnh chất lượng từ lô: " + batch.getBatchCode())
                    .importDate(batch.getImportDate())
                    .importPrice(batch.getImportPrice())
                    .clearancePrice(batch.getClearancePrice())
                    .build();

            InventoryBatch saved = batchRepository.save(newBatch);
            return mapToResponse(saved);
        }
    }

    @Override
    @Transactional
    public InventoryBatchResponse updateClearancePrice(UUID id, UUID adminId, ClearancePriceRequest request) {
        InventoryBatch batch = batchRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy lô hàng"));

        if (batch.getWarehouseType() != WarehouseType.CLEARANCE) {
            throw new RuntimeException("Chỉ có thể cập nhật giá cho lô hàng trong kho thanh lý");
        }

        batch.setClearancePrice(request.getClearancePrice());
        return mapToResponse(batchRepository.save(batch));
    }

    @Override
    @Transactional
    public InventoryBatchResponse uploadBatchImage(UUID id, UUID adminId,
            org.springframework.web.multipart.MultipartFile file) {
        InventoryBatch batch = batchRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy lô hàng"));

        if (batch.getWarehouseType() != WarehouseType.CLEARANCE) {
            throw new RuntimeException("Chỉ có thể cập nhật ảnh cho lô hàng trong kho thanh lý");
        }

        String imageUrl = fileService.uploadFile(file);
        batch.setImageUrl(imageUrl);
        return mapToResponse(batchRepository.save(batch));
    }
}
