package com.shoes.controller;

import com.shoes.dto.AuthResponse;
import com.shoes.dto.UserCreateRequest;
import com.shoes.dto.UserResponse;
import com.shoes.entity.Role;
import com.shoes.repository.UserRepository;
import com.shoes.security.CustomUserDetails;
import com.shoes.security.JwtTokenProvider;
import com.shoes.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@CrossOrigin("*")
public class UserController {

    private final UserService userService;
    private final JwtTokenProvider tokenProvider;
    private final UserRepository userRepository;

    // Lấy toàn bộ danh sách người dùng (Chỉ dành cho Admin)
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/admin")
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    // Đồng bộ thứ hạng người dùng dựa trên lịch sử mua hàng
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/admin/sync-ranks")
    public ResponseEntity<Void> syncUserRanks() {
        userService.syncUserRanks();
        return ResponseEntity.ok().build();
    }

    // Tạo mới người dùng (từ Admin)
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/admin")
    public ResponseEntity<UserResponse> createUser(@RequestBody UserCreateRequest request) {
        return ResponseEntity.ok(userService.createUser(request));
    }

    // Đổi chức vụ cho người dùng
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/admin/{id}/role")
    public ResponseEntity<UserResponse> updateUserRole(
            @PathVariable UUID id,
            @RequestParam Role role) {
        return ResponseEntity.ok(userService.updateUserRole(id, role));
    }

    // Kích hoạt/Vô hiệu hóa người dùng
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/admin/{id}/status")
    public ResponseEntity<UserResponse> updateUserStatus(
            @PathVariable UUID id,
            @RequestParam Boolean isActive) {
        return ResponseEntity.ok(userService.updateUserStatus(id, isActive));
    }

    // Cập nhật toàn bộ thông tin người dùng (từ Admin)
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/admin/{id}")
    public ResponseEntity<UserResponse> updateUserFromAdmin(
            @PathVariable UUID id,
            @RequestBody com.shoes.dto.AdminUserUpdateRequest request) {
        return ResponseEntity.ok(userService.updateUserFromAdmin(id, request));
    }

    // Cập nhật thông tin cá nhân
    @PutMapping("/profile")
    public ResponseEntity<UserResponse> updateProfile(
            @RequestBody com.shoes.dto.UserProfileUpdateRequest request,
            org.springframework.security.core.Authentication authentication) {
        java.util.UUID userId = null;
        if (authentication != null && authentication.getPrincipal() instanceof com.shoes.security.CustomUserDetails) {
            userId = ((com.shoes.security.CustomUserDetails) authentication.getPrincipal()).getId();
        } else {
            return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(userService.updateProfile(userId, request));
    }

    // Cập nhật mật khẩu
    @PutMapping("/profile/password")
    public ResponseEntity<Void> updatePassword(
            @RequestBody com.shoes.dto.UserPasswordUpdateRequest request,
            org.springframework.security.core.Authentication authentication) {
        java.util.UUID userId = null;
        if (authentication != null && authentication.getPrincipal() instanceof com.shoes.security.CustomUserDetails) {
            userId = ((com.shoes.security.CustomUserDetails) authentication.getPrincipal()).getId();
        } else {
            return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED).build();
        }
        userService.updatePassword(userId, request);
        return ResponseEntity.ok().build();
    }

    // Yêu cầu đổi email (gửi OTP)
    @PostMapping("/profile/email/request-change")
    public ResponseEntity<Void> requestEmailChange(
            @RequestBody com.shoes.dto.EmailChangeRequest request,
            org.springframework.security.core.Authentication authentication) {
        java.util.UUID userId = null;
        if (authentication != null && authentication.getPrincipal() instanceof com.shoes.security.CustomUserDetails) {
            userId = ((com.shoes.security.CustomUserDetails) authentication.getPrincipal()).getId();
        } else {
            return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED).build();
        }
        userService.requestEmailChange(userId, request);
        return ResponseEntity.ok().build();
    }

    // Xác nhận đổi email bằng OTP
    @PostMapping("/profile/email/confirm-change")
    public ResponseEntity<AuthResponse> confirmEmailChange(
            @RequestBody com.shoes.dto.EmailChangeConfirmRequest request,
            org.springframework.security.core.Authentication authentication) {
        java.util.UUID userId = null;
        if (authentication != null && authentication.getPrincipal() instanceof com.shoes.security.CustomUserDetails) {
            userId = ((com.shoes.security.CustomUserDetails) authentication.getPrincipal()).getId();
        } else {
            return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED).build();
        }
        
        // Execute the service method which validates and changes the email
        userService.confirmEmailChange(userId, request);
        
        // Fetch the updated user to generate a new token
        com.shoes.entity.User user = userRepository.findById(userId).orElseThrow();
        CustomUserDetails userDetails = new CustomUserDetails(user);
        org.springframework.security.core.Authentication newAuth = new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
        
        String jwt = tokenProvider.generateToken(newAuth);
        
        return ResponseEntity.ok(new AuthResponse(jwt, user.getId(), user.getEmail(), user.getFullName(), user.getRole().name()));
    }

    // Lấy thông tin cá nhân
    @GetMapping("/profile")
    public ResponseEntity<UserResponse> getProfile(org.springframework.security.core.Authentication authentication) {
        java.util.UUID userId = null;
        if (authentication != null && authentication.getPrincipal() instanceof com.shoes.security.CustomUserDetails) {
            userId = ((com.shoes.security.CustomUserDetails) authentication.getPrincipal()).getId();
        } else {
            return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(userService.getUserById(userId));
    }
}
