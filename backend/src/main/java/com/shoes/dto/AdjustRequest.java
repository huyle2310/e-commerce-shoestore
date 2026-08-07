package com.shoes.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AdjustRequest {

    @NotNull(message = "Số lượng không được để trống")
    @Min(value = 1, message = "Số lượng phải lớn hơn 0")
    private Integer quantity;

    @NotNull(message = "Chất lượng sản phẩm không được để trống")
    @Min(value = 0, message = "Chất lượng tối thiểu là 0%")
    @Max(value = 100, message = "Chất lượng tối đa là 100%")
    private Integer qualityPercentage;

    private String note;
}
