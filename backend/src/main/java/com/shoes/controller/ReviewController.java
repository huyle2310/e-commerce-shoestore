package com.shoes.controller;

import com.shoes.dto.request.ReviewRequest;
import com.shoes.dto.response.ReviewResponse;
import com.shoes.service.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/products/{productId}/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    @GetMapping
    public ResponseEntity<List<ReviewResponse>> getReviews(@PathVariable UUID productId) {
        return ResponseEntity.ok(reviewService.getReviewsByProduct(productId));
    }

    @PostMapping
    public ResponseEntity<ReviewResponse> addReview(
            @PathVariable UUID productId,
            @Valid @RequestBody ReviewRequest request,
            Authentication authentication) {
        
        if (authentication == null || !authentication.isAuthenticated() || authentication.getPrincipal().equals("anonymousUser")) {
            return ResponseEntity.status(401).build();
        }

        UUID userId = ((com.shoes.security.CustomUserDetails) authentication.getPrincipal()).getId();
        
        ReviewResponse response = reviewService.addReview(productId, userId, request);
        return ResponseEntity.ok(response);
    }
}
