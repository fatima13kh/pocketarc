import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { storiesApi } from '../../api/storiesApi';
import Navbar from '../../components/layout/Navbar';
import PageBanner from '../../components/layout/PageBanner';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import Footer from '../../components/layout/Footer';

const DIFFICULTIES = ['BEGINNER', 'MEDIUM', 'HARD'];
const CATEGORIES = ['INVESTING', 'SAVING', 'RETIREMENT', 'DEBT', 'BUSINESS'];
const QUESTION_COUNTS = [1, 2, 3, 4, 5];

export default function GenerateStoryPage() {
  const navigate = useNavigate();
  const [difficulty, setDifficulty] = useState('');
  const [category, setCategory] = useState('');
  const [numberOfQuestions, setNumberOfQuestions] = useState(2);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!difficulty) { setError('Please select a difficulty'); return; }
    if (!category) { setError('Please select a category'); return; }

    setLoading(true);
    setError('');
    try {
      await storiesApi.generateStory({ 
        difficulty, 
        category,
        numberOfQuestions 
      });
      navigate('/admin/stories');
    } catch (err) {
      setError(err.response?.data?.error || 'Generation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper">
      <Navbar />
      <PageBanner title="Generate Story" />

      <div className="auth-page">
        <div className="auth-card-no-hover">
          <div className="generate-modal-header">
            <button className="generate-back-btn" onClick={() => navigate('/admin/stories')}>
              ← Back to Stories
            </button>
          </div>

          <h2 className="auth-title">Generate AI Story</h2>

          <Alert message={error} />

          {/* Difficulty chips */}
          <div className="generate-section">
            <label className="auth-label">Select Difficulty:</label>
            <div className="filter-chips" style={{ justifyContent: 'center', marginBottom: '24px', marginTop: '12px' }}>
              {DIFFICULTIES.map(d => (
                <button
                  key={d}
                  className={`filter-chip ${difficulty === d ? 'active' : ''}`}
                  onClick={() => setDifficulty(d)}
                >
                  {d.charAt(0) + d.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div className="generate-section">
            <label className="auth-label">Choose Category:</label>
            <select
              className="auth-select"
              value={category}
              onChange={e => setCategory(e.target.value)}
            >
              <option value="">Choose a category..</option>
              {CATEGORIES.map(c => (
                <option key={c} value={c}>
                  {c.charAt(0) + c.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
          </div>

          {/* Number of Questions */}
          <div className="generate-section">
            <label className="auth-label">Number of Questions:</label>
            <div className="question-count-buttons" style={{ justifyContent: 'center', marginBottom: '16px', marginTop: '12px' }}>
              {QUESTION_COUNTS.map(num => (
                <button
                  key={num}
                  className={`question-count-btn ${numberOfQuestions === num ? 'active' : ''}`}
                  onClick={() => setNumberOfQuestions(num)}
                >
                  {num}
                </button>
              ))}
            </div>
            <p className="question-count-value" style={{ textAlign: 'center' }}>
              {numberOfQuestions} {numberOfQuestions === 1 ? 'question' : 'questions'} will be generated
            </p>
          </div>

          {/* Generate Button */}
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '24px' }}>
            <button className="auth-btn" onClick={handleGenerate} disabled={loading}>
              {loading ? 'Generating...' : 'Generate Story'}
            </button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}