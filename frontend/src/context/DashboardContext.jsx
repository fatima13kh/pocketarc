// src/context/DashboardContext.jsx
import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { dashboardApi } from '../api/dashboardApi';
import { useAuth } from './AuthContext';

const DashboardContext = createContext(null);

export function DashboardProvider({ children }) {
  const { user } = useAuth();
  const [userDashboard, setUserDashboard] = useState(null);
  const [adminDashboard, setAdminDashboard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastRefresh, setLastRefresh] = useState(null);
  
  // Use ref to track if initial load has happened
  const initialLoadDone = useRef(false);

  const loadDashboard = useCallback(async (force = false) => {
    if (!user) return;
    
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
      setLastRefresh(new Date());
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Auto-refresh when user changes or after updates
  useEffect(() => {
    if (user && !initialLoadDone.current) {
      initialLoadDone.current = true;
      loadDashboard();
    }
  }, [user, loadDashboard]);

  // Function to force refresh from any component
  const refreshDashboard = useCallback(async () => {
    await loadDashboard(true);
  }, [loadDashboard]);

  // Set up event listener for goal/investment/story updates
  useEffect(() => {
    const handleRefresh = () => {
      refreshDashboard();
    };

    // Listen for custom events that might indicate data changes
    window.addEventListener('goal-updated', handleRefresh);
    window.addEventListener('investment-updated', handleRefresh);
    window.addEventListener('story-updated', handleRefresh);
    window.addEventListener('profile-updated', handleRefresh);

    return () => {
      window.removeEventListener('goal-updated', handleRefresh);
      window.removeEventListener('investment-updated', handleRefresh);
      window.removeEventListener('story-updated', handleRefresh);
      window.removeEventListener('profile-updated', handleRefresh);
    };
  }, [refreshDashboard]);

  const value = {
    userDashboard,
    adminDashboard,
    loading,
    error,
    refreshDashboard,
    lastRefresh,
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