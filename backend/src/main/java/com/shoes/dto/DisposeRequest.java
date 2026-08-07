package com.shoes.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * Request body cho API tiêu hủy sản phẩm.
 * POST /api/v1/warehouse/variants/{id}/dispose
 */
@Data
public class DisposeRequest {

    @NotBlank(message = "Lý do tiêu hủy không được để trống")
    private String disposedReason;
}
