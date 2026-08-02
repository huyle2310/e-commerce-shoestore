package com.shoes.service.impl;

import com.shoes.dto.InventoryReceiptItemRequest;
import com.shoes.dto.InventoryReceiptItemResponse;
import com.shoes.dto.InventoryReceiptRequest;
import com.shoes.dto.InventoryReceiptResponse;
import com.shoes.entity.*;
import com.shoes.repository.InventoryReceiptItemRepository;
import com.shoes.repository.InventoryReceiptRepository;
import com.shoes.repository.ProductVariantRepository;
import com.shoes.repository.UserRepository;
import com.shoes.service.InventoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
                .createdBy(user)
                .items(new ArrayList<>())
                .build();

        for (InventoryReceiptItemRequest itemReq : request.getItems()) {
            ProductVariant variant = variantRepository.findById(itemReq.getVariantId())
                    .orElseThrow(() -> new RuntimeException("Variant not found: " + itemReq.getVariantId()));

            InventoryReceiptItem item = InventoryReceiptItem.builder()
                    .receipt(receipt)
                    .variant(variant)
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

        for (InventoryReceiptItem item : receipt.getItems()) {
            ProductVariant variant = item.getVariant();
            if ("IMPORT".equals(receipt.getReceiptType())) {
                variant.setStockQuantity(variant.getStockQuantity() + item.getActualQuantity());
            } else if ("AUDIT".equals(receipt.getReceiptType())) {
                variant.setStockQuantity(item.getActualQuantity());
            }
            variantRepository.save(variant);
        }

        return mapToResponse(receiptRepository.save(receipt));
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
                .productName(item.getVariant().getProduct().getNameVi())
                .sku(item.getVariant().getSku())
                .color(item.getVariant().getColorVi())
                .size(item.getVariant().getSize())
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
                .createdBy(receipt.getCreatedBy() != null ? receipt.getCreatedBy().getFullName() : "System")
                .createdAt(receipt.getCreatedAt())
                .updatedAt(receipt.getUpdatedAt())
                .items(items)
                .build();
    }
}
