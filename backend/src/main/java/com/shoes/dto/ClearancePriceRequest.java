package com.shoes.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class ClearancePriceRequest {
    @NotNull(message = "Giá thanh lý không được để trống")
    @DecimalMin(value = "0.01", message = "Giá thanh lý phải lớn hơn 0")
    private BigDecimal clearancePrice;
}
