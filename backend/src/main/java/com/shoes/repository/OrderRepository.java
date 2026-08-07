package com.shoes.repository;

import com.shoes.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.UUID;

@Repository
public interface OrderRepository extends JpaRepository<Order, UUID> {
    java.util.List<Order> findByCreatedAtAfter(java.time.LocalDateTime date);
    java.util.List<Order> findByCreatedAtBetween(java.time.LocalDateTime startDate, java.time.LocalDateTime endDate);
    java.util.List<Order> findByUserId(UUID userId);
    java.util.List<Order> findByUserIdAndOrderStatus(UUID userId, String orderStatus);
    int countByUserId(UUID userId);

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(o) > 0 FROM Order o JOIN o.items i " +
           "WHERE o.user.id = :userId AND o.orderStatus = 'DELIVERED' AND i.variant.product.id = :productId")
    boolean hasUserBoughtProduct(@org.springframework.data.repository.query.Param("userId") UUID userId, 
                                 @org.springframework.data.repository.query.Param("productId") UUID productId);

    @org.springframework.data.jpa.repository.Query("SELECT SUM(i.quantity) FROM Order o JOIN o.items i " +
           "WHERE o.orderStatus = 'DELIVERED' AND i.variant.product.id = :productId")
    Integer countSoldQuantityByProductId(@org.springframework.data.repository.query.Param("productId") UUID productId);

    boolean existsByVoucherId(UUID voucherId);
}
