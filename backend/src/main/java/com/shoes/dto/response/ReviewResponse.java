package com.shoes.dto.response;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class ReviewResponse {
    private UUID id;
    private UUID productId;
    private UUID userId;
    private String userFullName;
    private String userAvatar;
    private Integer rating;
    private String comment;
    private LocalDateTime createdAt;
}
