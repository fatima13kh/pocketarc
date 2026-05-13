import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { storiesApi } from '../api/storiesApi';
import Navbar from '../components/layout/Navbar';
import PageBanner from '../components/layout/PageBanner';
import Footer from '../components/layout/Footer';
import Spinner from '../components/common/Spinner';

const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];
const CATEGORIES = ['INVESTING', 'SAVING', 'RETIREMENT', 'DEBT', 'BUSINESS'];
const STORIES_PER_PAGE = 8;

// Sort options for Reward
const REWARD_SORT = [
  { value: '', label: 'Sort By Reward' },
  { value: 'reward_high_to_low', label: 'High to Low' },
  { value: 'reward_low_to_high', label: 'Low to High' },
];

// Sort options for Deduction (Penalty)
const DEDUCTION_SORT = [
  { value: '', label: 'Sort By Deduction' },
  { value: 'deduction_high_to_low', label: 'High to Low' },
  { value: 'deduction_low_to_high', label: 'Low to High' },
];

// Sort options for Title
const TITLE_SORT = [
  { value: '', label: 'Sort By Title' },
  { value: 'title_atoz', label: 'A to Z' },
  { value: 'title_ztoa', label: 'Z to A' },
];

// Sort options for Date
const DATE_SORT = [
  { value: '', label: 'Sort By Date' },
  { value: 'newest_first', label: 'Newest First' },
  { value: 'oldest_first', label: 'Oldest First' },
];

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

