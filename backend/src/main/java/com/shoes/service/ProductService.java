package com.shoes.service;

import com.shoes.dto.ProductResponse;
import java.util.List;
import java.util.UUID;

public interface ProductService {
    List<ProductResponse> getAllProducts();
    List<ProductResponse> getAllProductsAdmin();
    ProductResponse getProductBySlug(String slug);
    ProductResponse getProductById(UUID id);
    ProductResponse createProduct(com.shoes.dto.ProductRequest request);
    ProductResponse updateProduct(UUID id, com.shoes.dto.ProductRequest request);
    void deleteProduct(UUID id);
    com.shoes.dto.ProductSearchResponse searchProducts(String keyword);
    List<ProductResponse> getRecommendations(UUID userId);
    List<ProductResponse> getSimilarProducts(UUID productId);
    List<ProductResponse> getBestSellingProducts(int limit);
    List<ProductResponse> getClearanceProducts();
    List<ProductResponse> getClearanceProductsAdmin();
    ProductResponse getClearanceProductBySlug(String slug);
}
