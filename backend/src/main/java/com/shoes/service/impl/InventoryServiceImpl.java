package com.shoes.service.impl;

import com.shoes.dto.InventoryReceiptItemRequest;
import com.shoes.dto.InventoryReceiptItemResponse;
import com.shoes.dto.InventoryReceiptRequest;
import com.shoes.dto.InventoryReceiptResponse;
import com.shoes.entity.*;
import com.shoes.repository.InventoryBatchRepository;
import com.shoes.repository.InventoryReceiptItemRepository;
import com.shoes.repository.InventoryReceiptRepository;
import com.shoes.repository.ProductVariantRepository;
import com.shoes.repository.UserRepository;
import com.shoes.service.InventoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InventoryServiceImpl implements InventoryService {

    private final InventoryReceiptRepository receiptRepository;
    private final InventoryReceiptItemRepository itemRepository;
    private final ProductVariantRepository variantRepository;
    private final UserRepository userRepository;
    private final InventoryBatchRepository batchRepository;

    @Override
    public List<InventoryReceiptResponse> getAllReceipts(String type) {
        List<InventoryReceipt> receipts;
        if (type != null && !type.isEmpty()) {
            receipts = receiptRepository.findByReceiptTypeOrderByCreatedAtDesc(type.toUpperCase());
        } else {
            receipts = receiptRepository.findAll();
        }
        return receipts.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    public InventoryReceiptResponse getReceiptById(UUID id) {
        return receiptRepository.findById(id)
                .map(this::mapToResponse)
                .orElseThrow(() -> new RuntimeException("Receipt not found"));
    }

    @Override
    @Transactional
    public InventoryReceiptResponse createReceipt(UUID userId, InventoryReceiptRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        InventoryReceipt receipt = InventoryReceipt.builder()
                .receiptType(request.getReceiptType().toUpperCase())
                .status("PENDING")
                .note(request.getNote())
                .supplierName(request.getSupplierName())
                .createdBy(user)
                .items(new ArrayList<>())
                .build();

        for (InventoryReceiptItemRequest itemReq : request.getItems()) {
            ProductVariant variant = variantRepository.findById(itemReq.getVariantId())
                    .orElseThrow(() -> new RuntimeException("Variant not found: " + itemReq.getVariantId()));

            InventoryReceiptItem item = InventoryReceiptItem.builder()
                    .receipt(receipt)
                    .variant(variant)
                    .productName(variant.getProduct() != null ? variant.getProduct().getNameVi() : null)
                    .sku(variant.getSku())
                    .color(variant.getColorVi())
                    .size(variant.getSize())
                    .expectedQuantity(itemReq.getExpectedQuantity() != null ? itemReq.getExpectedQuantity() : variant.getStockQuantity())
                    .actualQuantity(itemReq.getActualQuantity())
                    .importPrice(itemReq.getImportPrice())
                    .build();

            receipt.getItems().add(item);
        }

        return mapToResponse(receiptRepository.save(receipt));
    }

    @Override
    @Transactional
    public InventoryReceiptResponse approveReceipt(UUID id) {
        InventoryReceipt receipt = receiptRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Receipt not found"));

        if (!"PENDING".equals(receipt.getStatus())) {
            throw new RuntimeException("Receipt is already processed");
        }

        receipt.setStatus("COMPLETED");
        receipt = receiptRepository.save(receipt);

        int batchCounter = 1;
        for (InventoryReceiptItem item : receipt.getItems()) {
            ProductVariant variant = item.getVariant();
            if ("IMPORT".equals(receipt.getReceiptType())) {
                // Sinh Batch mới
                InventoryBatch batch = InventoryBatch.builder()
                        .batchCode(receipt.getReferenceCode() + "-" + String.format("%03d", batchCounter++))
                        .variant(variant)
                        .receiptItem(item)
                        .quantity(item.getActualQuantity())
                        .warehouseType(WarehouseType.INVENTORY)
                        .productStatus(ProductStatus.ACTIVE)
                        .qualityPercentage(100)
                        .importDate(LocalDateTime.now())
                        .importPrice(item.getImportPrice())
                        .build();
                batchRepository.save(batch);

            } else if ("AUDIT".equals(receipt.getReceiptType())) {
                int diff = item.getActualQuantity() - item.getExpectedQuantity();
                if (diff > 0) {
                    // Dư thừa -> Sinh lô điều chỉnh
                    InventoryBatch batch = InventoryBatch.builder()
                            .batchCode("ADJ-" + receipt.getReferenceCode() + "-" + String.format("%03d", batchCounter++))
                            .variant(variant)
                            .receiptItem(item)
                            .quantity(diff)
                            .warehouseType(WarehouseType.INVENTORY)
                            .productStatus(ProductStatus.ACTIVE)
                            .qualityPercentage(100)
                            .importDate(LocalDateTime.now())
                            .conditionNote("Lô sinh ra từ phiếu điều chỉnh kho: " + receipt.getReferenceCode())
                            .build();
                    batchRepository.save(batch);
                } else if (diff < 0) {
                    // Mất mát -> Trừ từ các lô cũ nhất
                    int remainingToDeduct = Math.abs(diff);
                    List<InventoryBatch> activeBatches = batchRepository.findActiveBatchesForDeduction(variant.getId());
                    for (InventoryBatch b : activeBatches) {
                        if (remainingToDeduct <= 0) break;
                        int deductAmount = Math.min(b.getQuantity(), remainingToDeduct);
                        b.setQuantity(b.getQuantity() - deductAmount);
                        b.setConditionNote((b.getConditionNote() != null ? b.getConditionNote() + " | " : "") + "Trừ hao hụt từ phiếu " + receipt.getReferenceCode());
                        batchRepository.save(b);
                        remainingToDeduct -= deductAmount;
                    }
                }
            }
            
            // Cập nhật lại derived field stockQuantity của Variant
            Integer totalActiveStock = batchRepository.sumActiveStockByVariantId(variant.getId());
            variant.setStockQuantity(totalActiveStock != null ? totalActiveStock : 0);
            variantRepository.save(variant);
        }

        return mapToResponse(receipt);
    }

    @Override
    @Transactional
    public InventoryReceiptResponse cancelReceipt(UUID id) {
        InventoryReceipt receipt = receiptRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Receipt not found"));

        if (!"PENDING".equals(receipt.getStatus())) {
            throw new RuntimeException("Receipt is already processed and cannot be cancelled");
        }

        receipt.setStatus("CANCELLED");
        return mapToResponse(receiptRepository.save(receipt));
    }

    private InventoryReceiptResponse mapToResponse(InventoryReceipt receipt) {
        List<InventoryReceiptItemResponse> items = receipt.getItems().stream().map(item -> 
            InventoryReceiptItemResponse.builder()
                .id(item.getId())
                .variantId(item.getVariant().getId())
                .productName(item.getProductName() != null ? item.getProductName() : (item.getVariant().getProduct() != null ? item.getVariant().getProduct().getNameVi() : "N/A"))
                .sku(item.getSku() != null ? item.getSku() : item.getVariant().getSku())
                .color(item.getColor() != null ? item.getColor() : item.getVariant().getColorVi())
                .size(item.getSize() != null ? item.getSize() : item.getVariant().getSize())
                .expectedQuantity(item.getExpectedQuantity())
                .actualQuantity(item.getActualQuantity())
                .importPrice(item.getImportPrice())
                .build()
        ).collect(Collectors.toList());

        return InventoryReceiptResponse.builder()
                .id(receipt.getId())
                .receiptType(receipt.getReceiptType())
                .referenceCode(receipt.getReferenceCode())
                .status(receipt.getStatus())
                .note(receipt.getNote())
                .supplierName(receipt.getSupplierName())
                .createdBy(receipt.getCreatedBy() != null ? receipt.getCreatedBy().getFullName() : "System")
                .createdAt(receipt.getCreatedAt())
                .updatedAt(receipt.getUpdatedAt())
                .items(items)
                .build();
    }
}
