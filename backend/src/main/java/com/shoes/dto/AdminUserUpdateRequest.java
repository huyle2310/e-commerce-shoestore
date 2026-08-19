package com.shoes.dto;

import com.shoes.entity.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminUserUpdateRequest {
    private String fullName;
    private String email;
    private String phone;
    private String address;
    private Role role;
    private Boolean isActive;
}
