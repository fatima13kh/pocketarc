package com.pocketarc.validation.annotations;

import com.pocketarc.validation.validators.EmailValidator;
import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.*;

@Documented
@Constraint(validatedBy = EmailValidator.class)
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
public @interface ValidEmail {
    String message() default "Only Gmail, Outlook, or Hotmail addresses are accepted";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}