// src/hooks/usePortfolioStats.js
import { useState, useEffect, useCallback } from 'react';
import axiosClient from '../api/axiosClient';
import { investmentApi } from '../api/investmentApi';

export function usePortfolioStats() {
  const [cashBalance, setCashBalance] = useState(0);
  const [holdingsValue, setHoldingsValue] = useState(0);
  const [unrealizedProfitLoss, setUnrealizedProfitLoss] = useState(0);
  const [realizedProfitLoss, setRealizedProfitLoss] = useState(0);
  const [totalNetWorth, setTotalNetWorth] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const calculateRealizedProfitLoss = useCallback(async (userId) => {
    try {
      // Get all sell transactions and calculate realized P&L
      const response = await axiosClient.get(`/investments/realized-pl`);
      return response.data;
    } catch (err) {
      console.error('Failed to calculate realized P&L:', err);
      return { totalRealizedProfit: 0, totalRealizedLoss: 0 };
    }
  }, []);

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // Get user info with cash balance
      const userRes = await axiosClient.get('/users/me');
      const userCashBalance = userRes.data.cashBalance || 0;
      setCashBalance(userCashBalance);

      // Get portfolio with current holdings
      const portfolioRes = await investmentApi.getPortfolio();
      const portfolioData = portfolioRes.data;
      
      // Current holdings value (stocks you still own)
      const currentHoldingsValue = portfolioData.totalValueBhd || 0;
      setHoldingsValue(currentHoldingsValue);
      
      // Unrealized P&L from current holdings (paper profit/loss)
      const unrealizedPL = portfolioData.totalProfitLossBhd || 0;
      setUnrealizedProfitLoss(unrealizedPL);
      
      // Get realized P&L from backend (calculated from sell transactions)
      const realizedRes = await axiosClient.get('/investments/realized-pl');
      const realizedPL = realizedRes.data.netRealizedPL || 0;
      setRealizedProfitLoss(realizedPL);
      
      // Total Net Worth = Cash Balance + Current Holdings Value
      // IMPORTANT: This does NOT include unrealized P&L separately because
      // the holdings value already reflects current market price
      const netWorth = userCashBalance + currentHoldingsValue;
      setTotalNetWorth(netWorth);
      
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load portfolio statistics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const refresh = () => {
    loadStats();
  };

  return {
    cashBalance,
    holdingsValue,
    unrealizedProfitLoss,
    realizedProfitLoss,
    totalNetWorth,
    loading,
    error,
    refresh
  };
}