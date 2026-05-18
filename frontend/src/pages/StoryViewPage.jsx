import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { storiesApi } from '../api/storiesApi';
import Navbar from '../components/layout/Navbar';
import PageBanner from '../components/layout/PageBanner';
import Footer from '../components/layout/Footer';
import Spinner from '../components/common/Spinner';

export default function StoryViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [story, setStory] = useState(null);
  const [userAnswers, setUserAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  useEffect(() => {
    loadStoryAndAnswers();
  }, [id]);

  const loadStoryAndAnswers = async () => {
    try {
      const storyRes = await storiesApi.getStory(id);
      setStory(storyRes.data);

      const answersRes = await storiesApi.getUserAnswers(id);
      
      const answersMap = {};
      answersRes.data.forEach(answer => {
        answersMap[answer.questionId] = {
          selectedOptionId: answer.selectedOptionId,
          selectedOptionText: answer.selectedOptionText,
          isCorrect: answer.isCorrect,
          selectedOptionReasoning: answer.selectedOptionReasoning,
          correctOptionId: answer.correctOptionId,
          correctOptionText: answer.correctOptionText,
          correctOptionReasoning: answer.correctOptionReasoning
        };
      });
      setUserAnswers(answersMap);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load story');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < story.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
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

  if (!story) return null;

  const currentQuestion = story.questions[currentQuestionIndex];
  const userAnswer = userAnswers[currentQuestion?.id];
  const selectedOption = currentQuestion?.options.find(o => o.id === userAnswer?.selectedOptionId);
  const correctOption = currentQuestion?.options.find(o => o.id === userAnswer?.correctOptionId);
  const hasMultipleQuestions = story.questions.length > 1;

  return (
    <div className="page-wrapper">
      <Navbar />
      <PageBanner title="Investment Stories" />

      <div className="story-play-content">
        <div className="story-play-card-wide">
          <button className="story-play-back" onClick={() => navigate('/stories')}>
            ← Back to Stories
          </button>

          <h2 className="story-play-title">{story.title}</h2>

          {story.openingContent && (
            <div className="story-context">
              <p className="story-context-text">{story.openingContent}</p>
            </div>
          )}

          {hasMultipleQuestions && (
            <div className="story-question-nav">
              <button
                className="story-nav-btn"
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
              >
                ← Previous
              </button>
              <span className="story-question-counter">
                Question {currentQuestionIndex + 1} of {story.questions.length}
              </span>
              <button
                className="story-nav-btn"
                onClick={handleNext}
                disabled={currentQuestionIndex === story.questions.length - 1}
              >
                Next →
              </button>
            </div>
          )}

          <p className="story-play-question">{currentQuestion.questionText}</p>

          <div className="story-play-choices">
            {currentQuestion.options.map(option => {
              let className = 'story-choice-btn';
              const isUserChoice = option.id === userAnswer?.selectedOptionId;
              const isCorrectOption = option.id === userAnswer?.correctOptionId;
              
              if (isUserChoice && isCorrectOption) {
                className += ' user-correct-choice';
              } else if (isUserChoice && !isCorrectOption) {
                className += ' user-wrong-choice';
              } else if (isCorrectOption) {
                className += ' correct-answer-choice';
              }
              
              return (
                <button
                  key={option.id}
                  className={className}
                  disabled={true}
                >
                  {option.optionText}
                  {isUserChoice && isCorrectOption && (
                    <span className="choice-badge correct-badge"> ✓ Your answer (Correct)</span>
                  )}
                  {isUserChoice && !isCorrectOption && (
                    <span className="choice-badge wrong-badge"> ✗ Your answer (Wrong)</span>
                  )}
                  {!isUserChoice && isCorrectOption && (
                    <span className="choice-badge correct-badge"> ✓ Correct answer</span>
                  )}
                </button>
              );
            })}
          </div>

          <div className={`story-reasoning ${userAnswer?.isCorrect ? 'correct' : 'wrong'}`}>
            <div className="reasoning-header">
              <strong>{userAnswer?.isCorrect ? '✓ You answered correctly!' : '✗ You answered incorrectly'}</strong>
            </div>
            <div className="reasoning-content">
              <p><strong>Your answer:</strong> {selectedOption?.optionText || 'Not answered'}</p>
              <p><strong>Reasoning:</strong> {userAnswer?.selectedOptionReasoning || (userAnswer?.isCorrect ? 'Correct choice!' : 'No explanation provided.')}</p>
              
              {!userAnswer?.isCorrect && correctOption && (
                <div className="correct-answer-explanation">
                  <p><strong>✓ Correct answer:</strong> {correctOption.optionText}</p>
                  <p><strong>Explanation:</strong> {userAnswer?.correctOptionReasoning || correctOption.reasoningText || 'This is the financially sound choice.'}</p>
                </div>
              )}
              
              {!userAnswer?.isCorrect && !correctOption && userAnswer?.correctOptionText && (
                <div className="correct-answer-explanation">
                  <p><strong>✓ Correct answer:</strong> {userAnswer.correctOptionText}</p>
                  <p><strong>Explanation:</strong> {userAnswer.correctOptionReasoning || 'This is the financially sound choice.'}</p>
                </div>
              )}
            </div>
          </div>

          <div className="story-view-summary">
            <p className="story-summary-text">
              {hasMultipleQuestions 
                ? `Question ${currentQuestionIndex + 1} of ${story.questions.length}`
                : 'Single question story'
              }
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}