package com.shoes.service.impl;

import com.shoes.dto.CategoryRequest;
import com.shoes.dto.CategoryResponse;
import com.shoes.entity.Category;
import com.shoes.repository.CategoryRepository;
import com.shoes.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;

    @Override
    @Cacheable(value = "categories", key = "'all'")
    public List<CategoryResponse> getAllCategories() {
        return categoryRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Cacheable(value = "categories", key = "#id")
    public CategoryResponse getCategoryById(Integer id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found"));
        return mapToResponse(category);
    }

    @CacheEvict(value = "categories", allEntries = true)
    @Override
    public CategoryResponse createCategory(CategoryRequest request) {
        Category category = Category.builder()
                .nameVi(request.getNameVi())
                .nameEn(request.getNameEn())
                .slug(request.getSlug())
                .build();
        return mapToResponse(categoryRepository.save(category));
    }

    @CacheEvict(value = "categories", allEntries = true)
    @Override
    public CategoryResponse updateCategory(Integer id, CategoryRequest request) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found"));
        category.setNameVi(request.getNameVi());
        category.setNameEn(request.getNameEn());
        category.setSlug(request.getSlug());
        return mapToResponse(categoryRepository.save(category));
    }

    @CacheEvict(value = "categories", allEntries = true)
    @Override
    public void deleteCategory(Integer id) {
        categoryRepository.deleteById(id);
    }

    private CategoryResponse mapToResponse(Category category) {
        return CategoryResponse.builder()
                .id(category.getId())
                .nameVi(category.getNameVi())
                .nameEn(category.getNameEn())
                .slug(category.getSlug())
                .createdAt(category.getCreatedAt())
                .build();
    }
}
