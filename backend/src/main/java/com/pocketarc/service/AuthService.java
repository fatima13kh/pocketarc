package com.pocketarc.service;

import com.pocketarc.dto.request.*;
import com.pocketarc.dto.response.*;
import com.pocketarc.exception.*;
import com.pocketarc.model.User;
import com.pocketarc.repository.UserRepository;
import com.pocketarc.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final PasswordEncoder passwordEncoder;

    private static final BigDecimal STARTING_BALANCE = new BigDecimal("500.00");

    @Transactional
    public ApiResponse register(RegisterRequest request) {

        if (userRepository.existsByEmail(request.email())) {
            throw new BusinessException("This email is already registered");
        }
        if (userRepository.existsByUsername(request.username())) {
            throw new BusinessException("This username is already taken");
        }
        if (userRepository.existsByPhoneNumber(request.phoneNumber())) {
            throw new BusinessException("This phone number is already registered");
        }

        User user = User.builder()
                .username(request.username())
                .email(request.email())
                .phoneNumber(request.phoneNumber())
                .passwordHash(passwordEncoder.encode(request.password()))
                .isAdmin(false)
                .cashBalance(STARTING_BALANCE)
                .build();

        userRepository.save(user);

        // Auto-login after registration
        String token = jwtTokenProvider.generateToken(
                user.getId(), user.getEmail(), user.getIsAdmin());

        return new ApiResponse(true, "Registration successful!");
    }

    public AuthResponse login(LoginRequest request) {

        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new UnauthorizedException("Invalid email or password"));

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new UnauthorizedException("Invalid email or password");
        }

        String token = jwtTokenProvider.generateToken(
                user.getId(), user.getEmail(), user.getIsAdmin());

        return new AuthResponse(
                token,
                user.getUsername(),
                user.getEmail(),
                user.getIsAdmin());
    }

    @Transactional
    public ApiResponse forgotPassword(ForgotPasswordRequest request) {
        // Check if user exists (but don't send email in demo)
        userRepository.findByEmail(request.email())
                .orElseThrow(() -> new ResourceNotFoundException("No account found with this email address"));

        return new ApiResponse(true, "If an account exists, password reset instructions will be sent.");
    }

    @Transactional
    public ApiResponse resetPassword(ResetPasswordRequest request) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);

        return new ApiResponse(true, "Password reset successfully. You can now log in.");
    }
}