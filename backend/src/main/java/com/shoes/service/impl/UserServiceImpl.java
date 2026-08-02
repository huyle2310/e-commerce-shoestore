package com.shoes.service.impl;

import com.shoes.dto.UserCreateRequest;
import com.shoes.dto.UserResponse;
import com.shoes.entity.Role;
import com.shoes.entity.User;
import com.shoes.repository.UserRepository;
import com.shoes.service.EmailService;
import com.shoes.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final com.shoes.repository.OrderRepository orderRepository;

    @Override
    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @org.springframework.transaction.annotation.Transactional
    public UserResponse createUser(UserCreateRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("Email đã tồn tại trong hệ thống");
        }

        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .role(request.getRole() != null ? request.getRole() : Role.CUSTOMER)
                .isActive(true)
                .build();

        return mapToResponse(userRepository.save(user));
    }

    @Override
    @org.springframework.transaction.annotation.Transactional
    public UserResponse updateUserRole(UUID id, Role role) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
        user.setRole(role);
        return mapToResponse(userRepository.save(user));
    }

    @Override
    @org.springframework.transaction.annotation.Transactional
    public UserResponse updateUserStatus(UUID id, Boolean isActive) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
        user.setIsActive(isActive);
        return mapToResponse(userRepository.save(user));
    }

    @Override
    @org.springframework.transaction.annotation.Transactional
    public UserResponse updateProfile(UUID userId, com.shoes.dto.UserProfileUpdateRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
        
        if (request.getFullName() != null) user.setFullName(request.getFullName());
        if (request.getPhone() != null) user.setPhone(request.getPhone());
        if (request.getAddress() != null) user.setAddress(request.getAddress());
        if (request.getAvatarUrl() != null) user.setAvatarUrl(request.getAvatarUrl());
        
        return mapToResponse(userRepository.save(user));
    }

    @Override
    public UserResponse getUserById(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
        return mapToResponse(user);
    }

    @Override
    @org.springframework.transaction.annotation.Transactional
    public void updatePassword(UUID userId, com.shoes.dto.UserPasswordUpdateRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
        
        if (!passwordEncoder.matches(request.getOldPassword(), user.getPassword())) {
            throw new RuntimeException("Mật khẩu cũ không chính xác");
        }
        
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    @Override
    @org.springframework.transaction.annotation.Transactional
    public void requestEmailChange(UUID userId, com.shoes.dto.EmailChangeRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
        
        if (userRepository.findByEmail(request.getNewEmail()).isPresent()) {
            throw new RuntimeException("Email đã được sử dụng bởi tài khoản khác");
        }
        
        String otp = String.format("%06d", new java.util.Random().nextInt(999999));
        user.setResetCode(otp);
        user.setResetCodeExpiry(java.time.LocalDateTime.now().plusMinutes(15));
        user.setPendingEmail(request.getNewEmail());
        userRepository.save(user);
        
        emailService.sendEmailChangeOtp(request.getNewEmail(), otp);
    }

    @Override
    @org.springframework.transaction.annotation.Transactional
    public UserResponse confirmEmailChange(UUID userId, com.shoes.dto.EmailChangeConfirmRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
                
        if (user.getResetCode() == null || !user.getResetCode().equals(request.getOtp())) {
            throw new RuntimeException("Mã OTP không hợp lệ");
        }
        
        if (user.getResetCodeExpiry() != null && user.getResetCodeExpiry().isBefore(java.time.LocalDateTime.now())) {
            throw new RuntimeException("Mã OTP đã hết hạn");
        }
        
        if (user.getPendingEmail() == null) {
            throw new RuntimeException("Không có yêu cầu thay đổi email nào");
        }
        
        user.setEmail(user.getPendingEmail());
        user.setPendingEmail(null);
        user.setResetCode(null);
        user.setResetCodeExpiry(null);
        
        return mapToResponse(userRepository.save(user));
    }

    private UserResponse mapToResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .address(user.getAddress())
                .avatarUrl(user.getAvatarUrl())
                .role(user.getRole())
                .isActive(user.getIsActive())
                .totalSpent(user.getTotalSpent())
                .rankName(user.getRankName())
                .createdAt(user.getCreatedAt())
                .build();
    }
    @Override
    @org.springframework.transaction.annotation.Transactional
    public void syncUserRanks() {
        List<User> users = userRepository.findAll();
        for (User user : users) {
            List<com.shoes.entity.Order> deliveredOrders = orderRepository.findByUserIdAndOrderStatus(user.getId(), "DELIVERED");
            java.math.BigDecimal total = java.math.BigDecimal.ZERO;
            for (com.shoes.entity.Order order : deliveredOrders) {
                if (order.getFinalAmount() != null) {
                    total = total.add(order.getFinalAmount());
                }
            }
            user.setTotalSpent(total);
            
            if (total.compareTo(new java.math.BigDecimal("10000000")) >= 0) {
                user.setRankName("TINH ANH");
            } else if (total.compareTo(new java.math.BigDecimal("5000000")) >= 0) {
                user.setRankName("KIM CƯƠNG");
            } else if (total.compareTo(new java.math.BigDecimal("2000000")) >= 0) {
                user.setRankName("VÀNG");
            } else {
                user.setRankName("MEMBER");
            }
        }
        userRepository.saveAll(users);
    }
}
