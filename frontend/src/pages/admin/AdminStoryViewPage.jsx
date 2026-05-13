import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { storiesApi } from '../../api/storiesApi';
import Navbar from '../../components/layout/Navbar';
import PageBanner from '../../components/layout/PageBanner';
import Footer from '../../components/layout/Footer';
import Spinner from '../../components/common/Spinner';

export default function AdminStoryViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStory();
  }, [id]);

  const loadStory = async () => {
    try {
      const res = await storiesApi.getStory(id);
      setStory(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load story');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-wrapper">
        <Navbar />
        <PageBanner title="View Story" />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
        <PageBanner title="View Story" />
        <div style={{ flex: 1, padding: '40px', textAlign: 'center' }}>
          <div className="alert alert-error">{error}</div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!story) return null;

  return (
    <div className="page-wrapper">
      <Navbar />
      <PageBanner title="View Story" />

      <div className="story-editor-content">
        <div className="story-editor-card">
          <div className="story-editor-header">
            <button className="story-play-back" onClick={() => navigate('/admin/stories')}>
              ← Back to Stories
            </button>
            {/* Edit button removed */}
          </div>

          <div className="story-view-only">
            {/* Title */}
            <div className="story-view-field">
              <label className="story-editor-label">Title:</label>
              <p className="story-view-value">{story.title}</p>
            </div>

            {/* Difficulty and Category */}
            <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
              <div style={{ flex: 1 }}>
                <label className="story-editor-label">Difficulty:</label>
                <p className="story-view-value">
                  {story.difficulty === 'BEGINNER' ? 'Easy' : story.difficulty === 'MEDIUM' ? 'Medium' : 'Hard'}
                </p>
              </div>
              <div style={{ flex: 1 }}>
                <label className="story-editor-label">Category:</label>
                <p className="story-view-value">
                  {story.category?.charAt(0) + story.category?.slice(1).toLowerCase()}
                </p>
              </div>
            </div>

            {/* Author Type */}
            <div className="story-view-field">
              <label className="story-editor-label">Author:</label>
              <p className="story-view-value">
                {story.authorType === 'AI_GENERATED' ? '🤖 AI Generated' : '👨‍💼 Admin Created'}
              </p>
            </div>

            {/* Status */}
            <div className="story-view-field">
              <label className="story-editor-label">Status:</label>
              <p className="story-view-value">
                <span className={`status-badge status-${story.status?.toLowerCase()}`}>
                  {story.status}
                </span>
              </p>
            </div>

            {/* Play Count */}
            <div className="story-view-field">
              <label className="story-editor-label">Times Played:</label>
              <p className="story-view-value">
                {story.playedCount || 0} {story.playedCount === 1 ? 'user' : 'users'}
              </p>
            </div>

            {/* Opening Content */}
            <div className="story-view-field">
              <label className="story-editor-label">Story Context / Opening Content:</label>
              <div className="story-view-textarea story-context-text-admin">
                {story.openingContent || 'No opening content provided.'}
              </div>
            </div>

            {/* Reward and Penalty */}
            <div className="story-reward-row">
              <div className="story-reward-field">
                <label className="story-editor-label">Correct Answer Reward:</label>
                <div className="story-reward-input-wrap">
                  <span className="story-view-reward">+{story.rewardPerCorrect} BHD</span>
                </div>
              </div>
              <div className="story-reward-field">
                <label className="story-editor-label">Wrong Answer Deduction:</label>
                <div className="story-reward-input-wrap">
                  <span className="story-view-reward deduction">-{story.penaltyPerWrong} BHD</span>
                </div>
              </div>
            </div>

            {/* Questions */}
            <label className="story-editor-label">Questions & Answers:</label>
            {story.questions?.map((question, qIdx) => (
              <div key={qIdx} className="story-question-block story-view-question">
                <div className="story-question-header">
                  <span className="story-question-label">Question {qIdx + 1}:</span>
                </div>
                <p className="story-view-question-text">{question.questionText}</p>

                <label className="story-editor-label" style={{ marginTop: '12px' }}>
                  Choices:
                </label>

                {question.options?.map((option, oIdx) => (
                  <div key={oIdx} className="story-choice-block">
                    <div className="story-choice-header">
                      <span className="story-choice-label">Choice {oIdx + 1}</span>
                      {option.isCorrect && (
                        <span className="correct-badge-view">✓ Correct Answer</span>
                      )}
                    </div>
                    <div className="story-view-option">
                      <p><strong>Option:</strong> {option.optionText}</p>
                      <p><strong>Reasoning:</strong> {option.reasoningText || 'No reasoning provided.'}</p>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}