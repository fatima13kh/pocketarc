package com.pocketarc.validation.validators;

import com.pocketarc.validation.annotations.ValidUsername;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class UsernameValidator
        implements ConstraintValidator<ValidUsername, String> {

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        if (value == null || value.isBlank()) return false;
        return value.length() >= 3
                && value.length() <= 50
                && value.matches("^[a-zA-Z0-9_]+$");
    }
}