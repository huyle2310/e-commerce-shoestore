package com.shoes.service;

import com.shoes.dto.request.ReviewRequest;
import com.shoes.dto.response.ReviewResponse;
import java.util.List;
import java.util.UUID;

public interface ReviewService {
    ReviewResponse addReview(UUID productId, UUID userId, ReviewRequest request);
    List<ReviewResponse> getReviewsByProduct(UUID productId);
    boolean canUserReviewProduct(UUID productId, UUID userId);
}
