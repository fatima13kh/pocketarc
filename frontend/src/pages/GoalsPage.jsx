import { useState } from 'react';
import { useNavigate, Routes, Route } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import PageBanner from '../components/layout/PageBanner';
import Footer from '../components/layout/Footer';
import Spinner from '../components/common/Spinner';
import Alert from '../components/common/Alert';
import GoalStats from '../components/goals/GoalStats';
import OverallProgress from '../components/goals/OverallProgress';
import GoalCard from '../components/goals/GoalCard';
import GoalFilters from '../components/goals/GoalFilters';
import { useGoals } from '../context/GoalsContext';

export default function GoalsPage() {
  const navigate = useNavigate();
  const { 
    goals, 
    loading, 
    error, 
    cashBalance, 
    totalSaved, 
    totalTarget, 
    overallProgress,
    loadGoals
  } = useGoals();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [dateSort, setDateSort] = useState('');
  const [progressSort, setProgressSort] = useState('');
  const [targetSort, setTargetSort] = useState('');

  // Apply all sorts in priority order (last selected wins)
  const filteredAndSortedGoals = goals
    .filter(goal => {
      const matchesSearch = goal.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = !categoryFilter || goal.category === categoryFilter;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (dateSort === 'newest') {
        return new Date(b.createdAt) - new Date(a.createdAt);
      }
      if (dateSort === 'oldest') {
        return new Date(a.createdAt) - new Date(b.createdAt);
      }
      if (progressSort === 'progress_asc') {
        return (a.currentAmount / a.targetAmount) - (b.currentAmount / b.targetAmount);
      }
      if (progressSort === 'progress_desc') {
        return (b.currentAmount / b.targetAmount) - (a.currentAmount / a.targetAmount);
      }
      if (targetSort === 'target_asc') {
        return a.targetAmount - b.targetAmount;
      }
      if (targetSort === 'target_desc') {
        return b.targetAmount - a.targetAmount;
      }
      return 0;
    });

  const handleViewGoal = (goal) => {
    navigate(`/goals/${goal.id}`);
  };

  const handleDateSortChange = (value) => {
    setDateSort(value);
    if (value) {
      setProgressSort('');
      setTargetSort('');
    }
  };

  const handleProgressSortChange = (value) => {
    setProgressSort(value);
    if (value) {
      setDateSort('');
      setTargetSort('');
    }
  };

  const handleTargetSortChange = (value) => {
    setTargetSort(value);
    if (value) {
      setDateSort('');
      setProgressSort('');
    }
  };

  if (loading) {
    return (
      <div className="page-wrapper">
        <Navbar />
        <PageBanner title="Savings Goals" />
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <Spinner dark />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <Navbar />
      <PageBanner title="Savings Goals" />
      
      <div className="goals-container">
        <GoalStats cashBalance={cashBalance} totalSaved={totalSaved} totalTarget={totalTarget} />
        <OverallProgress progress={overallProgress} />

        <GoalFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          categoryFilter={categoryFilter}
          onCategoryChange={setCategoryFilter}
          dateSort={dateSort}
          onDateSortChange={handleDateSortChange}
          progressSort={progressSort}
          onProgressSortChange={handleProgressSortChange}
          targetSort={targetSort}
          onTargetSortChange={handleTargetSortChange}
        />

        <div className="goals-actions">
          <button className="create-goal-btn" onClick={() => navigate('/goals/create')}>
            + Create Goal
          </button>
        </div>

        {error && <Alert message={error} />}

        {filteredAndSortedGoals.length === 0 ? (
          <div className="empty-goals">
            <p>No goals found. Create your first savings goal!</p>
            <button className="btn-primary" onClick={() => navigate('/goals/create')}>
              Create Goal
            </button>
          </div>
        ) : (
          <div className="goals-grid">
            {filteredAndSortedGoals.map(goal => (
              <GoalCard key={goal.id} goal={goal} onClick={handleViewGoal} />
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}