package com.shoes.service.impl;

import com.shoes.dto.*;
import com.shoes.entity.Product;
import com.shoes.repository.ProductRepository;
import com.shoes.repository.CategoryRepository;
import com.shoes.repository.BrandRepository;
import com.shoes.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashSet;
import java.util.Set;
import com.shoes.util.StringUtils;

@Service
@RequiredArgsConstructor
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final BrandRepository brandRepository;
    private final com.shoes.repository.ReviewRepository reviewRepository;
    private final com.shoes.repository.RecommendationRepository recommendationRepository;
    private final com.shoes.repository.OrderRepository orderRepository;
    private final com.shoes.repository.OrderItemRepository orderItemRepository;
    private final com.shoes.repository.InventoryBatchRepository batchRepository;

    @Override
    public List<ProductResponse> getAllProducts() {
        return productRepository.findByIsActiveTrue().stream()
                .map(this::mapToProductResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<ProductResponse> getAllProductsAdmin() {
        return productRepository.findAll().stream()
                .map(this::mapToProductResponse)
                .collect(Collectors.toList());
    }

    @Override
    public ProductResponse getProductBySlug(String slug) {
        // Reuse getClearanceProductBySlug so admin/public fetch includes clearance batches
        return getClearanceProductBySlug(slug);
    }

    @Override
    public ProductResponse getProductById(UUID id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));
        return mapToProductResponse(product);
    }

    @Override
    public ProductSearchResponse searchProducts(String keyword) {
        if (keyword == null || keyword.trim().isEmpty()) {
            return new ProductSearchResponse(Collections.emptyList(), null);
        }

        String trimmedKeyword = keyword.trim();
        
        // Always check for spelling suggestion first
        Set<String> dictionary = getSearchDictionary();
        String suggestion = getSuggestion(trimmedKeyword, dictionary);

        if (suggestion != null && !suggestion.equalsIgnoreCase(trimmedKeyword)) {
            // Found a better spelling suggestion, query using suggestion
            List<Product> suggestedProducts = productRepository.searchByKeyword(suggestion);
            return new ProductSearchResponse(
                    suggestedProducts.stream().map(this::mapToProductResponse).collect(Collectors.toList()),
                    suggestion
            );
        }

        // No suggestion needed (exact match or no better suggestion found)
        List<Product> exactMatches = productRepository.searchByKeyword(trimmedKeyword);
        return new ProductSearchResponse(
                exactMatches.stream().map(this::mapToProductResponse).collect(Collectors.toList()),
                null
        );
    }

    private Set<String> getSearchDictionary() {
        Set<String> dictionary = new HashSet<>();
        List<Product> products = productRepository.findAll();
        for (Product p : products) {
            if (p.getNameVi() != null) dictionary.addAll(Arrays.asList(p.getNameVi().split("\\s+")));
            if (p.getNameEn() != null) dictionary.addAll(Arrays.asList(p.getNameEn().split("\\s+")));
            if (p.getBrand() != null && p.getBrand().getName() != null) {
                dictionary.addAll(Arrays.asList(p.getBrand().getName().split("\\s+")));
            }
            if (p.getCategory() != null && p.getCategory().getNameVi() != null) {
                dictionary.addAll(Arrays.asList(p.getCategory().getNameVi().split("\\s+")));
            }
        }
        return dictionary.stream()
                .map(w -> w.replaceAll("[^a-zA-Z0-9À-ỹ]", ""))
                .filter(w -> w.length() > 1) // Ignore single characters
                .collect(Collectors.toSet());
    }

    private String getSuggestion(String input, Set<String> dictionary) {
        String[] words = input.split("\\s+");
        StringBuilder suggestionBuilder = new StringBuilder();
        boolean changed = false;

        for (String word : words) {
            String bestMatch = word;
            int minDistance = Integer.MAX_VALUE;
            
            for (String dictWord : dictionary) {
                int dist = StringUtils.calculateLevenshteinDistance(word, dictWord);
                if (dist < minDistance) {
                    minDistance = dist;
                    bestMatch = dictWord;
                }
            }
            
            int threshold = Math.max(1, word.length() / 3);
            if (minDistance > 0 && minDistance <= threshold) {
                suggestionBuilder.append(bestMatch).append(" ");
                changed = true;
            } else {
                suggestionBuilder.append(word).append(" ");
            }
        }
        
        return changed ? suggestionBuilder.toString().trim() : null;
    }

    @Override
    public List<ProductResponse> getRecommendations(UUID userId) {
        // Guest: không có userId → trả về best-sellers
        if (userId == null) {
            return productRepository.findBestSellingProducts(org.springframework.data.domain.PageRequest.of(0, 10))
                    .getContent().stream().map(this::mapToProductResponse).collect(Collectors.toList());
        }

        // Đọc từ bảng recommendations (đã được trigger tính sẵn)
        List<Product> fromTable = recommendationRepository.findProductsByUserId(userId);

        if (!fromTable.isEmpty()) {
            return fromTable.stream().map(this::mapToProductResponse).collect(Collectors.toList());
        }

        // Fallback: user chưa có lịch sử → best-sellers
        return productRepository.findBestSellingProducts(org.springframework.data.domain.PageRequest.of(0, 10))
                .getContent().stream().map(this::mapToProductResponse).collect(Collectors.toList());
    }

    @Override
    public List<ProductResponse> getSimilarProducts(UUID productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));
        
        Integer categoryId = product.getCategory() != null ? product.getCategory().getId() : -1;
        Integer brandId = product.getBrand() != null ? product.getBrand().getId() : -1;

        List<Product> similarProducts = productRepository.findByCategoryIdOrBrandIdAndIdNot(
                categoryId, brandId, productId, org.springframework.data.domain.PageRequest.of(0, 8));

        return similarProducts.stream().map(this::mapToProductResponse).collect(Collectors.toList());
    }

    @Override
    public List<ProductResponse> getBestSellingProducts(int limit) {
        return productRepository.findBestSellingProducts(org.springframework.data.domain.PageRequest.of(0, limit))
                .getContent().stream().map(this::mapToProductResponse).collect(Collectors.toList());
    }

    @Override
    @org.springframework.transaction.annotation.Transactional
    public ProductResponse createProduct(ProductRequest request) {
        Product product = Product.builder()
                .nameVi(request.getNameVi())
                .nameEn(request.getNameEn() != null && !request.getNameEn().isEmpty() ? request.getNameEn() : request.getNameVi())
                .slug(generateSlug(request.getNameVi()))
                .descriptionVi(request.getDescriptionVi())
                .descriptionEn(request.getDescriptionEn() != null && !request.getDescriptionEn().isEmpty() ? request.getDescriptionEn() : request.getDescriptionVi())
                .clearanceNameVi(request.getClearanceNameVi())
                .clearanceDescriptionVi(request.getClearanceDescriptionVi())
                .basePrice(request.getBasePrice())
                .targetAudience(request.getTargetAudience())
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .isClearanceActive(request.getIsClearanceActive() != null ? request.getIsClearanceActive() : true)
                .variants(new java.util.ArrayList<>())
                .images(new java.util.ArrayList<>())
                .build();

        if (request.getCategoryId() != null) {
            product.setCategory(categoryRepository.findById(request.getCategoryId()).orElse(null));
        }
        if (request.getBrandId() != null) {
            product.setBrand(brandRepository.findById(request.getBrandId()).orElse(null));
        }

        if (request.getVariants() != null) {
            for (ProductVariantRequest vr : request.getVariants()) {
                if (vr.getSize() == null || vr.getSize().trim().isEmpty()) {
                    throw new RuntimeException("Kích thước không được để trống");
                }
                com.shoes.entity.ProductVariant newVar = com.shoes.entity.ProductVariant.builder()
                        .product(product)
                        .sku(vr.getSku())
                        .colorVi(vr.getColorVi())
                        .colorEn(vr.getColorEn())
                        .size(vr.getSize())
                        .stockQuantity(0) // Mặc định luôn là 0, chỉ cộng khi nhập hàng
                        .priceModifier(vr.getPriceModifier())
                        .build();
                product.getVariants().add(newVar);
            }
        }

        if (request.getImages() != null) {
            for (ProductImageRequest imgReq : request.getImages()) {
                com.shoes.entity.ProductImage newImg = com.shoes.entity.ProductImage.builder()
                        .product(product)
                        .imageUrl(imgReq.getImageUrl())
                        .isPrimary(imgReq.getIsPrimary() != null ? imgReq.getIsPrimary() : false)
                        .build();
                product.getImages().add(newImg);
            }
        }

        Product savedProduct = productRepository.save(product);
        return mapToProductResponse(savedProduct);
    }

    @Override
    @org.springframework.transaction.annotation.Transactional
    public void deleteProduct(UUID id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm"));

        if (orderItemRepository.existsByVariantProductId(id)) {
            throw new RuntimeException("Không thể xóa sản phẩm này vì đã phát sinh đơn hàng. Vui lòng vô hiệu hóa thay vì xóa.");
        }

        try {
            productRepository.delete(product);
            productRepository.flush();
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            throw new RuntimeException("Không thể xóa sản phẩm hoặc biến thể này vì đã có dữ liệu ràng buộc (nhập kho, lịch sử...). Vui lòng Đổi trạng thái hiển thị (Ẩn) thay vì xóa.");
        }
    }

    @Override
    @org.springframework.transaction.annotation.Transactional
    public ProductResponse updateProduct(UUID id, ProductRequest request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        product.setNameVi(request.getNameVi());
        product.setNameEn(request.getNameEn() != null && !request.getNameEn().isEmpty() ? request.getNameEn() : request.getNameVi());
        product.setSlug(generateSlug(request.getNameVi()));
        product.setDescriptionVi(request.getDescriptionVi());
        product.setDescriptionEn(request.getDescriptionEn() != null && !request.getDescriptionEn().isEmpty() ? request.getDescriptionEn() : request.getDescriptionVi());
        product.setClearanceNameVi(request.getClearanceNameVi());
        product.setClearanceDescriptionVi(request.getClearanceDescriptionVi());
        product.setBasePrice(request.getBasePrice());
        product.setTargetAudience(request.getTargetAudience());
        product.setIsActive(request.getIsActive());
        if (request.getIsClearanceActive() != null) {
            product.setIsClearanceActive(request.getIsClearanceActive());
        }

        if (request.getCategoryId() != null) {
            product.setCategory(categoryRepository.findById(request.getCategoryId()).orElse(null));
        }
        if (request.getBrandId() != null) {
            product.setBrand(brandRepository.findById(request.getBrandId()).orElse(null));
        }

        if (request.getVariants() != null) {
            // Remove variants not in request
            List<UUID> requestVariantIds = request.getVariants().stream()
                    .filter(v -> v.getId() != null)
                    .map(ProductVariantRequest::getId)
                    .collect(Collectors.toList());

            product.getVariants().removeIf(v -> !requestVariantIds.contains(v.getId()));

            // Update or add variants
            for (ProductVariantRequest vr : request.getVariants()) {
                if (vr.getSize() == null || vr.getSize().trim().isEmpty()) {
                    throw new RuntimeException("Kích thước không được để trống");
                }
                if (vr.getId() != null) {
                    com.shoes.entity.ProductVariant existingVar = product.getVariants().stream()
                            .filter(v -> v.getId().equals(vr.getId()))
                            .findFirst().orElse(null);
                    if (existingVar != null) {
                        existingVar.setSku(vr.getSku());
                        existingVar.setColorVi(vr.getColorVi());
                        existingVar.setColorEn(vr.getColorEn());
                        existingVar.setSize(vr.getSize());
                        // Không cập nhật tồn kho: existingVar.setStockQuantity(vr.getStockQuantity());
                        existingVar.setPriceModifier(vr.getPriceModifier());
                    }
                } else {
                    com.shoes.entity.ProductVariant newVar = com.shoes.entity.ProductVariant.builder()
                            .product(product)
                            .sku(vr.getSku())
                            .colorVi(vr.getColorVi())
                            .colorEn(vr.getColorEn())
                            .size(vr.getSize())
                            .stockQuantity(0) // Mặc định luôn là 0
                            .priceModifier(vr.getPriceModifier())
                            .build();
                    product.getVariants().add(newVar);
                }
            }
        }

        if (request.getImages() != null) {
            // Remove images not in request
            List<UUID> requestImageIds = request.getImages().stream()
                    .filter(img -> img.getId() != null)
                    .map(ProductImageRequest::getId)
                    .collect(Collectors.toList());

            product.getImages().removeIf(img -> !requestImageIds.contains(img.getId()));

            // Update or add images
            for (ProductImageRequest imgReq : request.getImages()) {
                if (imgReq.getId() != null) {
                    com.shoes.entity.ProductImage existingImg = product.getImages().stream()
                            .filter(img -> img.getId().equals(imgReq.getId()))
                            .findFirst().orElse(null);
                    if (existingImg != null) {
                        existingImg.setImageUrl(imgReq.getImageUrl());
                        existingImg.setIsPrimary(imgReq.getIsPrimary() != null ? imgReq.getIsPrimary() : false);
                    }
                } else {
                    com.shoes.entity.ProductImage newImg = com.shoes.entity.ProductImage.builder()
                            .product(product)
                            .imageUrl(imgReq.getImageUrl())
                            .isPrimary(imgReq.getIsPrimary() != null ? imgReq.getIsPrimary() : false)
                            .build();
                    product.getImages().add(newImg);
                }
            }
        }

        try {
            Product savedProduct = productRepository.saveAndFlush(product);
            return mapToProductResponse(savedProduct);
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            throw new RuntimeException("Không thể xóa biến thể vì đã có dữ liệu liên quan (nhập kho, đơn hàng). Vui lòng giữ lại biến thể này.");
        }
    }

    private ProductResponse mapToProductResponse(Product product) {
        ProductResponse response = ProductResponse.builder()
                .id(product.getId())
                .nameVi(product.getNameVi())
                .nameEn(product.getNameEn())
                .slug(product.getSlug())
                .descriptionVi(product.getDescriptionVi())
                .descriptionEn(product.getDescriptionEn())
                .clearanceNameVi(product.getClearanceNameVi())
                .clearanceDescriptionVi(product.getClearanceDescriptionVi())
                .basePrice(product.getBasePrice())
                .targetAudience(product.getTargetAudience())
                .isActive(product.getIsActive())
                .isClearanceActive(product.getIsClearanceActive())
                .build();

        if (product.getCategory() != null) {
            response.setCategory(CategoryResponse.builder()
                    .id(product.getCategory().getId())
                    .nameVi(product.getCategory().getNameVi())
                    .nameEn(product.getCategory().getNameEn())
                    .slug(product.getCategory().getSlug())
                    .build());
        }

        if (product.getBrand() != null) {
            response.setBrand(BrandResponse.builder()
                    .id(product.getBrand().getId())
                    .name(product.getBrand().getName())
                    .logoUrl(product.getBrand().getLogoUrl())
                    .build());
        }

        if (product.getImages() != null) {
            response.setImages(product.getImages().stream().map(img -> ProductImageResponse.builder()
                    .id(img.getId())
                    .imageUrl(img.getImageUrl())
                    .isPrimary(img.getIsPrimary())
                    .build()).collect(Collectors.toList()));
        }

        if (product.getVariants() != null) {
            response.setVariants(product.getVariants().stream().map(var -> {
                BigDecimal base = product.getBasePrice() != null ? product.getBasePrice() : BigDecimal.ZERO;
                BigDecimal mod  = var.getPriceModifier() != null ? var.getPriceModifier() : BigDecimal.ZERO;
                BigDecimal originalPrice   = base.add(mod);
                return ProductVariantResponse.builder()
                        .id(var.getId())
                        .sku(var.getSku())
                        .colorVi(var.getColorVi())
                        .colorEn(var.getColorEn())
                        .size(var.getSize())
                        .stockQuantity(var.getStockQuantity())
                        .priceModifier(var.getPriceModifier())
                        .effectivePrice(originalPrice) // Giá sẽ được tính lại chính xác lúc thanh toán
                        .originalPrice(originalPrice)
                        .build();
            }).collect(Collectors.toList()));
        }

        Double avgRating = reviewRepository.getAverageRatingByProductId(product.getId());
        Integer totalReviews = reviewRepository.countReviewsByProductId(product.getId());
        Integer soldQuantity = orderRepository.countSoldQuantityByProductId(product.getId());
        
        response.setAverageRating(avgRating != null ? Math.round(avgRating * 10.0) / 10.0 : 0.0);
        response.setTotalReviews(totalReviews != null ? totalReviews : 0);
        response.setSoldQuantity(soldQuantity != null ? soldQuantity : 0);
        response.setCreatedAt(product.getCreatedAt());

        return response;
    }

    private String generateSlug(String input) {
        if (input == null || input.isEmpty()) {
            return java.util.UUID.randomUUID().toString();
        }
        String normalized = java.text.Normalizer.normalize(input, java.text.Normalizer.Form.NFD);
        String slug = normalized.replaceAll("\\p{InCombiningDiacriticalMarks}+", "");
        slug = slug.toLowerCase();
        slug = slug.replace("đ", "d");
        slug = slug.replaceAll("[^a-z0-9]+", "-");
        slug = slug.replaceAll("^-+|-+$", "");
        if (slug.isEmpty()) {
            slug = java.util.UUID.randomUUID().toString();
        }
        return slug;
    }
    @Override
    public List<ProductResponse> getClearanceProducts() {
        // Fetch all active clearance batches
        List<com.shoes.entity.InventoryBatch> clearanceBatches = batchRepository.findInventoryBatches(com.shoes.entity.WarehouseType.CLEARANCE, com.shoes.entity.ProductStatus.ACTIVE);
        
        // Group by product ID
        Set<UUID> productIds = clearanceBatches.stream()
                .filter(b -> b.getQuantity() > 0)
                .map(b -> b.getVariant().getProduct().getId())
                .collect(Collectors.toSet());
                
        // Fetch products and map
        return productRepository.findAllById(productIds).stream()
                .filter(p -> p.getIsActive() != null && p.getIsActive() && (p.getIsClearanceActive() == null || p.getIsClearanceActive()))
                .map(p -> mapToProductResponseWithClearance(p, clearanceBatches))
                .collect(Collectors.toList());
    }

    public List<ProductResponse> getClearanceProductsAdmin() {
        List<com.shoes.entity.InventoryBatch> clearanceBatches = batchRepository.findInventoryBatches(com.shoes.entity.WarehouseType.CLEARANCE, com.shoes.entity.ProductStatus.ACTIVE);
        Set<UUID> productIds = clearanceBatches.stream()
                .filter(b -> b.getQuantity() > 0)
                .map(b -> b.getVariant().getProduct().getId())
                .collect(Collectors.toSet());
        return productRepository.findAllById(productIds).stream()
                .map(p -> mapToProductResponseWithClearance(p, clearanceBatches))
                .collect(Collectors.toList());
    }

    @Override
    public ProductResponse getClearanceProductBySlug(String slug) {
        Product product = productRepository.findBySlug(slug)
                .orElseThrow(() -> new RuntimeException("Product not found"));
                
        List<com.shoes.entity.InventoryBatch> clearanceBatches = batchRepository.findInventoryBatches(com.shoes.entity.WarehouseType.CLEARANCE, com.shoes.entity.ProductStatus.ACTIVE).stream()
                .filter(b -> b.getVariant().getProduct().getId().equals(product.getId()) && b.getQuantity() > 0)
                .collect(Collectors.toList());
                
        return mapToProductResponseWithClearance(product, clearanceBatches);
    }

    private ProductResponse mapToProductResponseWithClearance(Product product, List<com.shoes.entity.InventoryBatch> allClearanceBatches) {
        ProductResponse response = mapToProductResponse(product);
        List<InventoryBatchResponse> batchResponses = allClearanceBatches.stream()
                .filter(b -> b.getVariant().getProduct().getId().equals(product.getId()) && b.getQuantity() > 0)
                .map(b -> InventoryBatchResponse.builder()
                        .id(b.getId())
                        .batchCode(b.getBatchCode())
                        .quantity(b.getQuantity())
                        .warehouseType(b.getWarehouseType() != null ? b.getWarehouseType().name() : null)
                        .productStatus(b.getProductStatus() != null ? b.getProductStatus().name() : null)
                        .variantId(b.getVariant().getId())
                        .sku(b.getVariant().getSku())
                        .colorVi(b.getVariant().getColorVi())
                        .colorEn(b.getVariant().getColorEn())
                        .size(b.getVariant().getSize())
                        .qualityPercentage(b.getQualityPercentage())
                        .conditionNote(b.getConditionNote())
                        .clearancePrice(b.getClearancePrice())
                        .imageUrl(b.getImageUrl())
                        .importDate(b.getImportDate())
                        .importPrice(b.getImportPrice())
                        .build())
                .collect(Collectors.toList());
        response.setClearanceBatches(batchResponses);
        return response;
    }
}
