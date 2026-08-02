package com.shoes.controller;

import com.shoes.dto.BlogRequest;
import com.shoes.dto.BlogResponse;
import com.shoes.security.CustomUserDetails;
import com.shoes.service.BlogService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/blogs")
@RequiredArgsConstructor
@CrossOrigin("*")
public class BlogController {

    private final BlogService blogService;

    // Cho phép mọi user xem danh sách bài viết đã xuất bản
    @GetMapping
    public ResponseEntity<List<BlogResponse>> getPublishedBlogs() {
        return ResponseEntity.ok(blogService.getPublishedBlogs());
    }

    // Cho phép mọi user xem bài viết theo slug
    @GetMapping("/{slug}")
    public ResponseEntity<BlogResponse> getBlogBySlug(@PathVariable String slug) {
        return ResponseEntity.ok(blogService.getBlogBySlug(slug));
    }

    // --- ADMIN APIs ---
    
    @GetMapping("/admin/all")
    public ResponseEntity<List<BlogResponse>> getAllBlogs() {
        return ResponseEntity.ok(blogService.getAllBlogs());
    }

    @PostMapping
    public ResponseEntity<BlogResponse> createBlog(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody BlogRequest request) {
        return ResponseEntity.ok(blogService.createBlog(userDetails.getId(), request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<BlogResponse> updateBlog(
            @PathVariable UUID id,
            @Valid @RequestBody BlogRequest request) {
        return ResponseEntity.ok(blogService.updateBlog(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBlog(@PathVariable UUID id) {
        blogService.deleteBlog(id);
        return ResponseEntity.noContent().build();
    }
}
