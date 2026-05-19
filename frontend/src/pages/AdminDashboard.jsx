// src/pages/AdminDashboard.jsx
import { useEffect, useRef } from 'react';
import { useDashboard } from '../context/DashboardContext';
import Navbar from '../components/layout/Navbar';
import PageBanner from '../components/layout/PageBanner';
import Footer from '../components/layout/Footer';
import Spinner from '../components/common/Spinner';
import Alert from '../components/common/Alert';
import StatCard from '../components/dashboard/StatCard';

export default function AdminDashboard() {
  const { adminDashboard, loading, error, refreshDashboard } = useDashboard();
  const isFirstRender = useRef(true);

  // Refresh when component mounts (coming from login or navigation)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      refreshDashboard();
    }
  }, [refreshDashboard]);

  // Refresh when page becomes visible again (after coming back from another page)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshDashboard();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refreshDashboard]);

  // Refresh when the page is focused (clicking on tab)
  useEffect(() => {
    const handleFocus = () => {
      refreshDashboard();
    };

    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [refreshDashboard]);

  if (loading && !adminDashboard) {
    return (
      <div className="page-wrapper">
        <Navbar />
        <PageBanner title="Admin Dashboard" />
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <Spinner dark />
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-wrapper">
        <Navbar />
        <PageBanner title="Admin Dashboard" />
        <div style={{ padding: '40px' }}>
          <Alert message={error} />
        </div>
        <Footer />
      </div>
    );
  }

  if (!adminDashboard) return null;

  const {
    totalUsers,
    usersJoinedThisMonth,
    totalCashInSystem,
    totalInvestments,
    totalSavings,
    totalTransactions,
    totalBuyTransactions,
    totalSellTransactions,
    totalStoriesPlayed,
    totalStoriesUnplayed,
    totalGoalsCreated,
    totalGoalsReached,
    popularStocks,
    storyPerformance
  } = adminDashboard;

  // Top 5 most played stories
  const topStories = storyPerformance?.slice(0, 5) || [];

  // Top 5 popular stocks
  const topStocks = popularStocks?.slice(0, 5) || [];

  return (
    <div className="page-wrapper">
      <Navbar />
      <PageBanner title="Admin Dashboard" />

      <div className="dashboard-container">

        {/* Row 1: User Statistics */}
        <div className="dashboard-section">
          <h2 className="section-title">User Statistics</h2>
          <div className="dashboard-stats-grid">
            <StatCard title="Total Users" value={totalUsers} icon={null} color="primary" />
            <StatCard title="New Users (30d)" value={usersJoinedThisMonth} icon={null} color="info" />
          </div>
        </div>

        {/* Row 2: Financial Statistics */}
        <div className="dashboard-section">
          <h2 className="section-title">Financial Statistics</h2>
          <div className="dashboard-stats-grid">
            <StatCard title="Total Cash in System (BHD)" value={totalCashInSystem} icon={null} color="cash" />
            <StatCard title="Total Investments (BHD)" value={totalInvestments} icon={null} color="investments" />
            <StatCard title="Total Savings (BHD)" value={totalSavings} icon={null} color="goals" />
          </div>
        </div>

        {/* Row 3: Activity Statistics */}
        <div className="dashboard-section">
          <h2 className="section-title">Activity Statistics</h2>
          <div className="dashboard-stats-grid">
            <StatCard title="Total Transactions" value={totalTransactions} icon={null} color="primary" />
            <StatCard title="Buy Transactions" value={totalBuyTransactions} icon={null} color="success" />
            <StatCard title="Sell Transactions" value={totalSellTransactions} icon={null} color="error" />
            <StatCard title="Stories Played" value={totalStoriesPlayed} icon={null} color="info" />
            <StatCard title="Stories Unplayed" value={totalStoriesUnplayed || 0} icon={null} color="warning" />
            <StatCard title="Goals Created" value={totalGoalsCreated} icon={null} color="warning" />
            <StatCard title="Goals Reached" value={totalGoalsReached || 0} icon={null} color="success" />
          </div>
        </div>

        {/* Row 4: Most Played Stories & Most Popular Stocks - Side by side */}
        <div className="dashboard-two-columns">
          {/* Most Played Stories */}
          <div className="recent-card">
            <h3>Most Played Stories</h3>
            <div className="recent-list">
              {topStories.length > 0 ? (
                topStories.map((story, index) => (
                  <div key={story.id || index} className="recent-item">
                    <div className="recent-info">
                      <span className="recent-title">{story.title?.length > 30 ? story.title.substring(0, 30) + '...' : story.title}</span>
                    </div>
                    <div className="recent-amount">{story.playsCount} plays</div>
                  </div>
                ))
              ) : (
                <div className="recent-empty">No stories played yet</div>
              )}
            </div>
          </div>

          {/* Most Popular Stocks */}
          <div className="recent-card">
            <h3>Most Popular Stocks</h3>
            <div className="recent-list">
              {topStocks.length > 0 ? (
                topStocks.map((stock, index) => {
                  const isPositive = (stock.changePercent || 0) >= 0;
                  const price = stock.currentPriceBhd || 0;
                  const changePercent = stock.changePercent || 0;
                  
                  return (
                    <div key={stock.symbol} className="recent-item">
                      <div className="recent-info">
                        <span className="recent-symbol">{stock.symbol}</span>
                        <span className="recent-title">{stock.companyName?.length > 25 ? stock.companyName.substring(0, 25) + '...' : stock.companyName}</span>
                      </div>
                      <div className="recent-amount">{price.toLocaleString()} BHD</div>
                      <div className={`recent-change ${isPositive ? 'positive' : 'negative'}`}>
                        {isPositive ? '↑' : '↓'} {Math.abs(changePercent).toFixed(2)}%
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="recent-empty">No stocks data available</div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}