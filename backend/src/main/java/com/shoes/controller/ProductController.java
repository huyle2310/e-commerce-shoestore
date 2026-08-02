package com.shoes.controller;

import com.shoes.dto.ProductResponse;
import com.shoes.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/products")
@RequiredArgsConstructor
@CrossOrigin("*")
public class ProductController {
    
    private final ProductService productService;
    
    // API Public (Không cần xác thực) lấy tất cả sản phẩm
    @GetMapping
    public ResponseEntity<List<ProductResponse>> getAllProducts() {
        return ResponseEntity.ok(productService.getAllProducts());
    }

    // API Admin lấy tất cả sản phẩm (bao gồm cả ẩn)
    @GetMapping("/admin/all")
    public ResponseEntity<List<ProductResponse>> getAllProductsAdmin() {
        return ResponseEntity.ok(productService.getAllProductsAdmin());
    }

    // API Public search products
    @GetMapping("/search")
    public ResponseEntity<com.shoes.dto.ProductSearchResponse> searchProducts(@RequestParam String keyword) {
        return ResponseEntity.ok(productService.searchProducts(keyword));
    }

    @GetMapping("/{slug}")
    public ResponseEntity<ProductResponse> getProductBySlug(@PathVariable String slug) {
        return ResponseEntity.ok(productService.getProductBySlug(slug));
    }

    @GetMapping("/{id}/similar")
    public ResponseEntity<List<ProductResponse>> getSimilarProducts(@PathVariable java.util.UUID id) {
        return ResponseEntity.ok(productService.getSimilarProducts(id));
    }

    // API Public lấy danh sách sản phẩm bán chạy
    @GetMapping("/best-sellers")
    public ResponseEntity<List<ProductResponse>> getBestSellingProducts(
            @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(productService.getBestSellingProducts(limit));
    }

    // API Public/Private lấy danh sách gợi ý
    @GetMapping("/recommendations")
    public ResponseEntity<List<ProductResponse>> getRecommendations(
            @RequestHeader(value = "Authorization", required = false) String token,
            org.springframework.security.core.Authentication authentication) {
        
        java.util.UUID userId = null;
        if (authentication != null && authentication.getPrincipal() instanceof com.shoes.security.CustomUserDetails) {
            userId = ((com.shoes.security.CustomUserDetails) authentication.getPrincipal()).getId();
        }
        
        return ResponseEntity.ok(productService.getRecommendations(userId));
    }

    // API Admin: Update Product
    @PutMapping("/admin/{id}")
    public ResponseEntity<ProductResponse> updateProduct(
            @PathVariable java.util.UUID id,
            @RequestBody com.shoes.dto.ProductRequest request) {
        return ResponseEntity.ok(productService.updateProduct(id, request));
    }

    // API Admin: Create Product
    @PostMapping("/admin")
    public ResponseEntity<ProductResponse> createProduct(
            @RequestBody com.shoes.dto.ProductRequest request) {
        return ResponseEntity.ok(productService.createProduct(request));
    }
}
