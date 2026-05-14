package com.pocketarc.validation.annotations;

import com.pocketarc.validation.validators.GoalCategoryValidator;
import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.*;

@Documented
@Constraint(validatedBy = GoalCategoryValidator.class)
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
public @interface ValidGoalCategory {
    String message() default "Invalid goal category";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}