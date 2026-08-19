package com.shoes.service.impl;

import com.shoes.dto.request.ReviewRequest;
import com.shoes.dto.response.ReviewResponse;
import com.shoes.entity.Product;
import com.shoes.entity.Review;
import com.shoes.entity.User;
import com.shoes.repository.OrderRepository;
import com.shoes.repository.ProductRepository;
import com.shoes.repository.ReviewRepository;
import com.shoes.repository.UserRepository;
import com.shoes.service.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReviewServiceImpl implements ReviewService {

    private final ReviewRepository reviewRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;

    @Override
    @Transactional
    public ReviewResponse addReview(UUID productId, UUID userId, ReviewRequest request) {
        if (!canUserReviewProduct(productId, userId)) {
            throw new RuntimeException("Bạn phải mua sản phẩm này và đơn hàng đã được giao thành công thì mới được đánh giá.");
        }

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        java.util.Optional<Review> existingReviewOpt = reviewRepository.findByProductIdAndUserId(productId, userId);
        Review review;

        if (existingReviewOpt.isPresent()) {
            review = existingReviewOpt.get();
            review.setRating(request.getRating());
            review.setComment(request.getComment());
            review.setCreatedAt(java.time.LocalDateTime.now()); // Update timestamp
        } else {
            review = Review.builder()
                    .product(product)
                    .user(user)
                    .rating(request.getRating())
                    .comment(request.getComment())
                    .build();
        }

        Review savedReview = reviewRepository.save(review);
        return mapToResponse(savedReview);
    }

    @Override
    public List<ReviewResponse> getReviewsByProduct(UUID productId) {
        return reviewRepository.findByProductIdOrderByCreatedAtDesc(productId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public boolean canUserReviewProduct(UUID productId, UUID userId) {
        return orderRepository.hasUserBoughtProduct(userId, productId);
    }

    private ReviewResponse mapToResponse(Review review) {
        return ReviewResponse.builder()
                .id(review.getId())
                .productId(review.getProduct().getId())
                .userId(review.getUser().getId())
                .userFullName(review.getUser().getFullName())
                .userAvatar(review.getUser().getAvatarUrl())
                .rating(review.getRating())
                .comment(review.getComment())
                .createdAt(review.getCreatedAt())
                .build();
    }

    @Override
    @Transactional
    public void deleteReview(UUID reviewId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new RuntimeException("Review not found"));
        reviewRepository.delete(review);
    }
}
