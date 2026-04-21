package com.pocketarc.dto.request;

import jakarta.validation.constraints.*;

public record ResendOtpRequest(

        @NotBlank(message = "Email is required")
        @Email(message = "Invalid email format")
        String email

) {}