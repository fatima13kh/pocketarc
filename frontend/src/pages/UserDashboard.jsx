// src/pages/UserDashboard.jsx
import { useDashboard } from '../context/DashboardContext';
import Navbar from '../components/layout/Navbar';
import PageBanner from '../components/layout/PageBanner';
import Footer from '../components/layout/Footer';
import Spinner from '../components/common/Spinner';
import Alert from '../components/common/Alert';
import StatCard from '../components/dashboard/StatCard';
import LineChartComponent from '../components/dashboard/LineChartComponent';
import PieChartComponent from '../components/dashboard/PieChartComponent';
import BarChartComponent from '../components/dashboard/BarChartComponent';

export default function UserDashboard() {
  const { userDashboard, loading, error } = useDashboard();

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
    netWorthHistory,
    portfolioAllocation,
    goalsProgress,
    monthlyActivity,
    recentTransactions,
    recentStories
  } = userDashboard;

  // Prepare data for charts
  const netWorthData = netWorthHistory?.map(point => ({
    date: point.date,
    'Cash Balance': point.cashBalance,
    'Investments': point.investmentsValue
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

  // Get goals that are NOT completed (progress < 100%) and sort by progress (highest first)
  const activeGoals = (goalsProgress || [])
    .filter(goal => goal.progressPercent < 100)
    .sort((a, b) => b.progressPercent - a.progressPercent)
    .slice(0, 4); // Show top 4 goals

  const completedGoals = (goalsProgress || []).filter(goal => goal.progressPercent >= 100).length;

  return (
    <div className="page-wrapper">
      <Navbar />
      <PageBanner title={`Welcome back, ${username}!`} />

      <div className="dashboard-container">
        <div className="dashboard-welcome">
          <p className="welcome-text">Here's an overview of your financial journey</p>
        </div>

        {/* Key Metrics - 4 cards */}
        <div className="dashboard-stats-grid">
          <StatCard 
            title="Cash Balance (BHD)" 
            value={cashBalance} 
            icon="💵" 
            color="cash"
          />
          <StatCard 
            title="Investments Value (BHD)" 
            value={totalInvestments} 
            icon="📊" 
            color="investments"
          />
          <StatCard 
            title="Total Shares Owned" 
            value={totalSharesOwned?.toFixed(4)} 
            icon="📈" 
            color="primary"
          />
          <StatCard 
            title="Total Saved (BHD)" 
            value={totalSavingsGoals} 
            icon="💰" 
            color="goals"
          />
        </div>

        {/* First Row: Cash & Investments Growth + Portfolio Allocation - Side by Side */}
        <div className="dashboard-two-columns">
          <LineChartComponent 
            data={netWorthData}
            lines={[
              { dataKey: 'Cash Balance', name: 'Cash Balance', color: '#0f766e' },
              { dataKey: 'Investments', name: 'Investments', color: '#f59e0b' }
            ]}
            title="Cash & Investments Growth"
            valuePrefix=""
            valueSuffix=" BHD"
          />
          <PieChartComponent 
            data={portfolioData}
            title="Portfolio by Sector"
            valuePrefix=""
            valueSuffix=" BHD"
            nameKey="name"
          />
        </div>

        {/* Second Row: Goals Progress + Monthly Activity - Side by Side */}
        <div className="dashboard-two-columns">
          {/* Goals Progress Section */}
          <div className="dashboard-goals-section">
            <div className="goals-section-header">
              <h3>Goals Progress</h3>
              {completedGoals > 0 && (
                <span className="completed-goals-badge">
                  ✅ {completedGoals} completed
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
                        <span className="goal-remaining">🚀 {remaining.toLocaleString()} BHD left</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="no-active-goals-message">
                  <p>🎉 All goals completed!</p>
                  <p className="sub-message">Create new goals to save more</p>
                </div>
              )}
            </div>
          </div>

          {/* Monthly Activity Chart */}
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

        {/* Third Row: Recent Activity - Side by Side */}
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
                    <div className="recent-amount positive">+{story.reward?.toLocaleString()} BHD</div>
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