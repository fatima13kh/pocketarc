package com.pocketarc.dto.request;

import jakarta.validation.constraints.*;

public record UpdateProfileRequest(

        @Size(min = 3, max = 50, message = "Username must be at least 3 characters")
        @Pattern(
                regexp = "^[a-zA-Z0-9_]+$",
                message = "Username can only contain letters, numbers, and underscores"
        )
        String username,

        @Email(message = "Invalid email format")
        @Pattern(
                regexp = "^[a-zA-Z0-9._%+\\-]+@(gmail\\.com|outlook\\.com|hotmail\\.com)$",
                message = "Only Gmail, Outlook, or Hotmail addresses are accepted"
        )
        String email,

        @Pattern(
                regexp = "^[0-9]{8}$",
                message = "Phone number must be exactly 8 digits"
        )
        String phoneNumber,

        // Must provide current password to make any changes
        String currentPassword,

        @Size(min = 8, message = "Password must be at least 8 characters")
        @Pattern(
                regexp = "^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>\\/?]).{8,}$",
                message = "Password must contain at least one uppercase letter, one number, and one special character"
        )
        String newPassword

) {}