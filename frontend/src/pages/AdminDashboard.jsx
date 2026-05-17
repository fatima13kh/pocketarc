// src/pages/AdminDashboard.jsx
import { useEffect } from 'react';
import { useDashboard } from '../context/DashboardContext';
import Navbar from '../components/layout/Navbar';
import PageBanner from '../components/layout/PageBanner';
import Footer from '../components/layout/Footer';
import Spinner from '../components/common/Spinner';
import Alert from '../components/common/Alert';
import StatCard from '../components/dashboard/StatCard';
import LineChartComponent from '../components/dashboard/LineChartComponent';
import BarChartComponent from '../components/dashboard/BarChartComponent';
import PieChartComponent from '../components/dashboard/PieChartComponent';

export default function AdminDashboard() {
  const { adminDashboard, loading, error, loadDashboard } = useDashboard();

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading) {
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
    verifiedUsers,
    unverifiedUsers,
    adminUsers,
    usersJoinedThisMonth,
    totalCashInSystem,
    totalInvestments,
    totalSavings,
    totalNetWorthSystem,
    totalStories,
    publishedStories,
    draftStories,
    pendingReviewStories,
    totalAiGeneratedStories,
    totalAdminCreatedStories,
    totalTransactions,
    totalBuyTransactions,
    totalSellTransactions,
    totalStoriesPlayed,
    totalGoalsCreated,
    userRegistrations,
    systemGrowth,
    popularStocks,
    storyPerformance,
    activityTimeline
  } = adminDashboard;

  // Prepare chart data
  const userRegistrationData = userRegistrations?.map(point => ({
    date: point.date,
    Registrations: point.registrations,
    Verified: point.verified
  })) || [];

  const systemGrowthData = systemGrowth?.map(point => ({
    date: point.date,
    'Net Worth': point.totalNetWorth,
    'Investments': point.totalInvestments,
    'Cash': point.totalCash
  })) || [];

  const stocksData = popularStocks?.map(stock => ({
    name: stock.symbol,
    value: stock.totalValue,
    users: stock.userCount,
    avgHolding: stock.averageHolding
  })) || [];

  const storiesData = storyPerformance?.map(story => ({
    name: story.title,
    plays: story.playsCount,
    difficulty: story.difficulty
  })) || [];

  const timelineData = activityTimeline?.map(point => ({
    date: point.date,
    Transactions: point.transactions,
    'Stories Played': point.storiesPlayed,
    'Goals Created': point.goalsCreated
  })) || [];

  return (
    <div className="page-wrapper">
      <Navbar />
      <PageBanner title="Admin Dashboard" />

      <div className="dashboard-container">
        <div className="dashboard-welcome">
          <p className="welcome-text">System Overview & Analytics</p>
        </div>

        {/* User Statistics */}
        <div className="dashboard-section">
          <h2 className="section-title">👥 User Statistics</h2>
          <div className="dashboard-stats-grid">
            <StatCard title="Total Users" value={totalUsers} icon="👥" color="primary" />
            <StatCard title="Verified Users" value={verifiedUsers} icon="✅" color="success" />
            <StatCard title="Unverified Users" value={unverifiedUsers} icon="⏳" color="warning" />
            <StatCard title="Admin Users" value={adminUsers} icon="👑" color="accent" />
            <StatCard title="New Users (30d)" value={usersJoinedThisMonth} icon="📈" color="info" />
          </div>
        </div>

        {/* Financial Statistics */}
        <div className="dashboard-section">
          <h2 className="section-title">💰 Financial Statistics</h2>
          <div className="dashboard-stats-grid">
            <StatCard title="Total Cash in System" value={totalCashInSystem} icon="💵" color="cash" />
            <StatCard title="Total Investments" value={totalInvestments} icon="📊" color="investments" />
            <StatCard title="Total Savings" value={totalSavings} icon="🎯" color="goals" />
            <StatCard title="Total Net Worth" value={totalNetWorthSystem} icon="💰" color="networth" />
          </div>
        </div>

        {/* Content Statistics */}
        <div className="dashboard-section">
          <h2 className="section-title">📚 Content Statistics</h2>
          <div className="dashboard-stats-grid">
            <StatCard title="Total Stories" value={totalStories} icon="📖" color="primary" />
            <StatCard title="Published" value={publishedStories} icon="✅" color="success" />
            <StatCard title="Draft" value={draftStories} icon="📝" color="warning" />
            <StatCard title="Pending Review" value={pendingReviewStories} icon="⏳" color="info" />
            <StatCard title="AI Generated" value={totalAiGeneratedStories} icon="🤖" color="accent" />
            <StatCard title="Admin Created" value={totalAdminCreatedStories} icon="👨‍💼" color="primary" />
          </div>
        </div>

        {/* Activity Statistics */}
        <div className="dashboard-section">
          <h2 className="section-title">⚡ Activity Statistics</h2>
          <div className="dashboard-stats-grid">
            <StatCard title="Total Transactions" value={totalTransactions} icon="🔄" color="primary" />
            <StatCard title="Buy Transactions" value={totalBuyTransactions} icon="📈" color="success" />
            <StatCard title="Sell Transactions" value={totalSellTransactions} icon="📉" color="error" />
            <StatCard title="Stories Played" value={totalStoriesPlayed} icon="🎮" color="info" />
            <StatCard title="Goals Created" value={totalGoalsCreated} icon="🎯" color="warning" />
          </div>
        </div>

        {/* Charts Section */}
        <div className="dashboard-charts-row">
          <LineChartComponent 
            data={userRegistrationData}
            lines={[
              { dataKey: 'Registrations', name: 'Registrations', color: '#2d7a4f' },
              { dataKey: 'Verified', name: 'Verified', color: '#0f766e' }
            ]}
            title="User Registrations (Last 30 Days)"
            valuePrefix=""
            valueSuffix=" users"
          />
          <LineChartComponent 
            data={systemGrowthData}
            lines={[
              { dataKey: 'Net Worth', name: 'Net Worth', color: '#2d7a4f' },
              { dataKey: 'Investments', name: 'Investments', color: '#f59e0b' },
              { dataKey: 'Cash', name: 'Cash', color: '#0f766e' }
            ]}
            title="System Growth (Last 30 Days)"
            valuePrefix=""
            valueSuffix=" BHD"
          />
        </div>

        <div className="dashboard-charts-row">
          <BarChartComponent 
            data={stocksData}
            bars={[
              { dataKey: 'value', name: 'Total Value', color: '#2d7a4f' }
            ]}
            xKey="name"
            title="Most Popular Stocks"
            valuePrefix=""
            valueSuffix=" BHD"
            layout="vertical"
          />
          <BarChartComponent 
            data={storiesData}
            bars={[
              { dataKey: 'plays', name: 'Plays', color: '#f59e0b' }
            ]}
            xKey="name"
            title="Most Played Stories"
            valuePrefix=""
            valueSuffix=" plays"
            layout="vertical"
          />
        </div>

        <div className="dashboard-charts-row">
          <LineChartComponent 
            data={timelineData}
            lines={[
              { dataKey: 'Transactions', name: 'Transactions', color: '#2d7a4f' },
              { dataKey: 'Stories Played', name: 'Stories Played', color: '#f59e0b' },
              { dataKey: 'Goals Created', name: 'Goals Created', color: '#0f766e' }
            ]}
            title="Activity Timeline (Last 30 Days)"
            valuePrefix=""
            valueSuffix=""
          />
        </div>
      </div>

      <Footer />
    </div>
  );
}