// utils/projectionCalculator.js

/**
 * Calculate average monthly contribution based on actual add-funds history
 * @param {Object} goal - The goal object with currentAmount and createdAt
 * @returns {Object} - Average monthly contribution and related stats
 */
export const calculateAverageContribution = (goal) => {
  if (!goal || !goal.createdAt) {
    return { avgMonthly: 0, monthsSinceCreation: 0, totalAdded: 0 };
  }
  
  const createdAt = new Date(goal.createdAt);
  const today = new Date();
  
  // Calculate exact months since creation
  const monthDiff = (today.getFullYear() - createdAt.getFullYear()) * 12;
  const monthDiff2 = monthDiff + (today.getMonth() - createdAt.getMonth());
  const dayDiff = today.getDate() - createdAt.getDate();
  const monthsSinceCreation = monthDiff2 + (dayDiff / 30.44);
  
  const finalMonths = Math.max(0.5, monthsSinceCreation);
  
  // Total added is the currentAmount
  const totalAdded = goal.currentAmount;
  
  // Average monthly contribution
  const avgMonthly = totalAdded / finalMonths;
  
  return {
    avgMonthly: Math.round(avgMonthly),
    monthsSinceCreation: Math.round(finalMonths * 10) / 10,
    totalAdded: totalAdded
  };
};

/**
 * Calculate projection to reach goal based on average monthly contribution
 * @param {Object} goal - The goal object
 * @returns {Object} - Projection details
 */
export const calculateProjection = (goal) => {
  if (!goal) return null;
  
  const remaining = goal.targetAmount - goal.currentAmount;
  
  if (remaining <= 0) {
    return {
      remaining: 0,
      monthlyContribution: 0,
      monthsNeeded: 0,
      completionDate: new Date(),
      formattedDate: 'Goal reached!',
      avgMonthly: 0
    };
  }
  
  const { avgMonthly } = calculateAverageContribution(goal);
  
  if (avgMonthly <= 0) {
    return {
      remaining: remaining,
      monthlyContribution: 0,
      monthsNeeded: null,
      completionDate: null,
      formattedDate: 'Add funds to see projection',
      avgMonthly: 0
    };
  }
  
  // Calculate exact months needed
  const monthsNeeded = remaining / avgMonthly;
  
  // Calculate completion date
  const completionDate = new Date();
  const exactMonths = monthsNeeded;
  const years = Math.floor(exactMonths / 12);
  const months = Math.floor(exactMonths % 12);
  const days = Math.floor((exactMonths - Math.floor(exactMonths)) * 30);
  
  completionDate.setFullYear(completionDate.getFullYear() + years);
  completionDate.setMonth(completionDate.getMonth() + months);
  completionDate.setDate(completionDate.getDate() + days);
  
  // Format full date: "15 January 2026"
  const formattedDate = completionDate.toLocaleDateString('en-GB', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });
  
  return {
    remaining: remaining,
    monthlyContribution: avgMonthly,
    monthsNeeded: Math.ceil(monthsNeeded),
    exactMonthsNeeded: monthsNeeded,
    completionDate: completionDate,
    formattedDate: formattedDate,
    avgMonthly: avgMonthly
  };
};

/**
 * Generate data for the projection chart
 * @param {Object} goal - The goal object
 * @param {number} monthlyContribution - Monthly contribution amount
 * @param {number} maxMonths - Maximum months to show (default 24)
 * @returns {Array} - Chart data points
 */
export const generateChartData = (goal, monthlyContribution, maxMonths = 24) => {
  if (!goal || monthlyContribution <= 0) return [];
  
  const data = [];
  let currentAmount = goal.currentAmount;
  const targetAmount = goal.targetAmount;
  const startDate = new Date();
  
  // Add starting point (current month)
  data.push({
    month: startDate.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }),
    amount: Math.round(currentAmount),
    isCurrent: true
  });
  
  // Calculate how many months needed to reach target
  const remaining = targetAmount - currentAmount;
  const monthsToTarget = Math.ceil(remaining / monthlyContribution);
  const monthsToShow = Math.min(monthsToTarget, maxMonths);
  
  // Generate projection points
  for (let i = 1; i <= monthsToShow; i++) {
    const projectedDate = new Date();
    projectedDate.setMonth(projectedDate.getMonth() + i);
    
    currentAmount = currentAmount + monthlyContribution;
    
    data.push({
      month: projectedDate.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }),
      amount: Math.min(Math.round(currentAmount), targetAmount),
      isProjected: true,
      reachedTarget: currentAmount >= targetAmount
    });
    
    // Stop if we've reached the target
    if (currentAmount >= targetAmount) break;
  }
  
  return data;
};

/**
 * Get target reach month from chart data
 * @param {Array} chartData - Chart data array
 * @returns {string|null} - Month when target is reached
 */
export const getTargetReachMonth = (chartData) => {
  if (!chartData || chartData.length === 0) return null;
  
  for (let i = 0; i < chartData.length; i++) {
    if (chartData[i].amount === chartData[i]?.targetAmount || 
        (i > 0 && chartData[i].amount >= chartData[i - 1]?.amount && chartData[i].amount === chartData[chartData.length - 1]?.amount)) {
      return chartData[i].month;
    }
  }
  return chartData[chartData.length - 1]?.month;
};