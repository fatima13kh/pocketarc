// src/pages/UserDashboard.jsx
import { useDashboard } from '../context/DashboardContext';
import Navbar from '../components/layout/Navbar';
import PageBanner from '../components/layout/PageBanner';
import Footer from '../components/layout/Footer';
import Spinner from '../components/common/Spinner';
import Alert from '../components/common/Alert';
import StatCard from '../components/dashboard/StatCard';
import UserLineChartComponent from '../components/dashboard/UserLineChartComponent';
import PieChartComponent from '../components/dashboard/PieChartComponent';
import BarChartComponent from '../components/dashboard/BarChartComponent';
import { useEffect, useRef } from 'react';

export default function UserDashboard() {
  const { userDashboard, loading, error, refreshDashboard } = useDashboard();
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

  if (loading && !userDashboard) {
    return (
      <div className="page-wrapper">
        <Navbar />
        <PageBanner title="Dashboard" />
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
        <PageBanner title="Dashboard" />
        <div style={{ padding: '40px' }}>
          <Alert message={error} />
        </div>
        <Footer />
      </div>
    );
  }

  if (!userDashboard) return null;

  const {
    username,
    cashBalance,
    totalInvestments,
    totalSharesOwned,
    totalSavingsGoals,
    totalStoryRewards,
    netWorthHistory,
    portfolioAllocation,
    goalsProgress,
    monthlyActivity,
    recentTransactions,
    recentStories
  } = userDashboard;

  // Prepare data for chart - 3 lines: Cash Balance, Investments, Stories Earned
  const netWorthData = netWorthHistory?.map(point => ({
    date: point.date,
    'Cash Balance': point.cashBalance,
    'Investments': point.investmentsValue,
    'Stories Earned': point.storyRewards || 0
  })) || [];

  const monthlyData = monthlyActivity?.map(activity => ({
    month: activity.month,
    'Deposits (Buy)': activity.deposits,
    'Withdrawals (Sell)': activity.withdrawals
  })) || [];

  const portfolioData = portfolioAllocation?.map(allocation => ({
    name: allocation.symbol,
    value: allocation.value,
    percentage: allocation.percentage,
    sector: allocation.sector
  })) || [];

  // Get goals that are NOT completed (progress < 100%)
  const activeGoals = (goalsProgress || [])
    .filter(goal => goal.progressPercent < 100)
    .sort((a, b) => b.progressPercent - a.progressPercent)
    .slice(0, 4);

  const completedGoals = (goalsProgress || []).filter(goal => goal.progressPercent >= 100).length;

  return (
    <div className="page-wrapper">
      <Navbar />
      <PageBanner title={`Welcome back, ${username}!`} />

      <div className="dashboard-container">
       

        {/* Row 1: Main Financial Stats - 5 cards */}
        <div className="dashboard-stats-grid">
          <StatCard 
            title="Cash Balance (BHD)" 
            value={cashBalance} 
            icon={null}
            color="cash"
          />
          <StatCard 
            title="Investments Value (BHD)" 
            value={totalInvestments} 
            icon={null}
            color="investments"
          />
          <StatCard 
            title="Total Shares Owned" 
            value={totalSharesOwned?.toFixed(4)} 
            icon={null}
            color="primary"
          />
          <StatCard 
            title="Total Saved (BHD)" 
            value={totalSavingsGoals} 
            icon={null}
            color="goals"
          />
          <StatCard 
            title="Stories Earned (BHD)" 
            value={totalStoryRewards || 0} 
            icon={null}
            color="profit"
          />
        </div>

        {/* Row 2: Growth Chart - 3 lines: Cash, Investments, Stories Earned */}
        <div className="dashboard-full-width">
          <UserLineChartComponent 
            data={netWorthData}
            lines={[
              { dataKey: 'Cash Balance', name: 'Cash Balance', color: '#0f766e' },
              { dataKey: 'Investments', name: 'Investments', color: '#f59e0b' },
              { dataKey: 'Stories Earned', name: 'Stories Earned', color: '#2d7a4f' }
            ]}
            title="Financial Growth (Cash + Investments + Stories)"
            valuePrefix=""
            valueSuffix=" BHD"
          />
        </div>

        {/* Row 3: Portfolio Allocation + Monthly Activity */}
        <div className="dashboard-two-columns">
          <PieChartComponent 
            data={portfolioData}
            title="Portfolio by Sector"
            valuePrefix=""
            valueSuffix=" BHD"
            nameKey="name"
          />
          <BarChartComponent 
            data={monthlyData}
            bars={[
              { dataKey: 'Deposits (Buy)', name: 'Deposits (Buy)', color: '#2d7a4f' },
              { dataKey: 'Withdrawals (Sell)', name: 'Withdrawals (Sell)', color: '#dc2626' }
            ]}
            xKey="month"
            title="Monthly Activity"
            valuePrefix=""
            valueSuffix=" BHD"
            layout="horizontal"
          />
        </div>

        {/* Row 4: Goals Progress */}
        <div className="dashboard-goals-section">
          <div className="goals-section-header">
            <h3>Goals Progress</h3>
            {completedGoals > 0 && (
              <span className="completed-goals-badge">
                 {completedGoals} completed
              </span>
            )}
          </div>
          <div className="goals-progress-list">
            {activeGoals.length > 0 ? (
              activeGoals.map((goal, index) => {
                const remaining = goal.targetAmount - goal.currentAmount;
                return (
                  <div key={index} className="goal-progress-item">
                    <div className="goal-progress-header">
                      <span className="goal-name" title={goal.goalName}>
                        {goal.goalName.length > 20 ? goal.goalName.substring(0, 20) + '...' : goal.goalName}
                      </span>
                      <span className="goal-amounts">
                        {goal.currentAmount.toLocaleString()} / {goal.targetAmount.toLocaleString()} BHD
                      </span>
                    </div>
                    <div className="goal-progress-bar-container">
                      <div 
                        className="goal-progress-bar-fill" 
                        style={{ width: `${goal.progressPercent}%` }}
                      />
                    </div>
                    <div className="goal-progress-footer">
                      <span className="goal-progress-percent">{goal.progressPercent}%</span>
                      <span className="goal-remaining">{remaining.toLocaleString()} BHD left</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="no-active-goals-message">
                <p className="sub-message">Create new goals to save more</p>
              </div>
            )}
          </div>
        </div>

        {/* Row 5: Recent Activity */}
        <div className="dashboard-two-columns">
          <div className="recent-card">
            <h3>Recent Transactions</h3>
            {recentTransactions?.length > 0 ? (
              <div className="recent-list">
                {recentTransactions.slice(0, 5).map((tx, index) => (
                  <div key={index} className="recent-item">
                    <div className="recent-info">
                      <span className="recent-symbol">{tx.symbol}</span>
                      <span className="recent-type">{tx.type}</span>
                      <span className="recent-shares">{tx.shares?.toFixed(4)} shares</span>
                    </div>
                    <div className="recent-amount">{tx.amount?.toLocaleString()} BHD</div>
                    <div className="recent-date">{tx.date}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="recent-empty">No transactions yet</div>
            )}
          </div>

          <div className="recent-card">
            <h3>Recent Stories</h3>
            {recentStories?.length > 0 ? (
              <div className="recent-list">
                {recentStories.slice(0, 5).map((story, index) => (
                  <div key={index} className="recent-item">
                    <div className="recent-info">
                      <span className="recent-title">{story.title}</span>
                    </div>
                    <div className={`recent-amount ${story.reward >= 0 ? 'positive' : ''}`}>
                      {story.reward >= 0 ? '+' : ''}{story.reward?.toLocaleString()} BHD
                    </div>
                    <div className="recent-date">{story.completedAt}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="recent-empty">No stories completed yet</div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}