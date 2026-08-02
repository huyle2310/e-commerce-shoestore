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
public class UserCreateRequest {
    private String email;
    private String password;
    private String fullName;
    private String phone;
    private Role role;
}
