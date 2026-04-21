package com.pocketarc.service;

import com.pocketarc.dto.request.*;
import com.pocketarc.dto.response.*;
import com.pocketarc.exception.*;
import com.pocketarc.model.*;
import com.pocketarc.repository.*;
import com.pocketarc.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final OtpCodeRepository otpCodeRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    private static final BigDecimal STARTING_BALANCE = new BigDecimal("500.00");
    private static final int OTP_EXPIRY_MINUTES = 15;
    

    // ─────────────────────────────────────────────────────────────────────────
    // REGISTER
    // ─────────────────────────────────────────────────────────────────────────

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
                .isVerified(false)
                .cashBalance(BigDecimal.ZERO)
                .build();

        userRepository.save(user);
        sendOtp(user);

        return new ApiResponse(true,
                "Registration successful. Please check your email for the verification code.");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // VERIFY OTP
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional
    public AuthResponse verifyOtp(VerifyOtpRequest request) {

        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (user.getIsVerified()) {
            throw new BusinessException("This account is already verified");
        }

        OtpCode otp = otpCodeRepository
                .findTopByUserAndIsUsedFalseAndExpiresAtAfterOrderByCreatedAtDesc(
                        user, LocalDateTime.now())
                .orElseThrow(() -> new BusinessException(
                        "Verification code has expired. Please request a new one."));

        if (!otp.getCode().equals(request.code())) {
            throw new BusinessException("Incorrect verification code");
        }

        otp.setIsUsed(true);
        otpCodeRepository.save(otp);

        user.setIsVerified(true);
        user.setCashBalance(STARTING_BALANCE);
        userRepository.save(user);

        String token = jwtTokenProvider.generateToken(
                user.getId(), user.getEmail(), user.getIsAdmin());

        return new AuthResponse(
                token,
                user.getUsername(),
                user.getEmail(),
                user.getIsAdmin());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // RESEND OTP
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional
    public ApiResponse resendOtp(ResendOtpRequest request) {

        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (user.getIsVerified()) {
            throw new BusinessException("This account is already verified");
        }

        // Invalidate all previous OTPs for this user
        otpCodeRepository.deleteAllByUser(user);

        sendOtp(user);

        return new ApiResponse(true,
                "A new verification code has been sent to your email.");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // LOGIN
    // ─────────────────────────────────────────────────────────────────────────

    public AuthResponse login(LoginRequest request) {

        // Always same message — never reveal if email exists or not
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new UnauthorizedException(
                        "Invalid email or password"));

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new UnauthorizedException("Invalid email or password");
        }

        // Regular users must verify email first — admin skips this
        if (!user.getIsAdmin() && !user.getIsVerified()) {
            throw new UnauthorizedException(
                    "Please verify your email before logging in. Check your inbox.");
        }

        String token = jwtTokenProvider.generateToken(
                user.getId(), user.getEmail(), user.getIsAdmin());

        return new AuthResponse(
                token,
                user.getUsername(),
                user.getEmail(),
                user.getIsAdmin());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // FORGOT PASSWORD
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional
    public ApiResponse forgotPassword(ForgotPasswordRequest request) {

        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No account found with this email address"));

        // Invalidate any existing OTPs
        otpCodeRepository.deleteAllByUser(user);

        sendOtp(user);

        return new ApiResponse(true,
                "A password reset code has been sent to your email.");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // RESET PASSWORD
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional
    public ApiResponse resetPassword(ResetPasswordRequest request) {

        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        OtpCode otp = otpCodeRepository
                .findTopByUserAndIsUsedFalseAndExpiresAtAfterOrderByCreatedAtDesc(
                        user, LocalDateTime.now())
                .orElseThrow(() -> new BusinessException(
                        "Reset code has expired. Please request a new one."));

        if (!otp.getCode().equals(request.code())) {
            throw new BusinessException("Incorrect reset code");
        }

        otp.setIsUsed(true);
        otpCodeRepository.save(otp);

        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);

        return new ApiResponse(true,
                "Password reset successfully. You can now log in.");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PRIVATE HELPER
    // ─────────────────────────────────────────────────────────────────────────

    private void sendOtp(User user) {
        String code = String.format("%06d",
                new SecureRandom().nextInt(1_000_000));

        OtpCode otpCode = OtpCode.builder()
                .user(user)
                .code(code)
                .expiresAt(LocalDateTime.now().plusMinutes(OTP_EXPIRY_MINUTES))
                .isUsed(false)
                .build();

        otpCodeRepository.save(otpCode);
        emailService.sendOtpEmail(user.getEmail(), user.getUsername(), code);
    }
}