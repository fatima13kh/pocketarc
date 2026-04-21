package com.pocketarc.validation.annotations;

import com.pocketarc.validation.validators.PasswordValidator;
import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.*;

@Documented
@Constraint(validatedBy = PasswordValidator.class)
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
public @interface ValidPassword {
    String message() default "Password must be at least 8 characters and contain at least one uppercase letter, one number, and one special character";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}