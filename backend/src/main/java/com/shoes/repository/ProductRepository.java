package com.shoes.repository;

import com.shoes.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProductRepository extends JpaRepository<Product, UUID> {
    Optional<Product> findBySlug(String slug);

    java.util.List<Product> findByIsActiveTrue();

    @org.springframework.data.jpa.repository.Query(value = "SELECT p.* FROM products p " +
            "LEFT JOIN brands b ON p.brand_id = b.id " +
            "LEFT JOIN categories c ON p.category_id = c.id " +
            "WHERE p.is_active = true AND (p.name_vi ILIKE CONCAT('%', :keyword, '%') OR " +
            "p.name_en ILIKE CONCAT('%', :keyword, '%') OR " +
            "b.name ILIKE CONCAT('%', :keyword, '%') OR " +
            "c.name_vi ILIKE CONCAT('%', :keyword, '%') OR " +
            "c.name_en ILIKE CONCAT('%', :keyword, '%') OR " +
            "word_similarity(:keyword, p.name_vi) > 0.3 OR " +
            "word_similarity(:keyword, p.name_en) > 0.3 OR " +
            "word_similarity(:keyword, b.name) > 0.3 OR " +
            "word_similarity(:keyword, c.name_vi) > 0.3 OR " +
            "word_similarity(:keyword, c.name_en) > 0.3) " +
            "ORDER BY GREATEST(word_similarity(:keyword, p.name_vi), word_similarity(:keyword, p.name_en), word_similarity(:keyword, b.name), word_similarity(:keyword, c.name_vi), word_similarity(:keyword, c.name_en)) DESC", nativeQuery = true)
    java.util.List<Product> searchByKeyword(@org.springframework.data.repository.query.Param("keyword") String keyword);

    @org.springframework.data.jpa.repository.Query("SELECT DISTINCT p FROM Order o JOIN o.items i JOIN i.variant v JOIN v.product p WHERE p.isActive = true AND o.user.id = :userId")
    java.util.List<Product> findPurchasedProductsByUserId(@org.springframework.data.repository.query.Param("userId") UUID userId);

    @org.springframework.data.jpa.repository.Query("SELECT p FROM Order o JOIN o.items i JOIN i.variant v JOIN v.product p WHERE p.isActive = true GROUP BY p.id ORDER BY SUM(i.quantity) DESC")
    org.springframework.data.domain.Page<Product> findBestSellingProducts(org.springframework.data.domain.Pageable pageable);

    @org.springframework.data.jpa.repository.Query("SELECT p FROM Product p WHERE p.isActive = true AND (p.category.id IN :categoryIds OR p.brand.id IN :brandIds) AND p.id NOT IN :purchasedIds")
    org.springframework.data.domain.Page<Product> findRecommendationsByCategoriesAndBrands(
        @org.springframework.data.repository.query.Param("categoryIds") java.util.List<Integer> categoryIds, 
        @org.springframework.data.repository.query.Param("brandIds") java.util.List<Integer> brandIds, 
        @org.springframework.data.repository.query.Param("purchasedIds") java.util.List<UUID> purchasedIds,
        org.springframework.data.domain.Pageable pageable
    );

    @org.springframework.data.jpa.repository.Query("SELECT p FROM Product p WHERE p.isActive = true AND (p.category.id = :categoryId OR p.brand.id = :brandId) AND p.id != :productId")
    java.util.List<Product> findByCategoryIdOrBrandIdAndIdNot(
        @org.springframework.data.repository.query.Param("categoryId") Integer categoryId,
        @org.springframework.data.repository.query.Param("brandId") Integer brandId,
        @org.springframework.data.repository.query.Param("productId") UUID productId,
        org.springframework.data.domain.Pageable pageable
    );
}
