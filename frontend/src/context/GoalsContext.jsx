// src/context/GoalsContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axiosClient from '../api/axiosClient';
import { useAuth } from './AuthContext';

const GoalsContext = createContext(null);

export function GoalsProvider({ children }) {
  const { user } = useAuth(); // Get user from auth context
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cashBalance, setCashBalance] = useState(0);

  const loadGoals = useCallback(async () => {
    // Only load goals if user is logged in AND verified
    if (!user || !user.email) {
      setLoading(false);
      return;
    }
    
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
      // Don't show error for 401/403 during initial load
      if (err.response?.status !== 401 && err.response?.status !== 403) {
        setError(err.response?.data?.error || 'Failed to load goals');
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Only load when user exists
  useEffect(() => {
    if (user) {
      loadGoals();
    }
  }, [user, loadGoals]);

  // Rest of your code remains the same...
  const createGoal = useCallback(async (formData) => {
    try {
      const res = await axiosClient.post('/goals', formData);
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

  const updateGoal = useCallback(async (goalId, formData) => {
    try {
      const res = await axiosClient.put(`/goals/${goalId}`, formData);
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

  const totalSaved = goals.reduce((sum, g) => sum + (g.currentAmount || 0), 0);
  const totalTarget = goals.reduce((sum, g) => sum + (g.targetAmount || 0), 0);
  const overallProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

  const value = {
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

  return (
    <GoalsContext.Provider value={value}>
      {children}
    </GoalsContext.Provider>
  );
}

export function useGoals() {
  const context = useContext(GoalsContext);
  if (!context) {
    throw new Error('useGoals must be used within a GoalsProvider');
  }
  return context;
}