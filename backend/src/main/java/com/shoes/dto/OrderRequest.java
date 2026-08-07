package com.shoes.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.List;

@Data
public class OrderRequest {

    @NotBlank
    private String fullName;

    @NotBlank
    private String phone;

    @NotBlank
    private String shippingAddress;

    /**
     * Tỉnh/thành phố để backend tự tính phí ship.
     * Frontend chỉ gửi tên tỉnh/thành, KHÔNG gửi shippingFee.
     * VD: "Hồ Chí Minh", "Hà Nội", "Đà Nẵng"
     */
    private String province;

    private String orderNote;

    @NotBlank
    private String paymentMethod; // 'COD', 'SEPAY', 'MOMO'

    private String voucherCode;

    private String email; // optional – dùng cho guest

    /** Dùng khi Buy Now hoặc Guest checkout */
    private List<GuestOrderItemRequest> items;
}
