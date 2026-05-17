// src/api/dashboardApi.js
import axiosClient from './axiosClient';

export const dashboardApi = {
  getDashboard: () =>
    axiosClient.get('/dashboard'),
};