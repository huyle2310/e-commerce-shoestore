package com.shoes.repository;

import com.shoes.entity.Product;
import com.shoes.entity.Recommendation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface RecommendationRepository extends JpaRepository<Recommendation, UUID> {

    /**
     * Lấy danh sách Product được gợi ý cho user, sắp xếp theo score giảm dần.
     * Score đã được tính sẵn bởi PostgreSQL trigger khi user đặt/nhận đơn hàng.
     */
    @Query("SELECT r.product FROM Recommendation r WHERE r.user.id = :userId ORDER BY r.score DESC")
    List<Product> findProductsByUserId(@Param("userId") UUID userId);
}
