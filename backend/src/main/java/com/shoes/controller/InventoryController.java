package com.shoes.controller;

import com.shoes.dto.InventoryReceiptRequest;
import com.shoes.dto.InventoryReceiptResponse;
import com.shoes.security.CustomUserDetails;
import com.shoes.service.InventoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/inventory")
@RequiredArgsConstructor
public class InventoryController {

    private final InventoryService inventoryService;

    @GetMapping("/receipts")
    @PreAuthorize("hasAnyRole('ADMIN', 'INVENTORY_STAFF')")
    public ResponseEntity<List<InventoryReceiptResponse>> getAllReceipts(@RequestParam(required = false) String type) {
        return ResponseEntity.ok(inventoryService.getAllReceipts(type));
    }

    @GetMapping("/receipts/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'INVENTORY_STAFF')")
    public ResponseEntity<InventoryReceiptResponse> getReceiptById(@PathVariable UUID id) {
        return ResponseEntity.ok(inventoryService.getReceiptById(id));
    }

    @PostMapping("/receipts")
    @PreAuthorize("hasAnyRole('ADMIN', 'INVENTORY_STAFF')")
    public ResponseEntity<InventoryReceiptResponse> createReceipt(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody InventoryReceiptRequest request) {
        return ResponseEntity.ok(inventoryService.createReceipt(userDetails.getId(), request));
    }

    @PutMapping("/receipts/{id}/approve")
    @PreAuthorize("hasAnyRole('ADMIN', 'INVENTORY_STAFF')")
    public ResponseEntity<InventoryReceiptResponse> approveReceipt(@PathVariable UUID id) {
        return ResponseEntity.ok(inventoryService.approveReceipt(id));
    }

    @PutMapping("/receipts/{id}/cancel")
    @PreAuthorize("hasAnyRole('ADMIN', 'INVENTORY_STAFF')")
    public ResponseEntity<InventoryReceiptResponse> cancelReceipt(@PathVariable UUID id) {
        return ResponseEntity.ok(inventoryService.cancelReceipt(id));
    }
}
