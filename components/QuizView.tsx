
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
  const [attemptsLeft, setAttemptsLeft] = useState(2); // 2 attempts max per question
  const [disabledOptionsSet, setDisabledOptionsSet] = useState<Set<string>>(new Set());
  const [firstWrongOption, setFirstWrongOption] = useState<string | null>(null);
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
    const isCorrect = selectedOption === currentQuestion.correctAnswer;
    if (isCorrect) {
      setIsAnswered(true);
      setUserAnswers([...userAnswers, selectedOption]);
    } else if (attemptsLeft > 1) {
      // give one more chance: disable chosen option
      setAttemptsLeft(1);
      // store disabled option so it cannot be selected again
      setDisabledOptionsSet(new Set<string>([...Array.from(disabledOptionsSet), selectedOption]));
      setFirstWrongOption(selectedOption);
      // clear selection to force user to pick a different option
      setSelectedOption(null);
      // keep question open; visually mark wrong selection via state
    } else {
      setIsAnswered(true);
      setUserAnswers([...userAnswers, selectedOption]);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedOption(null);
      setIsAnswered(false);
      setAttemptsLeft(2);
      setDisabledOptionsSet(new Set());
      setFirstWrongOption(null);
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

  const [reviewMode, setReviewMode] = useState(false);
  const wrongIndices = useMemo(() => userAnswers.map((ans, i) => ans === quiz.questions[i].correctAnswer ? null : i).filter((v): v is number => v !== null), [userAnswers, quiz.questions]);

  if (showResult && !reviewMode) {
    return (
      <div className="flex flex-col h-full bg-transparent p-6 items-center justify-center text-center">
        <QuizResult 
          score={score} 
          total={quiz.questions.length} 
          onRetry={handleRetry} 
          onFinish={onBack} 
          quiz={quiz}
          currentUser={currentUser}
          classInfo={classInfo}
        />
        {wrongIndices.length > 0 && (
          <button
            onClick={() => { setReviewMode(true); setCurrentQuestionIndex(wrongIndices[0]); setIsAnswered(true); setSelectedOption(userAnswers[wrongIndices[0]]); }}
            className="mt-4 w-full max-w-xs bg-slate-800 text-white font-bold py-3 rounded-lg hover:bg-slate-900 transition-colors"
          >
            오답 리뷰 ({wrongIndices.length})
          </button>
        )}
      </div>
    );
  }

  if (showResult && reviewMode) {
    const idx = currentQuestionIndex;
    const isWrong = userAnswers[idx] !== quiz.questions[idx].correctAnswer;
    return (
      <div className="flex flex-col h-full bg-transparent p-6">
        <h2 className="text-xl font-bold text-slate-800 text-center">오답 리뷰</h2>
        <div className="mt-4 text-center">
          <p className="text-gray-500 text-sm mb-2">문항</p>
          <p className="text-2xl font-bold text-slate-800 whitespace-pre-wrap">{quiz.questions[idx].word}</p>
          <div className="mt-4 space-y-2">
            {quiz.questions[idx].options.map(opt => (
              <div key={opt} className={`w-full p-3 rounded-lg border text-left text-base ${opt === quiz.questions[idx].correctAnswer ? 'bg-green-50 border-green-400' : (opt === userAnswers[idx] ? 'bg-red-50 border-red-400' : 'bg-white border-gray-200')}`}>
                {opt}
              </div>
            ))}
          </div>
          <div className="mt-6 flex justify-between">
            <button
              onClick={() => {
                const pos = wrongIndices.indexOf(idx);
                if (pos > 0) { const prev = wrongIndices[pos-1]; setCurrentQuestionIndex(prev); setSelectedOption(userAnswers[prev]); setIsAnswered(true);} }
              }
              disabled={wrongIndices.indexOf(idx) <= 0}
              className="px-4 py-2 rounded-lg bg-gray-200 text-slate-700 disabled:opacity-50"
            >이전</button>
            <button
              onClick={() => {
                const pos = wrongIndices.indexOf(idx);
                if (pos < wrongIndices.length-1) { const next = wrongIndices[pos+1]; setCurrentQuestionIndex(next); setSelectedOption(userAnswers[next]); setIsAnswered(true);} else { setReviewMode(false); }
              }}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white"
            >{(wrongIndices.indexOf(idx) < wrongIndices.length-1) ? '다음' : '리뷰 종료'}</button>
          </div>
        </div>
      </div>
    );
  }

  const getButtonClass = (option: string) => {
    if (!isAnswered) {
      if (selectedOption === option) return 'bg-blue-200 border-blue-400';
      if (attemptsLeft === 1 && userAnswers[currentQuestionIndex] === null && selectedOption && option === selectedOption) return 'bg-red-200 border-red-500';
      return 'bg-white hover:bg-gray-100';
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
            <p className="text-slate-800 text-base font-bold text-left">
              {(() => {
                const t = currentQuestion as any;
                switch (t.promptType) {
                  case 'kor->eng': return '다음 한국어 뜻에 맞는 영단어를 고르세요:';
                  case 'eng->kor': return '다음 영단어의 한국어 뜻을 고르세요:';
                  case 'cloze': return '다음 문장의 빈칸에 들어갈 알맞은 영단어를 고르세요:';
                  case 'engMeaning': return '다음 영어 정의에 맞는 영단어를 고르세요:';
                  default: return quiz.activityType === 'vocab' ? '다음 뜻에 맞는 영단어를 고르세요:' : '다음 단어를 번역하세요:';
                }
              })()}
            </p>
            <p className="text-4xl font-extrabold text-slate-900 my-2 whitespace-pre-wrap text-center">{currentQuestion.word}</p>
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
            {currentQuestion.options.map(option => {
              const disabledOnce = (attemptsLeft === 1 && disabledOptionsSet.has(option)) && option !== currentQuestion.correctAnswer;
              return (
                <button 
                  key={option} 
                  onClick={() => handleOptionClick(option)}
                  disabled={isAnswered || disabledOnce}
                  className={`w-full p-4 rounded-lg border text-left text-lg font-semibold transition-colors duration-200 ${getButtonClass(option)} ${disabledOnce ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {option}
                </button>
              );
            })}
          </div>
          
          {isAnswered && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="font-bold text-blue-800">설명</h3>
              <div className="text-blue-700 text-sm space-y-1">
                {(() => {
                  const q:any = currentQuestion;
                  const logs: {label:'정답'|'오답'; opt:string}[] = [];
                  const sel = selectedOption as string;
                  const correct = q.correctAnswer as string;
                  if (firstWrongOption && firstWrongOption !== correct) {
                    logs.push({ label: '오답', opt: firstWrongOption });
                  }
                  if (sel !== correct) {
                    logs.push({ label: '오답', opt: sel });
                  }
                  logs.push({ label: '정답', opt: correct });

                  return logs.map(({label, opt}) => (
                    <div key={opt} className="flex items-start gap-2">
                      <span className={`inline-block mt-0.5 w-2 h-2 rounded-full ${label==='정답' ? 'bg-green-500' : 'bg-red-500'}`} />
                      <div>
                        {(() => {
                          const meta = q.metaOptions && q.metaOptions[opt];
                          const eng = meta?.english || opt;
                          const pos = meta?.pos ? `(${meta.pos})` : '';
                          let tail = '';
                          if (pos) tail += pos;
                          if (meta?.korean) tail += (tail ? ` ${meta.korean}` : `${meta.korean}`);
                          const sep = tail ? ' : ' : '';
                          return (
                            <p className="font-semibold">[{label}] {eng}{sep}{tail}</p>
                          );
                        })()}
                      </div>
                    </div>
                  ));
                })()}
              </div>
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
              disabled={!selectedOption || (attemptsLeft === 1 && selectedOption && disabledOptionsSet.has(selectedOption))}
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