package com.shoes.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class OrderRequest {
    @NotBlank
    private String fullName;
    @NotBlank
    private String phone;
    @NotBlank
    private String shippingAddress;
    
    private String orderNote;
    
    @NotBlank
    private String paymentMethod; // 'COD', 'VNPAY', 'MOMO'

    private String voucherCode;
    
    private java.math.BigDecimal shippingFee;
    
    private String email; // optional for guest
    
    private java.util.List<GuestOrderItemRequest> items; // for guest checkout
}
