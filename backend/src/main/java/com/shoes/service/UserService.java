package com.shoes.service;

import com.shoes.dto.UserCreateRequest;
import com.shoes.dto.UserResponse;
import com.shoes.entity.Role;

import java.util.List;
import java.util.UUID;

public interface UserService {
    List<UserResponse> getAllUsers();
    UserResponse createUser(UserCreateRequest request);
    UserResponse updateUserRole(UUID id, Role role);
    UserResponse updateUserStatus(UUID id, Boolean isActive);
    UserResponse updateUserFromAdmin(UUID id, com.shoes.dto.AdminUserUpdateRequest request);
    UserResponse updateProfile(UUID userId, com.shoes.dto.UserProfileUpdateRequest request);
    UserResponse getUserById(UUID userId);
    void updatePassword(UUID userId, com.shoes.dto.UserPasswordUpdateRequest request);
    void requestEmailChange(UUID userId, com.shoes.dto.EmailChangeRequest request);
    UserResponse confirmEmailChange(UUID userId, com.shoes.dto.EmailChangeConfirmRequest request);
    void syncUserRanks();
}
