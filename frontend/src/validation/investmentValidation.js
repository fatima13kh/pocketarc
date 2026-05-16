export const validateBuyAmount = (amount, pricePerShare, cashBalance) => {
  const numAmount = parseFloat(amount);
  
  if (!amount || amount === '') {
    return 'Please enter an amount';
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
  return null;
};