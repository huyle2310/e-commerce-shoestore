package com.shoes.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class BannerRequest {
    @NotBlank(message = "Title (VI) is required")
    private String titleVi;

    @NotBlank(message = "Title (EN) is required")
    private String titleEn;

    @NotBlank(message = "Image URL is required")
    private String imageUrl;

    private String targetUrl;

    @NotBlank(message = "Position is required")
    private String position;

    private Boolean isActive;
}
