import axiosClient from './axiosClient';

export const investmentApi = {
  // Search stocks
  searchStocks: (query) =>
    axiosClient.get('/investments/search', { params: { query } }),

  // Get popular stocks
  getPopularStocks: () =>
    axiosClient.get('/investments/top'),

  // Get stock quote - Now returns complete StockSearchResponse
  getStockQuote: async (symbol) => {
    try {
      const response = await axiosClient.get(`/investments/quote/${symbol}`);
      // The backend now returns the complete stock data
      return response;
    } catch (error) {
      console.error('Failed to get stock quote:', error);
      throw error;
    }
  },

  // Get stock price history
  getStockHistory: (symbol) =>
    axiosClient.get(`/investments/history/${symbol}`),

  // Buy stock
  buyStock: (data) =>
    axiosClient.post('/investments/buy', data),

  // Sell stock
  sellStock: (data) =>
    axiosClient.post('/investments/sell', data),

  // Get portfolio
  getPortfolio: () =>
    axiosClient.get('/investments/portfolio'),

  // Get holdings
  getHoldings: () =>
    axiosClient.get('/investments/holdings'),
};

export const dashboardApi = {
  getSummary: () =>
    axiosClient.get('/dashboard/summary'),
};