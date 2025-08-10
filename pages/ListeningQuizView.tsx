import React, { useState, useMemo, useEffect } from 'react';
import { User, ClassInfo, ListeningMaterial } from '../types';
import { BackIcon, BookmarkIcon } from '../components/icons';
import { addToWordbook, isInWordbook } from '../utils/wordbook';
import { saveListeningProgressAndLogActivity } from '../services/api';
import PageIdentifier from '../components/DevTools/PageIdentifier';

interface ListeningQuizViewProps {
  material: ListeningMaterial;
  onFinish: () => void;
  currentUser: User;
  classInfo?: ClassInfo;
}

const ListeningQuizView: React.FC<ListeningQuizViewProps> = ({ material, onFinish, currentUser, classInfo }) => {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);
  const questions = material.mcqs;
  const [bookmarkToast, setBookmarkToast] = useState<string | null>(null);
  const [bookmarkedIdx, setBookmarkedIdx] = useState<Record<number, boolean>>({});

  const handleSelectAnswer = (questionIndex: number, option: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionIndex]: option
    }));
  };

  const handleToggleBookmark = (qIndex: number) => {
    const q = questions[qIndex];
    const keyWord = q.answer; // 정답을 대표 단어로 저장
    if (bookmarkedIdx[qIndex] || isInWordbook(currentUser.email, keyWord)) {
      setBookmarkToast('이미 Wordbook에 등록되어 있어요.');
      setTimeout(() => setBookmarkToast(null), 1000);
      return;
    }
    const { added } = addToWordbook(currentUser.email, { word: keyWord });
    if (added) {
      setBookmarkedIdx((prev) => ({ ...prev, [qIndex]: true }));
      setBookmarkToast('Wordbook에 등록되었어요!');
      setTimeout(() => setBookmarkToast(null), 1000);
    } else {
      setBookmarkToast('이미 Wordbook에 등록되어 있어요.');
      setTimeout(() => setBookmarkToast(null), 1000);
    }
  };

  const handleSubmit = () => {
    if (Object.keys(answers).length !== questions.length) {
      if (!window.confirm("모든 질문에 답하지 않았습니다. 정말로 제출하시겠습니까?")) {
        return;
      }
    }
    setShowResults(true);
  };
  
  const handleRetry = () => {
    setAnswers({});
    setShowResults(false);
  }

  const score = useMemo(() => {
    if (!showResults) return 0;
    return questions.reduce((count, question, index) => {
      const userAnswer = answers[index];
      if (userAnswer === question.answer) {
        return count + 1;
      }
      return count;
    }, 0);
  }, [answers, questions, showResults]);

  useEffect(() => {
    if (showResults) {
      const recordProgress = async () => {
        await saveListeningProgressAndLogActivity(currentUser, material, score, classInfo);
      };
      recordProgress();
    }
  }, [showResults, score, material, currentUser, classInfo]);


  if (showResults) {
    return (
      <div className="flex flex-col h-full bg-transparent">
        <PageIdentifier path="pages/ListeningQuizView.tsx" />
        <header className="flex items-center p-4 pt-4 pb-2 bg-transparent flex-shrink-0 relative">
          <h1 className="text-lg font-bold text-slate-800 text-center w-full">듣기 평가 결과</h1>
        </header>
        <div className="flex-grow overflow-y-auto p-4">
            <div className="text-center mb-6">
              <p className="text-2xl font-bold">점수: {score} / {questions.length}</p>
            </div>
            <div className="space-y-4">
              {questions.map((q, index) => {
                const userAnswer = answers[index];
                const isCorrect = userAnswer === q.answer;
                return (
                  <div key={index} className={`p-3 rounded-lg border ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <p className="font-semibold text-slate-700">{index + 1}. {q.question_text}</p>
                    <p className={`mt-2 text-sm ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                      답변: {userAnswer || "미답변"} {isCorrect ? '✔' : '✘'}
                    </p>
                    {!isCorrect && (
                      <p className="mt-1 text-sm text-green-800 font-semibold">정답: {q.answer}</p>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="mt-8 space-y-3">
              <button onClick={handleRetry} className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg">다시하기</button>
              <button onClick={onFinish} className="w-full bg-gray-200 text-slate-800 font-bold py-3 rounded-lg">종료</button>
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-transparent">
      <PageIdentifier path="pages/ListeningQuizView.tsx" />
      <header className="flex items-center p-4 pt-4 pb-2 bg-transparent flex-shrink-0 relative">
        <button onClick={onFinish} className="absolute left-4 p-1 rounded-full hover:bg-gray-200" aria-label="Back to class page">
          <div className="w-6 h-6 text-slate-700">
            <BackIcon />
          </div>
        </button>
        <h1 className="text-lg font-bold text-slate-800 text-center w-full">{material.title}</h1>
      </header>
      
      <main className="flex-grow p-4 pt-0 overflow-y-auto">
        <div className="space-y-6">
          {questions.map((question, index) => (
            <div key={index} className="bg-white p-4 rounded-xl border border-gray-200">
              <div className="flex items-start justify-between">
                <p className="font-semibold text-slate-800 mb-3 flex-1">{index + 1}. {question.question_text}</p>
                <button onClick={() => handleToggleBookmark(index)} className="ml-3 p-1 rounded hover:bg-gray-100" aria-label="Wordbook에 추가">
                  <BookmarkIcon className={`w-5 h-5 ${bookmarkedIdx[index] ? 'text-blue-600' : 'text-slate-600'}`} />
                </button>
              </div>
              <div className="space-y-2">
                {question.options.map((option, optIndex) => (
                  <label key={optIndex} className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-colors ${answers[index] === option ? 'bg-blue-100 border-blue-500' : 'bg-gray-50 border-gray-200'}`}>
                    <input
                      type="radio"
                      name={`question-${index}`}
                      value={option}
                      checked={answers[index] === option}
                      onChange={() => handleSelectAnswer(index, option)}
                      className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="ml-3 text-sm font-medium text-slate-700">{option}</span>
                  </label>
                ))}
              </div>
      {bookmarkToast && (
        <div className="fixed bg-slate-900 text-white text-xs font-medium px-3 py-2 rounded-lg shadow-md" style={{ top: '75%', left: '50%', transform: 'translate(-50%, -50%)' }}>
          {bookmarkToast}
        </div>
      )}
            </div>
          ))}
        </div>
      </main>
       <footer className="p-4 border-t border-gray-200 bg-white sticky bottom-0">
           <button
             onClick={handleSubmit}
             className="w-full bg-blue-600 text-white font-bold py-3 px-5 rounded-lg hover:bg-blue-700 transition-colors text-base"
           >
             답안 제출
           </button>
        </footer>
    </div>
  );
};

export default ListeningQuizView;