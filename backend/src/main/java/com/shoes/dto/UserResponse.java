package com.shoes.dto;

import com.shoes.entity.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {
    private UUID id;
    private String email;
    private String fullName;
    private String phone;
    private String address;
    private String avatarUrl;
    private Role role;
    private Boolean isActive;
    private java.math.BigDecimal totalSpent;
    private Integer totalOrders;
    private String rankName;
    private LocalDateTime createdAt;
}
