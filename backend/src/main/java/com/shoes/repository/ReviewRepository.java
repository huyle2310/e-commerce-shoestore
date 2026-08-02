package com.shoes.repository;

import com.shoes.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.UUID;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

@Repository
public interface ReviewRepository extends JpaRepository<Review, UUID> {
    java.util.List<Review> findByProductIdOrderByCreatedAtDesc(UUID productId);
    
    java.util.Optional<Review> findByProductIdAndUserId(UUID productId, UUID userId);


    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.product.id = :productId")
    Double getAverageRatingByProductId(@Param("productId") UUID productId);

    @Query("SELECT COUNT(r) FROM Review r WHERE r.product.id = :productId")
    Integer countReviewsByProductId(@Param("productId") UUID productId);
}
