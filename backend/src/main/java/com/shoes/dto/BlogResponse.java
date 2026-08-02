package com.shoes.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class BlogResponse {
    private UUID id;
    private String titleVi;
    private String titleEn;
    private String slug;
    private String thumbnailUrl;
    private String contentVi;
    private String contentEn;
    private String shortDescriptionVi;
    private String shortDescriptionEn;
    private Boolean isFeatured;
    private Integer viewCount;
    private String tags;
    private Boolean isPublished;
    private String authorName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String seoTitleVi;
    private String seoTitleEn;
    private String seoDescriptionVi;
    private String seoDescriptionEn;
    private LocalDateTime publishedAt;
}
