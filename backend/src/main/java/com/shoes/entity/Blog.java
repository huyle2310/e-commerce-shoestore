package com.shoes.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "blogs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Blog {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id")
    private User author;

    @Column(name = "title_vi", nullable = false)
    private String titleVi;

    @Column(name = "title_en", nullable = false)
    private String titleEn;

    @Column(nullable = false, unique = true)
    private String slug;

    @Column(name = "thumbnail_url", columnDefinition = "TEXT")
    private String thumbnailUrl;

    @Column(name = "content_vi", nullable = false, columnDefinition = "TEXT")
    private String contentVi;

    @Column(name = "content_en", nullable = false, columnDefinition = "TEXT")
    private String contentEn;

    @Column(name = "short_description_vi", columnDefinition = "TEXT")
    private String shortDescriptionVi;

    @Column(name = "short_description_en", columnDefinition = "TEXT")
    private String shortDescriptionEn;

    @Column(name = "is_featured")
    private Boolean isFeatured;

    @Column(name = "view_count")
    private Integer viewCount;

    @Column(name = "tags")
    private String tags;

    @Column(name = "is_published")
    private Boolean isPublished;

    @Column(name = "seo_title_vi")
    private String seoTitleVi;

    @Column(name = "seo_title_en")
    private String seoTitleEn;

    @Column(name = "seo_description_vi", columnDefinition = "TEXT")
    private String seoDescriptionVi;

    @Column(name = "seo_description_en", columnDefinition = "TEXT")
    private String seoDescriptionEn;

    @Column(name = "published_at")
    private LocalDateTime publishedAt;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (isPublished == null) isPublished = false;
        if (isFeatured == null) isFeatured = false;
        if (viewCount == null) viewCount = 0;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
