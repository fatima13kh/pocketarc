import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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

const GOALS_PER_PAGE = 6;

function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 0; i < totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage < 3) {
        for (let i = 0; i < 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages - 1);
      } else if (currentPage > totalPages - 4) {
        pages.push(0);
        pages.push('...');
        for (let i = totalPages - 4; i < totalPages; i++) pages.push(i);
      } else {
        pages.push(0);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages - 1);
      }
    }
    return pages;
  };

  return (
    <div className="pagination">
      <button
        className="pagination-btn pagination-arrow"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 0}
      >
        ← Prev
      </button>
      
      {getPageNumbers().map((p, i) =>
        p === '...' ? (
          <span key={i} className="pagination-dots">...</span>
        ) : (
          <button
            key={p}
            className={`pagination-btn ${p === currentPage ? 'active' : ''}`}
            onClick={() => onPageChange(p)}
          >
            {p + 1}
          </button>
        )
      )}
      
      <button
        className="pagination-btn pagination-arrow"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages - 1}
      >
        Next →
      </button>
    </div>
  );
}

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
  const [currentPage, setCurrentPage] = useState(0);

  // Refresh goals when the page is visited (including from navbar)
  useEffect(() => {
    loadGoals();
  }, [loadGoals]);

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

  const totalPages = Math.ceil(filteredAndSortedGoals.length / GOALS_PER_PAGE);
  const paginatedGoals = filteredAndSortedGoals.slice(
    currentPage * GOALS_PER_PAGE,
    (currentPage + 1) * GOALS_PER_PAGE
  );

  const handleViewGoal = (goal) => {
    navigate(`/goals/${goal.id}`);
  };

  const handleDateSortChange = (value) => {
    setDateSort(value);
    if (value) {
      setProgressSort('');
      setTargetSort('');
    }
    setCurrentPage(0);
  };

  const handleProgressSortChange = (value) => {
    setProgressSort(value);
    if (value) {
      setDateSort('');
      setTargetSort('');
    }
    setCurrentPage(0);
  };

  const handleTargetSortChange = (value) => {
    setTargetSort(value);
    if (value) {
      setDateSort('');
      setProgressSort('');
    }
    setCurrentPage(0);
  };

  const handleSearchChange = (value) => {
    setSearchTerm(value);
    setCurrentPage(0);
  };

  const handleCategoryChange = (value) => {
    setCategoryFilter(value);
    setCurrentPage(0);
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
          onSearchChange={handleSearchChange}
          categoryFilter={categoryFilter}
          onCategoryChange={handleCategoryChange}
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

        {paginatedGoals.length === 0 ? (
          <div className="empty-goals">
            <p>No goals found. Create your first savings goal!</p>
            <button className="btn-primary" onClick={() => navigate('/goals/create')}>
              Create Goal
            </button>
          </div>
        ) : (
          <>
            <div className="goals-grid">
              {paginatedGoals.map(goal => (
                <GoalCard key={goal.id} goal={goal} onClick={handleViewGoal} />
              ))}
            </div>
            
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}