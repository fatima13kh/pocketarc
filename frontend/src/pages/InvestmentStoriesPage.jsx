import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useStories } from '../hooks/useStories';
import Navbar from '../components/layout/Navbar';
import PageBanner from '../components/layout/PageBanner';
import Footer from '../components/layout/Footer';
import Spinner from '../components/common/Spinner';

const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];
const CATEGORIES = ['INVESTING', 'SAVING', 'RETIREMENT', 'DEBT', 'BUSINESS'];
const SORT_OPTIONS = [
  { value: '', label: 'Sort By..' },
  { value: 'reward', label: 'Reward' },
  { value: 'title', label: 'Title' },
  { value: 'createdAt', label: 'Newest' },
];

function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const pages = [];
  const showEllipsis = totalPages > 7;

  if (!showEllipsis) {
    for (let i = 0; i < totalPages; i++) pages.push(i);
  } else {
    pages.push(0, 1, 2, 3, 4, 5, 6);
    if (totalPages > 8) pages.push('...');
    pages.push(totalPages - 1);
  }

  return (
    <div className="pagination">
      {pages.map((p, i) =>
        p === '...'
          ? <span key={i} className="pagination-btn" style={{ border: 'none' }}>...</span>
          : (
            <button
              key={p}
              className={`pagination-btn ${p === currentPage ? 'active' : ''}`}
              onClick={() => onPageChange(p)}
            >
              {p + 1}
            </button>
          )
      )}
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
          <button
            className="btn btn-primary btn-sm"
            onClick={() => onPlay('play', story.id)}
            disabled={story.playStatus === 'PLAYED'}
          >
            {story.playStatus === 'PLAYED'
              ? 'Played'
              : story.playStatus === 'RESUME'
              ? 'Resume Story'
              : 'Play Story'}
          </button>
        )}
      </div>
    </div>
  );
}

export default function InvestmentStoriesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.isAdmin;

  const {
    stories, totalPages, loading, error,
    filters, updateFilter, setPage, refetch,
  } = useStories(isAdmin);

  const [activeDifficulty, setActiveDifficulty] = useState('');

  const handleDifficultyFilter = (d) => {
    const val = activeDifficulty === d.toUpperCase() ? '' : d.toUpperCase();
    setActiveDifficulty(val);
    updateFilter('difficulty', val);
  };

  const handleAction = async (action, storyId) => {
    if (action === 'play') {
      navigate(`/stories/${storyId}/play`);
    } else if (action === 'edit') {
      navigate(`/stories/${storyId}/edit`);
    } else if (action === 'publish') {
      const { storiesApi } = await import('../api/storiesApi');
      await storiesApi.publishStory(storyId);
      refetch();
    } else if (action === 'discard' || action === 'delete') {
      if (window.confirm('Are you sure you want to delete this story?')) {
        const { storiesApi } = await import('../api/storiesApi');
        await storiesApi.deleteStory(storyId);
        refetch();
      }
    }
  };

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

          {/* Filter row */}
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

            <select
              className="stories-select"
              value={filters.sortBy}
              onChange={e => updateFilter('sortBy', e.target.value)}
            >
              {SORT_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
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
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
            <Spinner dark />
          </div>
        ) : error ? (
          <div className="alert alert-error">{error}</div>
        ) : stories.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--muted)' }}>
            No stories found.
          </div>
        ) : (
          <div className="stories-grid">
            {stories.map(story => (
              <StoryCard
                key={story.id}
                story={story}
                onPlay={handleAction}
                isAdmin={isAdmin}
              />
            ))}
          </div>
        )}

        <Pagination
          currentPage={filters.page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </div>

      <Footer />
    </div>
  );
}