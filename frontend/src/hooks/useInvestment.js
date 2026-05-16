import { useState, useCallback } from 'react';
import { investmentApi } from '../api/investmentApi';

export function useInvestment() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const getPortfolio = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await investmentApi.getPortfolio();
      return { success: true, data: res.data };
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load portfolio');
      return { success: false, error: err.response?.data?.error };
    } finally {
      setLoading(false);
    }
  }, []);

  const sellStock = useCallback(async (data) => {
    setLoading(true);
    setError('');
    try {
      const res = await investmentApi.sellStock(data);
      return { success: true, data: res.data };
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to sell stock');
      return { success: false, error: err.response?.data?.error };
    } finally {
      setLoading(false);
    }
  }, []);

  const buyStock = useCallback(async (data) => {
    setLoading(true);
    setError('');
    try {
      const res = await investmentApi.buyStock(data);
      return { success: true, data: res.data };
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to buy stock');
      return { success: false, error: err.response?.data?.error };
    } finally {
      setLoading(false);
    }
  }, []);

  const getPopularStocks = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await investmentApi.getPopularStocks();
      return { success: true, data: res.data };
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load stocks');
      return { success: false, error: err.response?.data?.error };
    } finally {
      setLoading(false);
    }
  }, []);

  const searchStocks = useCallback(async (query) => {
    setLoading(true);
    setError('');
    try {
      const res = await investmentApi.searchStocks(query);
      return { success: true, data: res.data };
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to search stocks');
      return { success: false, error: err.response?.data?.error };
    } finally {
      setLoading(false);
    }
  }, []);

  const getStockQuote = useCallback(async (symbol) => {
    try {
      const res = await investmentApi.getStockQuote(symbol);
      return { success: true, data: res.data };
    } catch (err) {
      return { success: false, error: err.response?.data?.error };
    }
  }, []);

  const getStockHistory = useCallback(async (symbol) => {
    try {
      const res = await investmentApi.getStockHistory(symbol);
      return { success: true, data: res.data };
    } catch (err) {
      return { success: false, error: err.response?.data?.error };
    }
  }, []);

  return {
    loading,
    error,
    searchStocks,
    getPopularStocks,
    getStockQuote,
    getStockHistory,
    buyStock,
    sellStock,
    getPortfolio,
  };
}