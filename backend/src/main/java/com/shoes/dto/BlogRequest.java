package com.shoes.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class BlogRequest {
    @NotBlank(message = "Title (VI) is required")
    private String titleVi;

    @NotBlank(message = "Title (EN) is required")
    private String titleEn;

    @NotBlank(message = "Slug is required")
    private String slug;

    private String thumbnailUrl;

    @NotBlank(message = "Content (VI) is required")
    private String contentVi;

    @NotBlank(message = "Content (EN) is required")
    private String contentEn;

    private String shortDescriptionVi;
    private String shortDescriptionEn;
    private Boolean isFeatured;
    private String tags;

    private Boolean isPublished;

    private String seoTitleVi;
    private String seoTitleEn;
    private String seoDescriptionVi;
    private String seoDescriptionEn;
    private java.time.LocalDateTime publishedAt;
}
