package com.pocketarc.service;

import com.pocketarc.dto.request.*;
import com.pocketarc.dto.response.*;
import com.pocketarc.exception.*;
import com.pocketarc.model.User;
import com.pocketarc.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final OtpCodeRepository otpCodeRepository;
    private final InvestmentTransactionRepository investmentTransactionRepository;
    private final SavingsGoalRepository savingsGoalRepository;
    private final UserStoryProgressRepository userStoryProgressRepository;
    private final PasswordEncoder passwordEncoder;

    // ─────────────────────────────────────────────────────────────────────────
    // GET CURRENT USER
    // ─────────────────────────────────────────────────────────────────────────

    public UserResponse getCurrentUser(Long userId) {
        User user = findUserById(userId);
        return mapToResponse(user);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // UPDATE PROFILE
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional
    public UserResponse updateProfile(Long userId, UpdateProfileRequest request) {
        User user = findUserById(userId);

        // Current password is required to make any changes
        if (request.currentPassword() == null || request.currentPassword().isBlank()) {
            throw new BusinessException("Current password is required to update your profile");
        }

        if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            throw new BusinessException("Current password is incorrect");
        }

        // Update username if provided and different
        if (request.username() != null && !request.username().isBlank()) {
            if (!request.username().equals(user.getUsername())) {
                if (userRepository.existsByUsername(request.username())) {
                    throw new BusinessException("This username is already taken");
                }
                user.setUsername(request.username());
            }
        }

        // Update email if provided and different
        if (request.email() != null && !request.email().isBlank()) {
            if (!request.email().equalsIgnoreCase(user.getEmail())) {
                if (userRepository.existsByEmail(request.email())) {
                    throw new BusinessException("This email is already registered");
                }
                user.setEmail(request.email());
            }
        }

        // Update phone if provided and different — admin has no phone requirement
        if (request.phoneNumber() != null && !request.phoneNumber().isBlank()) {
            if (!request.phoneNumber().equals(user.getPhoneNumber())) {
                if (userRepository.existsByPhoneNumber(request.phoneNumber())) {
                    throw new BusinessException("This phone number is already registered");
                }
                user.setPhoneNumber(request.phoneNumber());
            }
        }

        // Update password if new one provided
        if (request.newPassword() != null && !request.newPassword().isBlank()) {
            if (passwordEncoder.matches(request.newPassword(), user.getPasswordHash())) {
                throw new BusinessException(
                        "New password must be different from current password");
            }
            user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        }

        userRepository.save(user);
        return mapToResponse(user);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // DELETE ACCOUNT
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional
    public ApiResponse deleteAccount(Long userId, DeleteAccountRequest request) {
        User user = findUserById(userId);

        // Must type DELETE to confirm
        if (!"DELETE".equals(request.confirmation())) {
            throw new BusinessException(
                    "Please type DELETE to confirm account deletion");
        }

        // Must provide correct password
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new BusinessException("Incorrect password");
        }

        // Delete all related data first (cascades handle most,
        // but OTPs need explicit delete due to relationship)
        otpCodeRepository.deleteAllByUser(user);

        // Delete the user — cascades will remove goals, transactions,
        // story progress, and responses automatically
        userRepository.delete(user);

        return new ApiResponse(true,
                "Your account has been permanently deleted.");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PRIVATE HELPERS
    // ─────────────────────────────────────────────────────────────────────────

    private User findUserById(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private UserResponse mapToResponse(User user) {
        return new UserResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getPhoneNumber(),
                user.getIsAdmin(),
                // Admin has no cash balance — return null
                user.getIsAdmin() ? null : user.getCashBalance(),
                user.getCreatedAt()
        );
    }
}