function StoryCard({ story, onPlay, isAdmin }) {
  const difficultyLabel = story.difficulty === 'BEGINNER' ? 'Easy'
    : story.difficulty === 'MEDIUM' ? 'Medium' : 'Hard';

  const categoryLabel = story.category?.charAt(0) +
    story.category?.slice(1).toLowerCase();

  return (
    <div className="story-card">
      <div className="story-card-meta">
        <h3 className="story-card-title">{story.title}</h3>
        <span className="story-card-tags">
          {difficultyLabel} | {categoryLabel}
        </span>
      </div>
      <p className="story-card-desc">
        {story.openingContent || 'Explore key strategies for the upcoming year. Learn how to navigate market trends and risks.'}
      </p>
      
      {/* Reward and Deduction display */}
      <div className="story-card-reward">
        <div className="reward-item reward-positive">
          <span className="reward-label">Reward:</span>
          <span className="reward-value">+{story.rewardPerCorrect || 0} BHD</span>
        </div>
        <div className="reward-item reward-negative">
          <span className="reward-label">Deduction:</span>
          <span className="reward-value">-{story.penaltyPerWrong || 0} BHD</span>
        </div>
      </div>
      
      <div className="story-card-footer">
        {isAdmin ? (
          <div className="story-card-actions">
            {story.status === 'DRAFT' || story.status === 'PENDING_REVIEW' ? (
              <button
                className="btn btn-primary btn-sm"
                onClick={() => onPlay('publish', story.id)}
              >
                PUBLISH
              </button>
            ) : null}
            {story.status === 'PENDING_REVIEW' ? (
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => onPlay('discard', story.id)}
              >
                Discard
              </button>
            ) : null}
            {story.status === 'PUBLISHED' ? (
              <button
                className="btn btn-danger btn-sm"
                onClick={() => onPlay('delete', story.id)}
              >
                DELETE
              </button>
            ) : null}
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => onPlay('edit', story.id)}
            >
              EDIT
            </button>
          </div>
        ) : (
          <>
            {story.playStatus === 'PLAYED' ? (
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => onPlay('view', story.id)}
              >
                View Story
              </button>
            ) : story.playStatus === 'RESUME' ? (
              <button
                className="btn btn-primary btn-sm"
                onClick={() => onPlay('play', story.id)}
              >
                Resume Story
              </button>
            ) : (
              <button
                className="btn btn-primary btn-sm"
                onClick={() => onPlay('play', story.id)}
              >
                Play Story
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function InvestmentStoriesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.isAdmin;

  const [allStories, setAllStories] = useState([]);
  const [filteredStories, setFilteredStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [currentPage, setCurrentPage] = useState(0);
  const [filters, setFilters] = useState({
    search: '',
    difficulty: '',
    category: '',
    status: '',
    rewardSort: '',
    deductionSort: '',
    titleSort: '',
    dateSort: '',
  });
  
  const [activeDifficulty, setActiveDifficulty] = useState('');

  useEffect(() => {
    loadStories();
  }, [isAdmin]);

  useEffect(() => {
    applyFiltersAndSort();
  }, [allStories, filters]);

  const loadStories = async () => {
    setLoading(true);
    setError('');
    try {
      const fn = isAdmin ? storiesApi.getAdminStories : storiesApi.getStories;
      const res = await fn({});
      setAllStories(res.data || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load stories');
      setAllStories([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersAndSort = () => {
    let result = [...allStories];
    
    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(story => 
        story.title?.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply difficulty filter
    if (filters.difficulty) {
      result = result.filter(story => story.difficulty === filters.difficulty);
    }
    
    // Apply category filter
    if (filters.category) {
      result = result.filter(story => story.category === filters.category);
    }
    
    // Apply status filter (admin only)
    if (isAdmin && filters.status) {
      result = result.filter(story => story.status === filters.status);
    }
    
    // Apply Reward sorting
    if (filters.rewardSort === 'reward_high_to_low') {
      result.sort((a, b) => (b.rewardPerCorrect || 0) - (a.rewardPerCorrect || 0));
    } else if (filters.rewardSort === 'reward_low_to_high') {
      result.sort((a, b) => (a.rewardPerCorrect || 0) - (b.rewardPerCorrect || 0));
    }
    
    // Apply Deduction sorting (overrides previous sort if set)
    if (filters.deductionSort === 'deduction_high_to_low') {
      result.sort((a, b) => (b.penaltyPerWrong || 0) - (a.penaltyPerWrong || 0));
    } else if (filters.deductionSort === 'deduction_low_to_high') {
      result.sort((a, b) => (a.penaltyPerWrong || 0) - (b.penaltyPerWrong || 0));
    }
    
    // Apply Title sorting (overrides previous sort if set)
    if (filters.titleSort === 'title_atoz') {
      result.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    } else if (filters.titleSort === 'title_ztoa') {
      result.sort((a, b) => (b.title || '').localeCompare(a.title || ''));
    }
    
    // Apply Date sorting (overrides previous sort if set)
    if (filters.dateSort === 'newest_first') {
      result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (filters.dateSort === 'oldest_first') {
      result.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    }
    
    setFilteredStories(result);
    setCurrentPage(0);
  };

  const updateFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleDifficultyFilter = (d) => {
    const val = activeDifficulty === d.toUpperCase() ? '' : d.toUpperCase();
    setActiveDifficulty(val);
    updateFilter('difficulty', val);
  };

  const handleRewardSort = (value) => {
    updateFilter('rewardSort', value);
  };

  const handleDeductionSort = (value) => {
    updateFilter('deductionSort', value);
  };

  const handleTitleSort = (value) => {
    updateFilter('titleSort', value);
  };

  const handleDateSort = (value) => {
    updateFilter('dateSort', value);
  };

  const handleAction = async (action, storyId) => {
    if (action === 'play') {
      navigate(`/stories/${storyId}/play`);
    } else if (action === 'view') {
      navigate(`/stories/${storyId}/view`);
    } else if (action === 'edit') {
      navigate(`/stories/${storyId}/edit`);
    } else if (action === 'publish') {
      await storiesApi.publishStory(storyId);
      loadStories();
    } else if (action === 'discard' || action === 'delete') {
      if (window.confirm('Are you sure you want to delete this story?')) {
        await storiesApi.deleteStory(storyId);
        loadStories();
      }
    }
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredStories.length / STORIES_PER_PAGE);
  const paginatedStories = filteredStories.slice(
    currentPage * STORIES_PER_PAGE,
    (currentPage + 1) * STORIES_PER_PAGE
  );

  if (loading) {
    return (
      <div className="page-wrapper">
        <Navbar />
        <PageBanner title="Investment Stories" />
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
      <PageBanner title="Investment Stories" />

      <div className="stories-container">
        <div className="stories-toolbar">
          {/* Top row: search + admin buttons */}
          <div className="stories-toolbar-top">
            <div className="stories-search">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                placeholder="Search Stories..."
                value={filters.search}
                onChange={e => updateFilter('search', e.target.value)}
              />
            </div>

            {isAdmin && (
              <>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => navigate('/stories/new')}
                >
                  Create Stories
                </button>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => navigate('/stories/generate')}
                >
                  Generate Stories
                </button>
              </>
            )}
          </div>

          {/* Filter row - Category */}
          <div className="stories-toolbar-row">
            <select
              className="stories-select"
              value={filters.category}
              onChange={e => updateFilter('category', e.target.value)}
            >
              <option value="">Filter By Category</option>
              {CATEGORIES.map(c => (
                <option key={c} value={c}>
                  {c.charAt(0) + c.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
          </div>

          {/* Sort row - Four separate dropdowns */}
          <div className="stories-sort-row">
            <div className="sort-group">
              <label className="sort-label">Reward:</label>
              <select
                className="stories-select stories-select-sm"
                value={filters.rewardSort}
                onChange={e => handleRewardSort(e.target.value)}
              >
                {REWARD_SORT.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="sort-group">
              <label className="sort-label">Deduction:</label>
              <select
                className="stories-select stories-select-sm"
                value={filters.deductionSort}
                onChange={e => handleDeductionSort(e.target.value)}
              >
                {DEDUCTION_SORT.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="sort-group">
              <label className="sort-label">Title:</label>
              <select
                className="stories-select stories-select-sm"
                value={filters.titleSort}
                onChange={e => handleTitleSort(e.target.value)}
              >
                {TITLE_SORT.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="sort-group">
              <label className="sort-label">Date:</label>
              <select
                className="stories-select stories-select-sm"
                value={filters.dateSort}
                onChange={e => handleDateSort(e.target.value)}
              >
                {DATE_SORT.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Difficulty chips */}
          <div className="filter-chips" style={{ marginTop: '12px' }}>
            <div className="filter-chip-group">
              {DIFFICULTIES.map(d => (
                <button
                  key={d}
                  className={`filter-chip ${activeDifficulty === d.toUpperCase() ? 'active' : ''}`}
                  onClick={() => handleDifficultyFilter(d)}
                >
                  {d}
                </button>
              ))}
            </div>

            {isAdmin && (
              <>
                <div className="filter-divider" />
                <div className="filter-chip-group">
                  {['Draft', 'Published'].map(s => (
                    <button
                      key={s}
                      className={`filter-chip ${filters.status === s.toUpperCase() ? 'active' : ''}`}
                      onClick={() => updateFilter('status',
                        filters.status === s.toUpperCase() ? '' : s.toUpperCase())}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Stories grid */}
        {error ? (
          <div className="alert alert-error">{error}</div>
        ) : paginatedStories.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--muted)' }}>
            No stories found.
          </div>
        ) : (
          <>
            <div className="stories-grid">
              {paginatedStories.map(story => (
                <StoryCard
                  key={story.id}
                  story={story}
                  onPlay={handleAction}
                  isAdmin={isAdmin}
                />
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