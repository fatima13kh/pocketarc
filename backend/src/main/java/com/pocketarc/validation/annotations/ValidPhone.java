package com.pocketarc.validation.annotations;

import com.pocketarc.validation.validators.PhoneValidator;
import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.*;

@Documented
@Constraint(validatedBy = PhoneValidator.class)
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
public @interface ValidPhone {
    String message() default "Phone number must be exactly 8 digits";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}