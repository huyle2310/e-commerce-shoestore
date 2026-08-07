package com.shoes.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.time.LocalDate;

/**
 * Request body cho API kiểm kê sản phẩm.
 * PUT /api/v1/warehouse/variants/{id}/inspect
 */
@Data
public class InspectRequest {

    @NotNull(message = "Chất lượng sản phẩm không được để trống")
    @Min(value = 0, message = "Chất lượng tối thiểu là 0%")
    @Max(value = 100, message = "Chất lượng tối đa là 100%")
    private Integer qualityPercentage;

    private String conditionNote;

    private LocalDate inspectionDate;

    /** Số lượng muốn kiểm kê (nếu null = toàn bộ) */
    private Integer quantity;
}
