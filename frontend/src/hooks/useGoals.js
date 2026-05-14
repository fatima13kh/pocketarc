// src/hooks/useGoals.js
import { useState, useEffect, useCallback } from 'react';
import axiosClient from '../api/axiosClient';

export function useGoals() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cashBalance, setCashBalance] = useState(0);

  const loadGoals = useCallback(async () => {
    setLoading(true);
    try {
      const [goalsRes, userRes] = await Promise.all([
        axiosClient.get('/goals'),
        axiosClient.get('/users/me')
      ]);
      setGoals(goalsRes.data || []);
      setCashBalance(userRes.data.cashBalance || 0);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load goals');
    } finally {
      setLoading(false);
    }
  }, []);

  const createGoal = useCallback(async (formData) => {
    try {
      const res = await axiosClient.post('/goals', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      await loadGoals();
      return { success: true, data: res.data };
    } catch (err) {
      return { success: false, error: err.response?.data?.error || 'Failed to create goal' };
    }
  }, [loadGoals]);

  const addFunds = useCallback(async (goalId, amount) => {
    try {
      const res = await axiosClient.post(`/goals/${goalId}/add-funds`, null, {
        params: { amount }
      });
      await loadGoals();
      return { success: true, data: res.data };
    } catch (err) {
      return { success: false, error: err.response?.data?.error || 'Failed to add funds' };
    }
  }, [loadGoals]);

  const updateGoal = useCallback(async (goalId, data) => {
    try {
      const res = await axiosClient.put(`/goals/${goalId}`, data);
      await loadGoals();
      return { success: true, data: res.data };
    } catch (err) {
      return { success: false, error: err.response?.data?.error || 'Failed to update goal' };
    }
  }, [loadGoals]);

  const deleteGoal = useCallback(async (goalId) => {
    try {
      await axiosClient.delete(`/goals/${goalId}`);
      await loadGoals();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.error || 'Failed to delete goal' };
    }
  }, [loadGoals]);

  useEffect(() => {
    loadGoals();
  }, [loadGoals]);

  const totalSaved = goals.reduce((sum, g) => sum + (g.currentAmount || 0), 0);
  const totalTarget = goals.reduce((sum, g) => sum + (g.targetAmount || 0), 0);
  const overallProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

  return {
    goals,
    loading,
    error,
    cashBalance,
    totalSaved,
    totalTarget,
    overallProgress,
    loadGoals,
    createGoal,
    addFunds,
    updateGoal,
    deleteGoal,
  };
}