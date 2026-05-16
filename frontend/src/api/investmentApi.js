// src/api/investmentApi.js
import axiosClient from './axiosClient';

export const investmentApi = {
  searchStocks: (query) =>
    axiosClient.get('/investments/search', { params: { query } }),

  getPopularStocks: () =>
    axiosClient.get('/investments/top'),

  getStockQuote: async (symbol) => {
    try {
      const response = await axiosClient.get(`/investments/quote/${symbol}`);
      return response;
    } catch (error) {
      console.error('Failed to get stock quote:', error);
      throw error;
    }
  },

  getStockHistory: (symbol) =>
    axiosClient.get(`/investments/history/${symbol}`),

  buyStock: (data) =>
    axiosClient.post('/investments/buy', data),

  sellStock: (data) =>
    axiosClient.post('/investments/sell', data),

  getPortfolio: () =>
    axiosClient.get('/investments/portfolio'),

  getHoldings: () =>
    axiosClient.get('/investments/holdings'),
};