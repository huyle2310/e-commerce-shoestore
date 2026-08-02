package com.shoes.service;

import com.shoes.dto.InventoryReceiptRequest;
import com.shoes.dto.InventoryReceiptResponse;
import java.util.List;
import java.util.UUID;

public interface InventoryService {
    List<InventoryReceiptResponse> getAllReceipts(String type);
    InventoryReceiptResponse getReceiptById(UUID id);
    InventoryReceiptResponse createReceipt(UUID userId, InventoryReceiptRequest request);
    InventoryReceiptResponse approveReceipt(UUID id);
    InventoryReceiptResponse cancelReceipt(UUID id);
}
