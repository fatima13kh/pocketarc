import { useState, useEffect, useRef } from 'react';
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
  const [answers, setAnswers] = useState({});
  const [selectedOption, setSelectedOption] = useState(null);
  const [answerResult, setAnswerResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [completionData, setCompletionData] = useState(null);
  
  const hasStarted = useRef(false);

  useEffect(() => {
    loadStoryAndProgress();
  }, [id]);

  const loadStoryAndProgress = async () => {
    try {
      if (!hasStarted.current) {
        hasStarted.current = true;
        await storiesApi.startStory(id);
      }
      
      const storyRes = await storiesApi.getStory(id);
      setStory(storyRes.data);
      
      try {
        const answersRes = await storiesApi.getUserAnswers(id);
        console.log('Loaded answers from backend:', answersRes.data);
        
        if (answersRes.data && answersRes.data.length > 0) {
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
          setAnswers(answersMap);
        }
      } catch (err) {
        console.log('No existing answers found');
      }
      
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load story');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = async (optionId) => {
    if (answerResult || submitting) return;
    const question = story.questions[currentQuestionIndex];
    
    if (answers[question.id]) return;

    setSelectedOption(optionId);
    setSubmitting(true);

    try {
      const res = await storiesApi.submitAnswer(id, {
        questionId: question.id,
        selectedOptionId: optionId,
      });

      const selectedOpt = question.options.find(o => o.id === optionId);
      const correctOpt = question.options.find(o => o.isCorrect === true);
      
      const result = {
        selectedOptionId: optionId,
        selectedOptionText: selectedOpt?.optionText,
        isCorrect: res.data.isCorrect,
        selectedOptionReasoning: selectedOpt?.reasoningText || 'No explanation provided.',
        correctOptionId: correctOpt?.id,
        correctOptionText: correctOpt?.optionText,
        correctOptionReasoning: correctOpt?.reasoningText || 'This is the correct answer.'
      };
      
      console.log('Answer submitted:', result);
      setAnswerResult(result);
      setAnswers(prev => ({ ...prev, [question.id]: result }));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit answer');
      setAnswerResult(null);
    } finally {
      setSubmitting(false);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < story.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedOption(null);
      setAnswerResult(null);
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      const newIndex = currentQuestionIndex - 1;
      setCurrentQuestionIndex(newIndex);
      
      const previousQuestion = story.questions[newIndex];
      const existingAnswer = answers[previousQuestion?.id];
      
      if (existingAnswer) {
        setAnswerResult(existingAnswer);
        setSelectedOption(existingAnswer.selectedOptionId);
      } else {
        setSelectedOption(null);
        setAnswerResult(null);
      }
    }
  };

  const handleComplete = async () => {
    const allAnswered = story.questions.every(q => answers[q.id]);
    if (!allAnswered) {
      setError('Please answer all questions before completing the story');
      return;
    }
    
    try {
      const res = await storiesApi.completeStory(id);
      setCompletionData(res.data);
      setCompleted(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to complete story');
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
          <div className="story-play-card-wide">
            <button className="story-play-back" onClick={() => navigate('/stories')}>
              ← Back to Stories
            </button>
            <div className="story-completion">
              <h2>Story Completed!</h2>
              <p className="story-completion-subtitle">
                Well Done! You've completed "{completionData.storyTitle}"
              </p>
              <div className="story-balance-update">
                <p className="story-balance-title">Your Results:</p>
                {completionData.answers.map((a, i) => (
                  <div key={i} className="story-balance-row">
                    <span>
                      {a.isCorrect ? '✓ Correct' : '✗ Incorrect'} - {a.questionText?.substring(0, 50)}...
                    </span>
                    <span className={a.cashEffect >= 0 ? 'story-balance-positive' : 'story-balance-negative'}>
                      {a.cashEffect >= 0 ? '+' : ''}{a.cashEffect} BHD
                    </span>
                  </div>
                ))}
                <div className="story-balance-row" style={{ borderTop: '1px solid var(--border)', paddingTop: '12px', marginTop: '12px' }}>
                  <strong>Total Reward: {completionData.totalReward} BHD</strong>
                  <strong>Final Balance: {completionData.finalBalance} BHD</strong>
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

  const hasMultipleQuestions = story.questions.length > 1;
  const isLastQuestion = currentQuestionIndex === story.questions.length - 1;
  const isCurrentAnswered = !!answers[currentQuestion.id];
  const allQuestionsAnswered = story.questions.every(q => answers[q.id]);
  
  const correctOption = currentQuestion.options.find(o => o.isCorrect === true);

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
                onClick={handlePrevQuestion}
                disabled={currentQuestionIndex === 0}
              >
                ← Previous
              </button>
              <span className="story-question-counter">
                Question {currentQuestionIndex + 1} of {story.questions.length}
                {isCurrentAnswered && " ✓ Answered"}
              </span>
              <button
                className="story-nav-btn"
                onClick={handleNextQuestion}
                disabled={isLastQuestion}
              >
                Next →
              </button>
            </div>
          )}

          <p className="story-play-question">{currentQuestion.questionText}</p>

          <div className="story-play-choices">
            {currentQuestion.options.map(option => {
              let className = 'story-choice-btn';
              const isSelected = answerResult && selectedOption === option.id;
              const isCorrectOption = option.isCorrect;
              const showCorrectAnswer = answerResult && !answerResult.isCorrect && isCorrectOption;
              const isPreviouslyAnswered = isCurrentAnswered && !answerResult;
              
              if (isPreviouslyAnswered) {
                const prevAnswer = answers[currentQuestion.id];
                if (prevAnswer.selectedOptionId === option.id) {
                  className += prevAnswer.isCorrect ? ' selected-correct' : ' selected-wrong';
                } else if (option.isCorrect && !prevAnswer.isCorrect) {
                  className += ' show-correct-answer';
                }
              } else {
                if (isSelected) {
                  className += answerResult.isCorrect ? ' selected-correct' : ' selected-wrong';
                } else if (showCorrectAnswer) {
                  className += ' show-correct-answer';
                }
              }
              
              return (
                <button
                  key={option.id}
                  className={className}
                  onClick={() => handleSelectOption(option.id)}
                  disabled={!!answerResult || submitting || isCurrentAnswered}
                >
                  {option.optionText}
                  {isSelected && answerResult && (
                    <span className="choice-badge">
                      {answerResult.isCorrect ? ' ✓ Your answer (Correct)' : ' ✗ Your answer (Wrong)'}
                    </span>
                  )}
                  {showCorrectAnswer && (
                    <span className="choice-badge correct-badge"> ✓ Correct answer</span>
                  )}
                  {isPreviouslyAnswered && answers[currentQuestion.id]?.selectedOptionId === option.id && (
                    <span className="choice-badge">
                      {answers[currentQuestion.id].isCorrect ? ' ✓ Your answer (Correct)' : ' ✗ Your answer (Wrong)'}
                    </span>
                  )}
                  {isPreviouslyAnswered && option.isCorrect && answers[currentQuestion.id]?.selectedOptionId !== option.id && (
                    <span className="choice-badge correct-badge"> ✓ Correct answer</span>
                  )}
                </button>
              );
            })}
          </div>

          {submitting && (
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <Spinner dark />
            </div>
          )}

          {answerResult && (
            <div className={`story-reasoning ${answerResult.isCorrect ? 'correct' : 'wrong'}`}>
              <div className="reasoning-header">
                <strong>{answerResult.isCorrect ? '✓ Correct!' : '✗ Incorrect'}</strong>
              </div>
              <div className="reasoning-content">
                <p><strong>Your choice:</strong> {answerResult.selectedOptionText}</p>
                <p><strong>Reasoning:</strong> {answerResult.selectedOptionReasoning}</p>
                
                {correctOption && (
                  <div className="correct-answer-explanation">
                    <p><strong>✓ Correct answer:</strong> {correctOption.optionText}</p>
                    <p><strong>Explanation:</strong> {correctOption.reasoningText || 'This is the financially sound choice.'}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {isCurrentAnswered && !answerResult && answers[currentQuestion.id] && (
            <div className={`story-reasoning ${answers[currentQuestion.id].isCorrect ? 'correct' : 'wrong'}`}>
              <div className="reasoning-header">
                <strong>{answers[currentQuestion.id].isCorrect ? '✓ Previously answered correctly!' : '✗ Previously answered incorrectly'}</strong>
              </div>
              <div className="reasoning-content">
                <p><strong>Your choice:</strong> {answers[currentQuestion.id].selectedOptionText}</p>
                <p><strong>Reasoning:</strong> {answers[currentQuestion.id].selectedOptionReasoning}</p>
                
                {correctOption && (
                  <div className="correct-answer-explanation">
                    <p><strong>✓ Correct answer:</strong> {correctOption.optionText}</p>
                    <p><strong>Explanation:</strong> {correctOption.reasoningText || 'This is the financially sound choice.'}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="story-action-buttons">
            {answerResult && !isLastQuestion && (
              <button className="story-continue-btn" onClick={handleNextQuestion}>
                Next Question →
              </button>
            )}
            
            {answerResult && isLastQuestion && (
              <button className="story-complete-btn" onClick={handleComplete}>
                Complete Story
              </button>
            )}
            
            {isCurrentAnswered && isLastQuestion && allQuestionsAnswered && !answerResult && (
              <button className="story-complete-btn" onClick={handleComplete}>
                Complete Story
              </button>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}