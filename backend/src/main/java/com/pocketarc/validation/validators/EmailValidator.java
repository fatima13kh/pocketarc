package com.pocketarc.validation.validators;

import com.pocketarc.validation.annotations.ValidEmail;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class EmailValidator
        implements ConstraintValidator<ValidEmail, String> {

    private static final String EMAIL_PATTERN =
            "^[a-zA-Z0-9._%+\\-]+@(gmail\\.com|outlook\\.com|hotmail\\.com)$";

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        if (value == null || value.isBlank()) return false;
        return value.toLowerCase().matches(EMAIL_PATTERN);
    }
}