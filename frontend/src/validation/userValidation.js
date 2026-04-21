// src/validation/userValidation.js

export const validateUsername = (username) => {
  if (!username) return 'Username is required';
  if (username.length < 3) return 'Username must be at least 3 characters';
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return 'Only letters, numbers, and underscores allowed';
  }
  return null;
};

export const validateEmail = (email) => {
  if (!email) return 'Email is required';
  if (!/^[^\s@]+@(gmail\.com|outlook\.com|hotmail\.com)$/i.test(email)) {
    return 'Only Gmail, Outlook, or Hotmail addresses accepted';
  }
  return null;
};

export const validatePhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return 'Phone number is required';
  if (!/^[0-9]{8}$/.test(phoneNumber)) {
    return 'Phone number must be exactly 8 digits (e.g., 39994093)';
  }
  return null;
};

export const validatePassword = (password) => {
  if (!password) return 'Password is required';
  if (password.length < 8) return 'Password must be at least 8 characters';
  if (!/(?=.*[A-Z])/.test(password)) {
    return 'Password must include at least 1 uppercase letter';
  }
  if (!/(?=.*[0-9])/.test(password)) {
    return 'Password must include at least 1 number';
  }
  if (!/(?=.*[!@#$%^&*])/.test(password)) {
    return 'Password must include at least 1 special character (!@#$%^&*)';
  }
  return null;
};

export const validateConfirmPassword = (password, confirmPassword) => {
  if (!confirmPassword) return 'Please confirm your password';
  if (password !== confirmPassword) return 'Passwords do not match';
  return null;
};

export const validateLogin = (email, password) => {
  const errors = {};
  if (!email) errors.email = 'Email is required';
  if (!password) errors.password = 'Password is required';
  return errors;
};

export const validateRegister = (form) => {
  const errors = {};
  
  const usernameError = validateUsername(form.username);
  if (usernameError) errors.username = usernameError;
  
  const emailError = validateEmail(form.email);
  if (emailError) errors.email = emailError;
  
  const phoneError = validatePhoneNumber(form.phoneNumber);
  if (phoneError) errors.phoneNumber = phoneError;
  
  const passwordError = validatePassword(form.password);
  if (passwordError) errors.password = passwordError;
  
  const confirmError = validateConfirmPassword(form.password, form.confirmPassword);
  if (confirmError) errors.confirmPassword = confirmError;
  
  return errors;
};