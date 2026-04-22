import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { storiesApi } from '../../api/storiesApi';
import Navbar from '../../components/layout/Navbar';
import PageBanner from '../../components/layout/PageBanner';
import Alert from '../../components/common/Alert';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';
import Footer from '../../components/layout/Footer';

const DIFFICULTIES = ['BEGINNER', 'MEDIUM', 'HARD'];
const CATEGORIES = ['INVESTING', 'SAVING', 'RETIREMENT', 'DEBT', 'BUSINESS'];

const emptyOption = (order) => ({
  optionOrder: order,
  optionText: '',
  isCorrect: false,
  reasoningText: '',
});

const emptyQuestion = (order) => ({
  questionOrder: order,
  questionText: '',
  options: [emptyOption(1), emptyOption(2), emptyOption(3)],
});

export default function StoryEditorPage() {
  const navigate = useNavigate();
  const { id } = useParams(); // undefined = create, number = edit

  const isEdit = !!id;

  const [form, setForm] = useState({
    title: '',
    difficulty: 'BEGINNER',
    category: 'INVESTING',
    openingContent: '',
    rewardPerCorrect: '',
    penaltyPerWrong: '',
    questions: [emptyQuestion(1)],
  });

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState('');
  const [similarWarning, setSimilarWarning] = useState('');
  const [hasPlaysWarning, setHasPlaysWarning] = useState('');

  useEffect(() => {
    if (isEdit) loadStory();
  }, [id]);

  const loadStory = async () => {
    try {
      const res = await storiesApi.getStory(id);
      const s = res.data;

      if (s.playedCount > 0) {
        setHasPlaysWarning(
          `This story has been played by ${s.playedCount} user(s). ` +
          `Editing is locked. You can create a new version instead.`
        );
      }

      setForm({
        title: s.title,
        difficulty: s.difficulty,
        category: s.category,
        openingContent: s.openingContent || '',
        rewardPerCorrect: s.rewardPerCorrect?.toString() || '',
        penaltyPerWrong: s.penaltyPerWrong?.toString() || '',
        questions: s.questions?.length > 0
          ? s.questions.map(q => ({
              questionOrder: q.questionOrder,
              questionText: q.questionText,
              options: q.options?.map(o => ({
                optionOrder: o.optionOrder,
                optionText: o.optionText,
                isCorrect: o.isCorrect || false,
                reasoningText: o.reasoningText || '',
              })) || [emptyOption(1), emptyOption(2), emptyOption(3)],
            }))
          : [emptyQuestion(1)],
      });
    } catch (err) {
      setApiError('Failed to load story');
    } finally {
      setLoading(false);
    }
  };

  const handleTitleBlur = async () => {
    if (!form.title.trim() || isEdit) return;
    try {
      const res = await storiesApi.checkSimilar(form.title);
      if (res.data.hasSimilar) {
        setSimilarWarning(res.data.message);
      } else {
        setSimilarWarning('');
      }
    } catch {}
  };

  const setQuestion = (qIdx, field, value) => {
    setForm(prev => {
      const questions = [...prev.questions];
      questions[qIdx] = { ...questions[qIdx], [field]: value };
      return { ...prev, questions };
    });
  };

  const setOption = (qIdx, oIdx, field, value) => {
    setForm(prev => {
      const questions = [...prev.questions];
      const options = [...questions[qIdx].options];

      if (field === 'isCorrect' && value === true) {
        // Only one correct per question
        options.forEach((o, i) => { options[i] = { ...o, isCorrect: false }; });
      }

      options[oIdx] = { ...options[oIdx], [field]: value };
      questions[qIdx] = { ...questions[qIdx], options };
      return { ...prev, questions };
    });
  };

  const addQuestion = () => {
    setForm(prev => ({
      ...prev,
      questions: [
        ...prev.questions,
        emptyQuestion(prev.questions.length + 1),
      ],
    }));
  };

  const removeQuestion = (qIdx) => {
    setForm(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== qIdx)
        .map((q, i) => ({ ...q, questionOrder: i + 1 })),
    }));
  };

  const handleSave = async (status) => {
    if (!form.title.trim()) { setApiError('Title is required'); return; }
    if (!form.rewardPerCorrect) { setApiError('Reward amount is required'); return; }
    if (!form.penaltyPerWrong) { setApiError('Penalty amount is required'); return; }

    for (const q of form.questions) {
      if (!q.questionText.trim()) {
        setApiError('All questions must have text'); return;
      }
      const hasCorrect = q.options.some(o => o.isCorrect);
      if (!hasCorrect) {
        setApiError('Each question must have one correct answer'); return;
      }
    }

    setSaving(true);
    setApiError('');

    const payload = {
      ...form,
      rewardPerCorrect: parseFloat(form.rewardPerCorrect),
      penaltyPerWrong: parseFloat(form.penaltyPerWrong),
      status,
    };

    try {
      if (isEdit) {
        await storiesApi.updateStory(id, payload);
      } else {
        await storiesApi.createStory(payload);
      }
      navigate('/admin/stories');
    } catch (err) {
      setApiError(err.response?.data?.error || 'Failed to save story');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page-wrapper">
        <Navbar />
        <PageBanner title="Investment Stories" />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Spinner dark />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="story-editor-wrapper">
      <Navbar />
      <PageBanner title="Investment Stories" />

      <div className="story-editor-content">
        <div className="story-editor-card">
          <button
            className="story-play-back"
            onClick={() => navigate('/admin/stories')}
          >
            ← Back
          </button>

          {hasPlaysWarning && (
            <div className="alert alert-error">{hasPlaysWarning}</div>
          )}
          {similarWarning && (
            <div className="alert" style={{
              background: 'rgba(180, 130, 0, 0.08)',
              border: '1px solid rgba(180, 130, 0, 0.3)',
              color: '#8a6000',
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              fontSize: '13px',
              marginBottom: '16px',
            }}>
              ⚠️ {similarWarning}
            </div>
          )}
          <Alert message={apiError} />

          {/* Title */}
          <label className="story-editor-label">Title:</label>
          <input
            className="story-editor-input"
            value={form.title}
            onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
            onBlur={handleTitleBlur}
            disabled={!!hasPlaysWarning}
          />

          {/* Difficulty + Category */}
          <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
            <div style={{ flex: 1 }}>
              <label className="story-editor-label">Difficulty:</label>
              <select
                className="stories-select"
                style={{ width: '100%' }}
                value={form.difficulty}
                onChange={e => setForm(p => ({ ...p, difficulty: e.target.value }))}
                disabled={!!hasPlaysWarning}
              >
                {DIFFICULTIES.map(d => (
                  <option key={d} value={d}>
                    {d.charAt(0) + d.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label className="story-editor-label">Category:</label>
              <select
                className="stories-select"
                style={{ width: '100%' }}
                value={form.category}
                onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                disabled={!!hasPlaysWarning}
              >
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>
                    {c.charAt(0) + c.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Questions */}
          {form.questions.map((q, qIdx) => (
            <div key={qIdx} className="story-question-block">
              <div className="story-question-header">
                <span className="story-question-label">Question:</span>
                {form.questions.length > 1 && (
                  <button
                    style={{
                      background: 'none', border: 'none',
                      color: 'var(--error)', cursor: 'pointer',
                      fontSize: '12px', fontFamily: 'var(--sans)',
                    }}
                    onClick={() => removeQuestion(qIdx)}
                  >
                    Remove
                  </button>
                )}
              </div>

              <textarea
                className="story-editor-textarea"
                value={q.questionText}
                onChange={e => setQuestion(qIdx, 'questionText', e.target.value)}
                placeholder="Enter the question..."
                disabled={!!hasPlaysWarning}
              />

              <label className="story-editor-label" style={{ marginTop: '12px' }}>
                Choices:
              </label>

              {q.options.map((opt, oIdx) => (
                <div key={oIdx} className="story-choice-block">
                  <div className="story-choice-header">
                    <span className="story-choice-label">Choice {oIdx + 1}</span>
                    <input
                      type="radio"
                      className="story-correct-radio"
                      checked={opt.isCorrect}
                      onChange={() => setOption(qIdx, oIdx, 'isCorrect', true)}
                      disabled={!!hasPlaysWarning}
                      title="Mark as correct answer"
                    />
                  </div>
                  <textarea
                    className="story-editor-textarea"
                    style={{ minHeight: '44px' }}
                    value={opt.optionText}
                    onChange={e => setOption(qIdx, oIdx, 'optionText', e.target.value)}
                    placeholder={`Choice ${oIdx + 1} text`}
                    disabled={!!hasPlaysWarning}
                  />
                  <label className="story-editor-label" style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '6px' }}>
                    Reasoning
                  </label>
                  <textarea
                    className="story-editor-textarea"
                    value={opt.reasoningText}
                    onChange={e => setOption(qIdx, oIdx, 'reasoningText', e.target.value)}
                    placeholder="Explain why this choice is correct or incorrect..."
                    disabled={!!hasPlaysWarning}
                  />
                </div>
              ))}
            </div>
          ))}

          {!hasPlaysWarning && (
            <button className="add-question-btn" onClick={addQuestion}>
              + Add Question
            </button>
          )}

          {/* Reward + Penalty */}
          <div className="story-reward-row">
            <div className="story-reward-field">
              <label className="story-reward-label">Correct Answer Reward:</label>
              <div className="story-reward-input-wrap">
                <input
                  className="story-reward-input"
                  type="number"
                  value={form.rewardPerCorrect}
                  onChange={e => setForm(p => ({ ...p, rewardPerCorrect: e.target.value }))}
                  disabled={!!hasPlaysWarning}
                />
                <span className="story-reward-suffix">BHD</span>
              </div>
            </div>
            <div className="story-reward-field">
              <label className="story-reward-label">Wrong Answer Deduction:</label>
              <div className="story-reward-input-wrap">
                <input
                  className="story-reward-input"
                  type="number"
                  value={form.penaltyPerWrong}
                  onChange={e => setForm(p => ({ ...p, penaltyPerWrong: e.target.value }))}
                  disabled={!!hasPlaysWarning}
                />
                <span className="story-reward-suffix">BHD</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          {!hasPlaysWarning && (
            <div className="story-editor-actions">
              {isEdit ? (
                <Button loading={saving} onClick={() => handleSave(form.status || 'DRAFT')}>
                  Update
                </Button>
              ) : (
                <>
                  <Button loading={saving} onClick={() => handleSave('PUBLISHED')}>
                    Create/Publish
                  </Button>
                  <Button variant="secondary" loading={saving} onClick={() => handleSave('DRAFT')}>
                    Save Draft
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}