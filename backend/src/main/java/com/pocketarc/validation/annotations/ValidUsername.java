package com.pocketarc.validation.annotations;

import com.pocketarc.validation.validators.UsernameValidator;
import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.*;

@Documented
@Constraint(validatedBy = UsernameValidator.class)
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
public @interface ValidUsername {
    String message() default "Username must be 3-50 characters and contain only letters, numbers, and underscores";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}