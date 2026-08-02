package com.shoes.controller;

import com.shoes.dto.VoucherRequest;
import com.shoes.dto.VoucherResponse;
import com.shoes.service.VoucherService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/vouchers")
@RequiredArgsConstructor
@CrossOrigin("*")
public class VoucherController {

    private final VoucherService voucherService;

    // --- Admin APIs ---
    @GetMapping("/admin")
    public ResponseEntity<List<VoucherResponse>> getAllVouchers() {
        return ResponseEntity.ok(voucherService.getAllVouchers());
    }

    @PostMapping("/admin")
    public ResponseEntity<VoucherResponse> createVoucher(@RequestBody VoucherRequest request) {
        return ResponseEntity.ok(voucherService.createVoucher(request));
    }

    @PutMapping("/admin/{id}")
    public ResponseEntity<VoucherResponse> updateVoucher(@PathVariable UUID id, @RequestBody VoucherRequest request) {
        return ResponseEntity.ok(voucherService.updateVoucher(id, request));
    }

    @DeleteMapping("/admin/{id}")
    public ResponseEntity<Void> deleteVoucher(@PathVariable UUID id) {
        voucherService.deleteVoucher(id);
        return ResponseEntity.ok().build();
    }

    // --- Public APIs ---
    @GetMapping("/check")
    public ResponseEntity<VoucherResponse> checkVoucher(
            @RequestParam String code, 
            @RequestParam(required = false) BigDecimal orderTotal,
            @org.springframework.security.core.annotation.AuthenticationPrincipal com.shoes.security.CustomUserDetails userDetails) {
        UUID userId = userDetails != null ? userDetails.getId() : null;
        return ResponseEntity.ok(voucherService.checkVoucher(code, orderTotal, userId));
    }

    @GetMapping("/available")
    public ResponseEntity<List<VoucherResponse>> getAvailableVouchers(
            @org.springframework.security.core.annotation.AuthenticationPrincipal com.shoes.security.CustomUserDetails userDetails) {
        if (userDetails == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(voucherService.getAvailableVouchers(userDetails.getId()));
    }

    @GetMapping("/my-vouchers")
    public ResponseEntity<List<VoucherResponse>> getMyVouchers(
            @org.springframework.security.core.annotation.AuthenticationPrincipal com.shoes.security.CustomUserDetails userDetails) {
        if (userDetails == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(voucherService.getMyVouchers(userDetails.getId()));
    }

    @PostMapping("/claim")
    public ResponseEntity<VoucherResponse> claimVoucher(
            @RequestParam String code,
            @org.springframework.security.core.annotation.AuthenticationPrincipal com.shoes.security.CustomUserDetails userDetails) {
        if (userDetails == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(voucherService.claimVoucher(code, userDetails.getId()));
    }
}
