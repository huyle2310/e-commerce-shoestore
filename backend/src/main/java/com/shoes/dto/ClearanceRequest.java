package com.shoes.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.math.BigDecimal;

/**
 * Request body cho API thanh lý sản phẩm.
 * POST /api/v1/warehouse/variants/{id}/clearance
 */
@Data
public class ClearanceRequest {

    @NotNull(message = "Giá thanh lý không được để trống")
    @DecimalMin(value = "0.01", message = "Giá thanh lý phải lớn hơn 0")
    private BigDecimal clearancePrice;


    /** Số lượng muốn thanh lý (nếu null = toàn bộ) */
    private Integer quantity;
}
