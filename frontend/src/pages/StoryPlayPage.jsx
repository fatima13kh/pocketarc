import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { storiesApi } from '../api/storiesApi';
import Navbar from '../components/layout/Navbar';
import PageBanner from '../components/layout/PageBanner';
import Footer from '../components/layout/Footer';
import Spinner from '../components/common/Spinner';

export default function StoryPlayPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // questionId -> answerResult
  const [selectedOption, setSelectedOption] = useState(null);
  const [answerResult, setAnswerResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [completionData, setCompletionData] = useState(null);

  useEffect(() => {
    loadStory();
  }, [id]);

  const loadStory = async () => {
    try {
      await storiesApi.startStory(id);
      const res = await storiesApi.getStory(id);
      setStory(res.data);

      // Find first unanswered question index if resuming
      // (we don't have saved answers client-side on resume, start from 0)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load story');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = async (optionId) => {
    if (answerResult || submitting) return;
    const question = story.questions[currentQuestionIndex];

    setSelectedOption(optionId);
    setSubmitting(true);

    try {
      const res = await storiesApi.submitAnswer(id, {
        questionId: question.id,
        selectedOptionId: optionId,
      });

      const result = res.data;
      setAnswerResult(result);
      setAnswers(prev => ({ ...prev, [question.id]: result }));
    } catch (err) {
      // If already answered, just move on
      setAnswerResult({ isCorrect: null, reasoningText: null });
    } finally {
      setSubmitting(false);
    }
  };

  const handleContinue = async () => {
    const isLastQuestion = currentQuestionIndex >= story.questions.length - 1;

    if (isLastQuestion) {
      // Complete the story
      try {
        const res = await storiesApi.completeStory(id);
        setCompletionData(res.data);
        setCompleted(true);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to complete story');
      }
    } else {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedOption(null);
      setAnswerResult(null);
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

  if (error) {
    return (
      <div className="page-wrapper">
        <Navbar />
        <PageBanner title="Investment Stories" />
        <div style={{ flex: 1, padding: '40px', textAlign: 'center' }}>
          <div className="alert alert-error" style={{ maxWidth: 400, margin: '0 auto' }}>
            {error}
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (completed && completionData) {
    return (
      <div className="page-wrapper">
        <Navbar />
        <PageBanner title="Investment Stories" />
        <div className="story-play-content">
          <div className="story-play-card">
            <button className="story-play-back" onClick={() => navigate('/stories')}>
              ← Back
            </button>
            <div className="story-completion">
              <h2>Story Completed!</h2>
              <p className="story-completion-subtitle">
                Well Done! You've completed "{completionData.storyTitle}"
              </p>
              <p className="story-completion-success">Success!</p>
              <p style={{ fontSize: '14px', color: 'var(--text)', marginBottom: '24px' }}>
                You navigated the investment challenges and learned along the way!
              </p>

              <div className="story-balance-update">
                <p className="story-balance-title">Balance Update:</p>
                {completionData.answers.map((a, i) => (
                  <div key={i} className="story-balance-row">
                    <span>
                      {a.isCorrect ? 'Correct' : 'Wrong'} Answer ({a.selectedOption})
                    </span>
                    <span className={a.cashEffect >= 0 ? 'story-balance-positive' : 'story-balance-negative'}>
                      {a.cashEffect >= 0 ? '+' : ''}{a.cashEffect} BHD
                    </span>
                  </div>
                ))}
                <div className="story-balance-row" style={{ borderTop: '1px solid var(--border)', paddingTop: '8px', marginTop: '8px' }}>
                  <strong>Final Balance</strong>
                  <strong>{completionData.finalBalance} BHD</strong>
                </div>
              </div>

              <button
                className="btn btn-primary"
                onClick={() => navigate('/stories')}
              >
                Back to Stories
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const currentQuestion = story?.questions?.[currentQuestionIndex];
  if (!currentQuestion) return null;

  return (
    <div className="page-wrapper">
      <Navbar />
      <PageBanner title="Investment Stories" />

      <div className="story-play-content">
        <div className="story-play-card">
          <button className="story-play-back" onClick={() => navigate('/stories')}>
            ← Back
          </button>

          <h2 className="story-play-title">{story.title}</h2>
          <p className="story-play-question">{currentQuestion.questionText}</p>

          <div className="story-play-choices">
            {currentQuestion.options.map(option => {
              let className = 'story-choice-btn';
              if (answerResult && selectedOption === option.id) {
                className += answerResult.isCorrect
                  ? ' selected-correct'
                  : ' selected-wrong';
              }
              return (
                <button
                  key={option.id}
                  className={className}
                  onClick={() => handleSelectOption(option.id)}
                  disabled={!!answerResult || submitting}
                >
                  {option.optionText}
                </button>
              );
            })}
          </div>

          {submitting && (
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <Spinner dark />
            </div>
          )}

          {answerResult && answerResult.reasoningText && (
            <div className={`story-reasoning ${answerResult.isCorrect ? 'correct' : 'wrong'}`}>
              {answerResult.reasoningText}
            </div>
          )}

          {answerResult && (
            <button className="story-continue-btn" onClick={handleContinue}>
              Continue
            </button>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}