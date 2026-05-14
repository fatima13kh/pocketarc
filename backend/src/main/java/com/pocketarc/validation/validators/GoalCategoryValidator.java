package com.pocketarc.validation.validators;

import com.pocketarc.model.enums.GoalCategory;
import com.pocketarc.validation.annotations.ValidGoalCategory;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class GoalCategoryValidator implements ConstraintValidator<ValidGoalCategory, String> {

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        if (value == null || value.isBlank()) return false;
        try {
            GoalCategory.valueOf(value.toUpperCase());
            return true;
        } catch (IllegalArgumentException e) {
            return false;
        }
    }
}