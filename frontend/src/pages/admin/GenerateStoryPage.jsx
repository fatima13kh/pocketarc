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

export default function GenerateStoryPage() {
  const navigate = useNavigate();
  const [difficulty, setDifficulty] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!difficulty) { setError('Please select a difficulty'); return; }
    if (!category) { setError('Please select a category'); return; }

    setLoading(true);
    setError('');
    try {
      await storiesApi.generateStory({ difficulty, category });
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
      <PageBanner title="Investment Stories" />

      <div style={{
        flex: 1, display: 'flex',
        alignItems: 'center', justifyContent: 'center', padding: '48px 24px',
      }}>
        <div className="generate-modal" style={{ position: 'static', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <h2 className="generate-modal-title">Generate Stories</h2>

          <Alert message={error} />

          {/* Difficulty chips */}
          <div className="filter-chips" style={{ justifyContent: 'center', marginBottom: '24px' }}>
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

          {/* Category */}
          <label className="story-editor-label" style={{ textAlign: 'center', display: 'block', marginBottom: '8px' }}>
            Choose Category
          </label>
          <select
            className="stories-select"
            style={{ width: '100%', marginBottom: '28px' }}
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

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Button loading={loading} onClick={handleGenerate}>
              Generate
            </Button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}