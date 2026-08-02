package com.shoes.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BannerResponse {
    private Integer id;
    private String titleVi;
    private String titleEn;
    private String imageUrl;
    private String targetUrl;
    private String position;
    private Boolean isActive;
    private LocalDateTime createdAt;
}
