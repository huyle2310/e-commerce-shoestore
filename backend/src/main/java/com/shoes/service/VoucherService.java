package com.shoes.service;

import com.shoes.dto.VoucherRequest;
import com.shoes.dto.VoucherResponse;

import java.util.List;
import java.util.UUID;

public interface VoucherService {
    List<VoucherResponse> getAllVouchers();
    VoucherResponse getVoucherById(UUID id);
    VoucherResponse createVoucher(VoucherRequest request);
    VoucherResponse updateVoucher(UUID id, VoucherRequest request);
    void deleteVoucher(UUID id);
    VoucherResponse checkVoucher(String code, java.math.BigDecimal orderTotal, java.util.UUID userId);
    List<VoucherResponse> getAvailableVouchers(UUID userId);
    List<VoucherResponse> getMyVouchers(UUID userId);
    VoucherResponse claimVoucher(String code, UUID userId);
}
