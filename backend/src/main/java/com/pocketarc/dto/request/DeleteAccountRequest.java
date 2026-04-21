package com.pocketarc.dto.request;

import jakarta.validation.constraints.*;

public record DeleteAccountRequest(

        // Must type "DELETE" to confirm
        @NotBlank(message = "Confirmation is required")
        String confirmation,

        // Must provide password to delete
        @NotBlank(message = "Password is required")
        String password

) {}