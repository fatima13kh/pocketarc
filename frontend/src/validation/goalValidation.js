// src/validation/goalValidation.js

export const validateGoalName = (name) => {
  if (!name || !name.trim()) {
    return 'Goal name is required';
  }
  if (name.length < 2) {
    return 'Goal name must be at least 2 characters';
  }
  if (name.length > 50) {
    return 'Goal name cannot exceed 50 characters';
  }
  return null;
};

export const validateTargetAmount = (amount) => {
  if (!amount) {
    return 'Target amount is required';
  }
  const numAmount = parseFloat(amount);
  if (isNaN(numAmount)) {
    return 'Please enter a valid number';
  }
  if (numAmount <= 0) {
    return 'Target amount must be greater than 0';
  }
  if (numAmount > 10000000) {
    return 'Target amount cannot exceed 10,000,000 BHD';
  }
  return null;
};

export const validateGoalCategory = (category) => {
  if (!category) {
    return 'Please select a category';
  }
  return null;
};

export const validateAddFunds = (amount, cashBalance, remainingToGoal) => {
  const numAmount = parseFloat(amount);
  if (!amount) {
    return 'Amount is required';
  }
  if (isNaN(numAmount)) {
    return 'Please enter a valid number';
  }
  if (numAmount <= 0) {
    return 'Amount must be greater than 0';
  }
  if (numAmount > cashBalance) {
    return `Insufficient balance. You have ${cashBalance.toLocaleString()} BHD`;
  }
  if (remainingToGoal !== undefined && numAmount > remainingToGoal) {
    return `You only need ${remainingToGoal.toLocaleString()} BHD to reach your goal`;
  }
  return null;
};

export const validateGoalForm = (form) => {
  const errors = {};
  
  const nameError = validateGoalName(form.name);
  if (nameError) errors.name = nameError;
  
  const amountError = validateTargetAmount(form.targetAmount);
  if (amountError) errors.targetAmount = amountError;
  
  const categoryError = validateGoalCategory(form.category);
  if (categoryError) errors.category = categoryError;
  
  return errors;
};