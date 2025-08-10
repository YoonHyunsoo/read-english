
import React, { useState, useMemo, useEffect } from 'react';
import { Quiz, Question, User, ClassInfo } from '../types';
import { BackIcon, BookmarkIcon, SpeakerIcon } from './icons';
import QuizResult from './QuizResult';
import { addToWordbook, isInWordbook } from '../utils/wordbook';

interface QuizViewProps {
  quiz: Quiz;
  onBack: () => void;
  currentUser: User;
  classInfo?: ClassInfo;
}

const QuizView: React.FC<QuizViewProps> = ({ quiz, onBack, currentUser, classInfo }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<(string | null)[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [bookmarkToast, setBookmarkToast] = useState<string | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);

  const currentQuestion = quiz.questions[currentQuestionIndex];

  useEffect(() => {
    // reset per-question bookmark state
    setIsBookmarked(isInWordbook(currentUser.email, currentQuestion.correctAnswer));
  }, [currentUser.email, currentQuestion.correctAnswer]);

  if (!quiz.questions || quiz.questions.length === 0) {
    return (
      <div className="flex flex-col h-full bg-transparent p-6 items-center justify-center text-center">
        <h2 className="text-xl font-bold text-slate-800 mb-4">학습 오류</h2>
        <p className="text-gray-600 mb-6">
          이 활동에 대한 질문을 불러올 수 없습니다. 관리자에게 문의하거나 다른 활동을 시도해 주세요.
        </p>
        <button
          onClick={onBack}
          className="w-full max-w-xs bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          돌아가기
        </button>
      </div>
    );
  }

  const handleToggleBookmark = () => {
    if (isBookmarked) {
      setBookmarkToast('이미 Wordbook에 등록되어 있어요.');
      setTimeout(() => setBookmarkToast(null), 1000);
      return;
    }
    const { added } = addToWordbook(currentUser.email, {
      word: currentQuestion.correctAnswer,
      meaning: currentQuestion.word,
    });
    if (added) {
      setIsBookmarked(true);
      setBookmarkToast('Wordbook에 등록되었어요!');
      setTimeout(() => setBookmarkToast(null), 1000);
    } else {
      setBookmarkToast('이미 Wordbook에 등록되어 있어요.');
      setTimeout(() => setBookmarkToast(null), 1000);
    }
  };

  const handleOptionClick = (option: string) => {
    if (isAnswered) return;
    setSelectedOption(option);
  };

  const handleSubmitAnswer = () => {
    if (!selectedOption) return;
    setIsAnswered(true);
    setUserAnswers([...userAnswers, selectedOption]);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setShowResult(true);
    }
  };

  const handleRetry = () => {
    setCurrentQuestionIndex(0);
    setUserAnswers([]);
    setSelectedOption(null);
    setIsAnswered(false);
    setShowResult(false);
  };

  const score = useMemo(() => {
    return userAnswers.reduce((correctCount, answer, index) => {
      if (answer === quiz.questions[index].correctAnswer) {
        return correctCount + 1;
      }
      return correctCount;
    }, 0);
  }, [userAnswers, quiz.questions]);

  if (showResult) {
    return (
      <QuizResult 
        score={score} 
        total={quiz.questions.length} 
        onRetry={handleRetry} 
        onFinish={onBack} 
        quiz={quiz}
        currentUser={currentUser}
        classInfo={classInfo}
      />
    );
  }

  const getButtonClass = (option: string) => {
    if (!isAnswered) {
      return selectedOption === option ? 'bg-blue-200 border-blue-400' : 'bg-white hover:bg-gray-100';
    }
    if (option === currentQuestion.correctAnswer) {
      return 'bg-green-200 border-green-500';
    }
    if (option === selectedOption) {
      return 'bg-red-200 border-red-500';
    }
    return 'bg-white border-gray-300 opacity-70';
  };

  const isSelfStudy = quiz.activityId.startsWith('self-study-vocab');

  return (
    <div className="flex flex-col h-full bg-transparent">
      <header className="flex items-center p-4 pt-4 pb-2 bg-transparent flex-shrink-0 relative">
        <button onClick={onBack} className="absolute left-4 p-1 rounded-full hover:bg-gray-200" aria-label="퀴즈 목록으로 돌아가기">
          <div className="w-6 h-6 text-slate-700">
            <BackIcon />
          </div>
        </button>
        <h1 className="text-lg font-bold text-slate-800 text-center w-full">{quiz.title}</h1>
        <button onClick={handleToggleBookmark} className="absolute right-4 p-1 rounded-lg hover:bg-gray-200" aria-label="Wordbook에 추가">
          <BookmarkIcon className={`w-6 h-6 ${isBookmarked ? 'text-blue-600' : 'text-slate-600'}`} />
        </button>
      </header>

      <main className="flex-grow p-4 flex flex-col justify-between">
        <div>
          <div className="text-center mb-8">
            <p className="text-gray-500 text-sm">
                {quiz.activityType === 'vocab' 
                    ? '다음 뜻에 맞는 영단어를 고르세요:' 
                    : '다음 단어를 번역하세요:'
                }
            </p>
            <p className="text-4xl font-bold text-slate-800 my-2">{currentQuestion.word}</p>
            {isSelfStudy && (
              <div className="mt-1 flex justify-center">
                <button
                  onClick={() => { try { const u = new SpeechSynthesisUtterance(currentQuestion.correctAnswer); u.lang='en-US'; window.speechSynthesis.cancel(); window.speechSynthesis.speak(u);} catch {} }}
                  className="p-1.5 rounded hover:bg-gray-100"
                  aria-label="발음 재생"
                >
                  <SpeakerIcon className="w-6 h-6 text-slate-700" />
                </button>
              </div>
            )}
            <div className="w-20 h-1 bg-gray-200 rounded-full mx-auto mt-2">
                <div className="h-1 bg-blue-600 rounded-full" style={{ width: `${((currentQuestionIndex + 1) / quiz.questions.length) * 100}%`}}></div>
            </div>
          </div>

          <div className="space-y-3">
            {currentQuestion.options.map(option => (
              <button 
                key={option} 
                onClick={() => handleOptionClick(option)}
                disabled={isAnswered}
                className={`w-full p-4 rounded-lg border text-left text-lg font-semibold transition-colors duration-200 ${getButtonClass(option)}`}
              >
                {option}
              </button>
            ))}
          </div>
          
          {isAnswered && currentQuestion.explanation && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="font-bold text-blue-800">설명</h3>
                <p className="text-blue-700">{currentQuestion.explanation}</p>
            </div>
          )}
        </div>

        <div className="mt-6">
          {isAnswered ? (
            <button 
              onClick={handleNextQuestion}
              className="w-full bg-blue-600 text-white font-bold py-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              {currentQuestionIndex < quiz.questions.length - 1 ? '다음' : '결과 보기'}
            </button>
          ) : (
             <button 
              onClick={handleSubmitAnswer}
              disabled={!selectedOption}
              className="w-full bg-blue-600 text-white font-bold py-4 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              정답 확인
            </button>
          )}
        </div>
      </main>

      {bookmarkToast && (
        <div className="fixed bg-slate-900 text-white text-xs font-medium px-3 py-2 rounded-lg shadow-md" style={{ top: '75%', left: '50%', transform: 'translate(-50%, -50%)' }}>
          {bookmarkToast}
        </div>
      )}
    </div>
  );
};

export default QuizView;