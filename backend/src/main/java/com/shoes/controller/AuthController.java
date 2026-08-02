package com.shoes.controller;

import com.shoes.dto.AuthResponse;
import com.shoes.dto.ForgotPasswordRequest;
import com.shoes.dto.LoginRequest;
import com.shoes.dto.RegisterRequest;
import com.shoes.dto.ResetPasswordRequest;
import com.shoes.dto.VerifyResetCodeRequest;
import com.shoes.entity.Role;
import com.shoes.entity.User;
import com.shoes.repository.UserRepository;
import com.shoes.security.JwtTokenProvider;
import com.shoes.service.EmailService;
import jakarta.validation.Valid;
import java.time.LocalDateTime;
import java.util.Random;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import com.shoes.service.RefreshTokenService;
import com.shoes.entity.RefreshToken;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.shoes.dto.GoogleLoginRequest;
import com.shoes.security.CustomUserDetails;
import java.util.Collections;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@CrossOrigin("*")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final EmailService emailService;
    private final RefreshTokenService refreshTokenService;

    @Value("${google.client.id:YOUR_GOOGLE_CLIENT_ID}")
    private String googleClientId;

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getEmail(), loginRequest.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = tokenProvider.generateToken(authentication);

        User user = userRepository.findByEmail(loginRequest.getEmail()).orElseThrow();

        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user.getId());
        ResponseCookie cookie = ResponseCookie.from("refreshToken", refreshToken.getToken())
                .httpOnly(true)
                .secure(false) // Set to true in production if using HTTPS
                .path("/")
                .maxAge(7 * 24 * 60 * 60)
                .sameSite("Lax")
                .build();

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(new AuthResponse(jwt, user.getId(), user.getEmail(), user.getFullName(), user.getRole().name()));
    }

    @PostMapping("/google")
    public ResponseEntity<?> authenticateGoogleUser(@Valid @RequestBody GoogleLoginRequest request) {
        try {
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), GsonFactory.getDefaultInstance())
                    .setAudience(Collections.singletonList(googleClientId))
                    .build();

            GoogleIdToken idToken = verifier.verify(request.getIdToken());
            if (idToken != null) {
                GoogleIdToken.Payload payload = idToken.getPayload();
                String email = payload.getEmail();
                String name = (String) payload.get("name");

                User user = userRepository.findByEmail(email).orElse(null);
                if (user == null) {
                    user = User.builder()
                            .fullName(name)
                            .email(email)
                            .password(passwordEncoder.encode(UUID.randomUUID().toString())) // Random password
                            .role(Role.CUSTOMER)
                            .isActive(true)
                            .build();
                    user = userRepository.save(user);
                }

                CustomUserDetails userDetails = new CustomUserDetails(user);
                Authentication authentication = new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                SecurityContextHolder.getContext().setAuthentication(authentication);
                
                String jwt = tokenProvider.generateToken(authentication);

                RefreshToken refreshToken = refreshTokenService.createRefreshToken(user.getId());
                ResponseCookie cookie = ResponseCookie.from("refreshToken", refreshToken.getToken())
                        .httpOnly(true)
                        .secure(false)
                        .path("/")
                        .maxAge(7 * 24 * 60 * 60)
                        .sameSite("Lax")
                        .build();

                return ResponseEntity.ok()
                        .header(HttpHeaders.SET_COOKIE, cookie.toString())
                        .body(new AuthResponse(jwt, user.getId(), user.getEmail(), user.getFullName(), user.getRole().name()));
            } else {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid ID token.");
            }
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error verifying token");
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody RegisterRequest registerRequest) {
        if (userRepository.existsByEmail(registerRequest.getEmail())) {
            return new ResponseEntity<>("Error: Email is already taken!", HttpStatus.BAD_REQUEST);
        }

        User user = User.builder()
                .fullName(registerRequest.getFullName())
                .email(registerRequest.getEmail())
                .password(passwordEncoder.encode(registerRequest.getPassword()))
                .phone(registerRequest.getPhone())
                .role(Role.CUSTOMER)
                .isActive(true)
                .build();

        userRepository.save(user);

        return new ResponseEntity<>("User registered successfully", HttpStatus.CREATED);
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        User user = userRepository.findByEmail(request.getEmail()).orElse(null);
        if (user == null) {
            return ResponseEntity.badRequest().body("Không tìm thấy tài khoản với email này");
        }

        String code = String.format("%06d", new Random().nextInt(999999));
        user.setResetCode(code);
        user.setResetCodeExpiry(LocalDateTime.now().plusMinutes(15));
        userRepository.save(user);

        emailService.sendResetPasswordEmail(user.getEmail(), code);
        return ResponseEntity.ok("Mã xác nhận đã được gửi đến email của bạn");
    }

    @PostMapping("/verify-reset-code")
    public ResponseEntity<?> verifyResetCode(@Valid @RequestBody VerifyResetCodeRequest request) {
        User user = userRepository.findByEmail(request.getEmail()).orElse(null);
        if (user == null || user.getResetCode() == null) {
            return ResponseEntity.badRequest().body("Yêu cầu không hợp lệ");
        }

        if (user.getResetCodeExpiry().isBefore(LocalDateTime.now())) {
            return ResponseEntity.badRequest().body("Mã xác nhận đã hết hạn");
        }

        if (!user.getResetCode().equals(request.getCode())) {
            return ResponseEntity.badRequest().body("Mã xác nhận không chính xác");
        }

        return ResponseEntity.ok("Mã xác nhận hợp lệ");
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        User user = userRepository.findByEmail(request.getEmail()).orElse(null);
        if (user == null || user.getResetCode() == null) {
            return ResponseEntity.badRequest().body("Yêu cầu không hợp lệ");
        }

        if (user.getResetCodeExpiry().isBefore(LocalDateTime.now())) {
            return ResponseEntity.badRequest().body("Mã xác nhận đã hết hạn");
        }

        if (!user.getResetCode().equals(request.getCode())) {
            return ResponseEntity.badRequest().body("Mã xác nhận không chính xác");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setResetCode(null);
        user.setResetCodeExpiry(null);
        userRepository.save(user);

        return ResponseEntity.ok("Mật khẩu đã được cập nhật thành công");
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refreshToken(@CookieValue(name = "refreshToken", required = false) String requestRefreshToken) {
        if (requestRefreshToken == null || requestRefreshToken.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Refresh Token is missing");
        }

        return refreshTokenService.findByToken(requestRefreshToken)
                .map(refreshTokenService::verifyExpiration)
                .map(RefreshToken::getUser)
                .map(user -> {
                    CustomUserDetails userDetails = new CustomUserDetails(user);
                    Authentication authentication = new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                    String token = tokenProvider.generateToken(authentication);
                    return ResponseEntity.ok(new AuthResponse(token, user.getId(), user.getEmail(), user.getFullName(), user.getRole().name()));
                })
                .orElseThrow(() -> new RuntimeException("Refresh token is not in database!"));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logoutUser(@CookieValue(name = "refreshToken", required = false) String requestRefreshToken) {
        if (requestRefreshToken != null && !requestRefreshToken.isEmpty()) {
            refreshTokenService.findByToken(requestRefreshToken).ifPresent(token -> {
                refreshTokenService.deleteByUserId(token.getUser().getId());
            });
        }
        
        ResponseCookie cookie = ResponseCookie.from("refreshToken", "")
                .httpOnly(true)
                .secure(false)
                .path("/")
                .maxAge(0)
                .sameSite("Lax")
                .build();
                
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body("Log out successful");
    }
}
