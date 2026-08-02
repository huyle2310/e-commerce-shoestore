package com.shoes.service;

import com.shoes.dto.BlogRequest;
import com.shoes.dto.BlogResponse;
import java.util.List;
import java.util.UUID;

public interface BlogService {
    List<BlogResponse> getAllBlogs();
    List<BlogResponse> getPublishedBlogs();
    BlogResponse getBlogById(UUID id);
    BlogResponse getBlogBySlug(String slug);
    BlogResponse createBlog(UUID authorId, BlogRequest request);
    BlogResponse updateBlog(UUID id, BlogRequest request);
    void deleteBlog(UUID id);
}
