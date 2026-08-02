package com.shoes.service.impl;

import com.shoes.dto.BlogRequest;
import com.shoes.dto.BlogResponse;
import com.shoes.entity.Blog;
import com.shoes.entity.User;
import com.shoes.repository.BlogRepository;
import com.shoes.repository.UserRepository;
import com.shoes.service.BlogService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BlogServiceImpl implements BlogService {

    private final BlogRepository blogRepository;
    private final UserRepository userRepository;

    @Override
    public List<BlogResponse> getAllBlogs() {
        return blogRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<BlogResponse> getPublishedBlogs() {
        return blogRepository.findByIsPublishedTrueOrderByCreatedAtDesc().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public BlogResponse getBlogById(UUID id) {
        Blog blog = blogRepository.findById(id).orElseThrow(() -> new RuntimeException("Blog not found"));
        return mapToResponse(blog);
    }

    @Override
    public BlogResponse getBlogBySlug(String slug) {
        Blog blog = blogRepository.findBySlug(slug).orElseThrow(() -> new RuntimeException("Blog not found"));
        return mapToResponse(blog);
    }

    @Override
    public BlogResponse createBlog(UUID authorId, BlogRequest request) {
        User author = userRepository.findById(authorId).orElseThrow(() -> new RuntimeException("User not found"));
        
        Blog blog = Blog.builder()
                .author(author)
                .titleVi(request.getTitleVi())
                .titleEn(request.getTitleEn())
                .slug(request.getSlug())
                .thumbnailUrl(request.getThumbnailUrl())
                .contentVi(request.getContentVi())
                .contentEn(request.getContentEn())
                .shortDescriptionVi(request.getShortDescriptionVi())
                .shortDescriptionEn(request.getShortDescriptionEn())
                .isFeatured(request.getIsFeatured())
                .tags(request.getTags())
                .isPublished(request.getIsPublished())
                .seoTitleVi(request.getSeoTitleVi())
                .seoTitleEn(request.getSeoTitleEn())
                .seoDescriptionVi(request.getSeoDescriptionVi())
                .seoDescriptionEn(request.getSeoDescriptionEn())
                .publishedAt(request.getPublishedAt())
                .build();
                
        return mapToResponse(blogRepository.save(blog));
    }

    @Override
    public BlogResponse updateBlog(UUID id, BlogRequest request) {
        Blog blog = blogRepository.findById(id).orElseThrow(() -> new RuntimeException("Blog not found"));
        
        blog.setTitleVi(request.getTitleVi());
        blog.setTitleEn(request.getTitleEn());
        blog.setSlug(request.getSlug());
        blog.setThumbnailUrl(request.getThumbnailUrl());
        blog.setContentVi(request.getContentVi());
        blog.setContentEn(request.getContentEn());
        blog.setShortDescriptionVi(request.getShortDescriptionVi());
        blog.setShortDescriptionEn(request.getShortDescriptionEn());
        blog.setIsFeatured(request.getIsFeatured());
        blog.setTags(request.getTags());
        blog.setIsPublished(request.getIsPublished());
        blog.setSeoTitleVi(request.getSeoTitleVi());
        blog.setSeoTitleEn(request.getSeoTitleEn());
        blog.setSeoDescriptionVi(request.getSeoDescriptionVi());
        blog.setSeoDescriptionEn(request.getSeoDescriptionEn());
        blog.setPublishedAt(request.getPublishedAt());
        
        return mapToResponse(blogRepository.save(blog));
    }

    @Override
    public void deleteBlog(UUID id) {
        blogRepository.deleteById(id);
    }

    private BlogResponse mapToResponse(Blog blog) {
        return BlogResponse.builder()
                .id(blog.getId())
                .titleVi(blog.getTitleVi())
                .titleEn(blog.getTitleEn())
                .slug(blog.getSlug())
                .thumbnailUrl(blog.getThumbnailUrl())
                .contentVi(blog.getContentVi())
                .contentEn(blog.getContentEn())
                .shortDescriptionVi(blog.getShortDescriptionVi())
                .shortDescriptionEn(blog.getShortDescriptionEn())
                .isFeatured(blog.getIsFeatured())
                .viewCount(blog.getViewCount())
                .tags(blog.getTags())
                .isPublished(blog.getIsPublished())
                .authorName(blog.getAuthor() != null ? blog.getAuthor().getFullName() : "Admin")
                .createdAt(blog.getCreatedAt())
                .updatedAt(blog.getUpdatedAt())
                .seoTitleVi(blog.getSeoTitleVi())
                .seoTitleEn(blog.getSeoTitleEn())
                .seoDescriptionVi(blog.getSeoDescriptionVi())
                .seoDescriptionEn(blog.getSeoDescriptionEn())
                .publishedAt(blog.getPublishedAt())
                .build();
    }
}
