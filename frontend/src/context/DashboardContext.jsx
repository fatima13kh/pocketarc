// src/context/DashboardContext.jsx
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { dashboardApi } from '../api/dashboardApi';
import { useAuth } from './AuthContext';

const DashboardContext = createContext(null);

export function DashboardProvider({ children }) {
  const { user } = useAuth();
  const [userDashboard, setUserDashboard] = useState(null);
  const [adminDashboard, setAdminDashboard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loaded, setLoaded] = useState(false);

  const loadDashboard = useCallback(async (force = false) => {
    // Skip if already loaded and not forcing refresh
    if (loaded && !force) return;
    
    setLoading(true);
    setError('');
    try {
      const res = await dashboardApi.getDashboard();
      if (res.data.totalUsers !== undefined) {
        setAdminDashboard(res.data);
        setUserDashboard(null);
      } else {
        setUserDashboard(res.data);
        setAdminDashboard(null);
      }
      setLoaded(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, [loaded]);

  // Only load once when user is authenticated and dashboard not loaded
  useEffect(() => {
    if (user && !loaded && !loading) {
      loadDashboard();
    }
  }, [user, loaded, loading, loadDashboard]);

  const refreshDashboard = useCallback(() => {
    setLoaded(false);
    loadDashboard(true);
  }, [loadDashboard]);

  const value = {
    userDashboard,
    adminDashboard,
    loading,
    error,
    loadDashboard,  // ADD THIS BACK
    refreshDashboard,
    isAdmin: !!adminDashboard,
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
};