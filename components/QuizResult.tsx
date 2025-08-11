import React, { useEffect, useMemo, useState } from 'react';
import { User, Quiz, ClassInfo } from '../types';
import { saveProgressAndLogActivity } from '../services/api';
import { StarIcon } from './icons';

interface QuizResultProps {
  score: number;
  total: number;
  onRetry: () => void;
  onFinish: () => void;
  quiz: Quiz;
  currentUser: User;
  classInfo?: ClassInfo;
}

const QuizResult: React.FC<QuizResultProps> = ({ score, total, onRetry, onFinish, quiz, currentUser, classInfo }) => {
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
  
  const isSelfStudy = quiz.activityId.startsWith('self-study-vocab');
  const starsEarned = useMemo(() => {
      if (!isSelfStudy || total !== 5) return 0;
      if (score === 5) return 3;
      if (score === 4) return 2;
      return 1;
  }, [isSelfStudy, score, total]);
  const [showStarSplash, setShowStarSplash] = useState(isSelfStudy && starsEarned > 0);
  const [shrink, setShrink] = useState(false);
  
  useEffect(() => {
    const recordProgress = async () => {
        await saveProgressAndLogActivity(currentUser, quiz, score, classInfo);
    };
    recordProgress();
  }, [score, total, quiz, currentUser, classInfo]);

  useEffect(() => {
    if (showStarSplash) {
      const t1 = setTimeout(() => setShrink(true), 700); // hold big for 0.7s
      const t2 = setTimeout(() => setShowStarSplash(false), 1300); // finish at 1.3s
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
  }, [showStarSplash]);

  // Build wrong-answer review set
  const wrongs = useMemo(() => {
    const result: { prompt: string; answer: string }[] = [];
    for (let i = 0; i < quiz.questions.length; i++) {
      const q = quiz.questions[i];
      // We cannot access userAnswers here; handled in QuizView wrapper. Keep component pure.
    }
    return result;
  }, [quiz.questions]);

  return (
    <div className="flex flex-col h-full bg-transparent p-6 items-center justify-center text-center">
      <h2 className="text-2xl font-bold text-slate-800 mb-2">퀴즈 완료!</h2>
      {isSelfStudy && starsEarned > 0 && (
        <div className="mb-4">
          {showStarSplash ? (
            <div className={`flex items-center justify-center gap-2 text-yellow-400 transition-transform ${shrink ? 'scale-100' : 'scale-[2.0]'} duration-500`}> 
              {[...Array(3)].map((_, i) => (
                <StarIcon key={i} className={`w-12 h-12 ${i < starsEarned ? 'text-yellow-400' : 'text-gray-300'}`} />
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center gap-1 text-yellow-400 animate-fade-in-up">
              {[...Array(3)].map((_, i) => (
                <StarIcon key={i} className={`w-8 h-8 ${i < starsEarned ? 'text-yellow-400' : 'text-gray-300'}`} />
              ))}
            </div>
          )}
        </div>
      )}
      <p className="text-lg text-gray-600 mb-6">당신의 점수는</p>

      <div className="relative w-48 h-48 flex items-center justify-center mb-8">
        <svg className="w-full h-full" viewBox="0 0 100 100">
          <circle className="text-gray-200" strokeWidth="10" stroke="currentColor" fill="transparent" r="45" cx="50" cy="50" />
          <circle
            className="text-blue-600"
            strokeWidth="10"
            strokeDasharray={2 * Math.PI * 45}
            strokeDashoffset={(2 * Math.PI * 45) * (1 - percentage / 100)}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
            r="45"
            cx="50"
            cy="50"
            style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: 'stroke-dashoffset 0.5s ease-in-out' }}
          />
        </svg>
        <div className="absolute flex flex-col">
            <span className="text-5xl font-bold text-slate-800">{percentage}%</span>
            <span className="text-gray-500 font-medium">{score} / {total}</span>
        </div>
      </div>

      <div className="w-full space-y-3">
        <button
          onClick={onRetry}
          className="w-full bg-blue-600 text-white font-bold py-4 rounded-lg hover:bg-blue-700 transition-colors"
        >
          다시 풀어보기
        </button>
        <button
          onClick={onFinish}
          className="w-full bg-white text-slate-800 border border-gray-300 font-bold py-4 rounded-lg hover:bg-gray-100 transition-colors"
        >
          돌아가기
        </button>
      </div>
    </div>
  );
};

export default QuizResult;