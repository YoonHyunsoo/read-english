import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ReadingMaterial, User, ClassInfo, VocabItem, ReadingMCQ } from '../types';
import { saveReadingProgressAndLogActivity } from '../services/api';
import { BackIcon, BookmarkIcon } from '../components/icons';
import { addToWordbook, isInWordbook } from '../utils/wordbook';
import PassageModal from '../components/PassageModal';
import PageIdentifier from '../components/DevTools/PageIdentifier';

interface ReadingActivityViewProps {
    material: ReadingMaterial;
    onFinish: () => void;
    currentUser: User;
    classInfo?: ClassInfo;
}

// --- Step Components ---

const PassageStep: React.FC<{ passage: string, vocab: VocabItem[], onNext: () => void }> = ({ passage, vocab, onNext }) => {
    const [popup, setPopup] = useState<{ word: string; pos: string; meaning: string; x: number; y: number; } | null>(null);
    const [isPopupVisible, setIsPopupVisible] = useState(false);
    const popupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const vocabMap = useMemo(() => new Map(vocab.map(v => [v.word.toLowerCase(), v])), [vocab]);
    
    const handleWordClick = (e: React.MouseEvent<HTMLSpanElement>) => {
        e.stopPropagation();

        if (popupTimerRef.current) {
            clearTimeout(popupTimerRef.current);
        }
        
        const clickedWord = e.currentTarget.innerText.replace(/[.,!?;:"'()]/g, '').toLowerCase();

        if (vocabMap.has(clickedWord)) {
            const containerRect = e.currentTarget.offsetParent?.getBoundingClientRect();
            const wordRect = e.currentTarget.getBoundingClientRect();
            
            const x = (wordRect.left - (containerRect?.left ?? 0)) + wordRect.width / 2;
            const y = (wordRect.top - (containerRect?.top ?? 0));
            
            const vocabData = vocabMap.get(clickedWord)!;

            setPopup({
                word: vocabData.word,
                pos: vocabData.partofspeech,
                meaning: vocabData.meaningKor,
                x,
                y,
            });
            setIsPopupVisible(true);

            popupTimerRef.current = setTimeout(() => {
                setIsPopupVisible(false);
            }, 3000);
        } else {
            setIsPopupVisible(false);
        }
    };
    
    const hidePopup = () => {
        setIsPopupVisible(false);
        if (popupTimerRef.current) {
            clearTimeout(popupTimerRef.current);
        }
    };


    const renderPassage = () => {
        const words = passage.split(/(\s+)/);
        const vocabWords = new Set(vocab.map(v => v.word.toLowerCase()));

        return words.map((word, index) => {
            const cleanWord = word.replace(/[.,!?;:"'()]/g, '').toLowerCase();
            if (vocabWords.has(cleanWord)) {
                return (
                    <span
                        key={index}
                        className="font-bold text-blue-600 cursor-pointer hover:bg-blue-100 rounded"
                        onClick={handleWordClick}
                    >
                        {word}
                    </span>
                );
            }
            return <span key={index}>{word}</span>;
        });
    };

    return (
        <div className="p-4">
            <h2 className="text-xl font-bold mb-1 text-slate-800">지문 읽기</h2>
            <p className="text-sm text-gray-600 mb-4">파란색으로 표시된 단어를 클릭하면 뜻을 확인할 수 있습니다.</p>
            <div className="p-5 bg-white rounded-lg border border-gray-200 shadow-sm leading-relaxed text-lg relative" onClick={hidePopup}>
                <p>{renderPassage()}</p>
                {popup && (
                    <div
                        className="absolute transition-opacity duration-300 ease-out bg-gray-900/70 backdrop-blur-sm text-white text-sm rounded-md px-3 py-1.5 shadow-lg"
                        style={{
                            left: popup.x,
                            top: popup.y,
                            transform: 'translate(-50%, -100%) translateY(-8px)',
                            opacity: isPopupVisible ? 1 : 0,
                            pointerEvents: 'none',
                            zIndex: 10,
                        }}
                        onTransitionEnd={() => {
                            if (!isPopupVisible) {
                                setPopup(null);
                            }
                        }}
                    >
                        <div className="flex items-center gap-1.5 whitespace-nowrap">
                            <span className="font-semibold text-sky-300">{popup.word}</span>
                            <span className="italic text-yellow-300">{popup.pos}</span>
                            <span className="text-white">{popup.meaning}</span>
                        </div>
                        <div
                            className="absolute left-1/2 -translate-x-1/2 bottom-[-4px] w-0 h-0"
                            style={{
                                borderLeft: '4px solid transparent',
                                borderRight: '4px solid transparent',
                                borderTop: '4px solid rgba(17, 24, 39, 0.7)',
                            }}
                        />
                    </div>
                )}
            </div>
            <button onClick={onNext} className="mt-6 w-full bg-blue-600 text-white font-bold py-3.5 rounded-lg hover:bg-blue-700 transition-colors">다음: 문제 풀기</button>
        </div>
    );
};

const MCQStep: React.FC<{ questions: ReadingMCQ[], passage: string, onFinish: (answers: Record<number, string>) => void }> = ({ questions, passage, onFinish }) => {
    const [currentQIndex, setCurrentQIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [answers, setAnswers] = useState<Record<number, string>>({});
    const [isPassageVisible, setIsPassageVisible] = useState(false);
    const [bookmarkToast, setBookmarkToast] = useState<string | null>(null);
    const [bookmarkedIdx, setBookmarkedIdx] = useState<Record<number, boolean>>({});

    const currentQuestion = questions[currentQIndex];

    const handleToggleBookmark = () => {
        const keyWord = currentQuestion.answer;
        if (bookmarkedIdx[currentQIndex] || isInWordbook(localStorage.getItem('currentUserEmail') || '', keyWord)) {
            setBookmarkToast('이미 Wordbook에 등록되어 있어요.');
            setTimeout(() => setBookmarkToast(null), 1000);
            return;
        }
        const email = localStorage.getItem('currentUserEmail') || '';
        if (!email) {
            setBookmarkToast('로그인 정보가 필요합니다.');
            setTimeout(() => setBookmarkToast(null), 1000);
            return;
        }
        const { added } = addToWordbook(email, { word: keyWord });
        if (added) {
            setBookmarkedIdx((prev) => ({ ...prev, [currentQIndex]: true }));
            setBookmarkToast('Wordbook에 등록되었어요!');
            setTimeout(() => setBookmarkToast(null), 1000);
        } else {
            setBookmarkToast('이미 Wordbook에 등록되어 있어요.');
            setTimeout(() => setBookmarkToast(null), 1000);
        }
    };

    const handleNext = () => {
        if (!selectedOption) return;

        const newAnswers = { ...answers, [currentQIndex]: selectedOption };
        setAnswers(newAnswers);

        if (currentQIndex < questions.length - 1) {
            setCurrentQIndex(currentQIndex + 1);
            setSelectedOption(null);
        } else {
            onFinish(newAnswers);
        }
    };

    return (
        <>
            <PassageModal isVisible={isPassageVisible} passage={passage} onClose={() => setIsPassageVisible(false)} />
            <div className="p-4 flex flex-col justify-between h-full">
                <div>
                    <div className="mb-4">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm text-gray-500">질문 {currentQIndex + 1} / {questions.length}</p>
                                <p className="text-xl font-bold text-slate-800 mt-1">{currentQuestion.question_text}</p>
                            </div>
                            <button onClick={handleToggleBookmark} className="ml-3 p-1 rounded hover:bg-gray-100" aria-label="Wordbook에 추가">
                                <BookmarkIcon className={`w-5 h-5 ${bookmarkedIdx[currentQIndex] ? 'text-blue-600' : 'text-slate-600'}`} />
                            </button>
                        </div>
                    </div>
                    <div className="space-y-3">
                        {currentQuestion.options.map(option => (
                            <button
                                key={option}
                                onClick={() => setSelectedOption(option)}
                                className={`w-full p-4 rounded-lg border-2 text-left text-lg font-semibold transition-colors duration-200 ${
                                    selectedOption === option ? 'bg-blue-100 border-blue-500' : 'bg-white hover:bg-gray-100 border-gray-300'
                                }`}
                            >
                                {option}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="mt-6 space-y-3">
                    <button onClick={() => setIsPassageVisible(true)} className="w-full bg-white text-slate-800 border border-gray-300 font-bold py-3.5 rounded-lg hover:bg-gray-100 transition-colors">
                        지문 보기
                    </button>
                    <button onClick={handleNext} disabled={!selectedOption} className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-lg transition-colors disabled:bg-gray-400">
                        {currentQIndex < questions.length - 1 ? '다음' : '결과 보기'}
                    </button>
                </div>
                {bookmarkToast && (
                    <div className="fixed bg-slate-900 text-white text-xs font-medium px-3 py-2 rounded-lg shadow-md" style={{ top: '75%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                        {bookmarkToast}
                    </div>
                )}
            </div>
        </>
    );
};


const ResultStep: React.FC<{ score: number, total: number, onRetry: () => void, onFinishActivity: () => void }> = ({ score, total, onRetry, onFinishActivity }) => {
    const percentage = total > 0 ? Math.round((score / total) * 100) : 0;

    return (
    <div className="flex flex-col h-full bg-transparent p-6 items-center justify-center text-center">
      <h2 className="text-2xl font-bold text-slate-800 mb-2">활동 완료!</h2>
      <p className="text-lg text-gray-600 mb-6">수고하셨습니다!</p>

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
            <span className="text-5xl font-bold text-slate-800">{score}/{total}</span>
            <span className="text-gray-500 font-medium">정답</span>
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
          onClick={onFinishActivity}
          className="w-full bg-white text-slate-800 border border-gray-300 font-bold py-4 rounded-lg hover:bg-gray-100 transition-colors"
        >
          돌아가기
        </button>
      </div>
    </div>
    );
};


// --- Main View Component ---
const ReadingActivityView: React.FC<ReadingActivityViewProps> = ({ material, classInfo, onFinish, currentUser }) => {
    const [step, setStep] = useState<'passage' | 'mcq' | 'result'>('passage');
    const [answers, setAnswers] = useState<Record<number, string>>({});
    
    const score = useMemo(() => {
        if (!material.mcqs || material.mcqs.length === 0) return 0;
        return Object.entries(answers).reduce((correctCount, [index, answer]) => {
            if (material.mcqs[parseInt(index)].answer === answer) {
                return correctCount + 1;
            }
            return correctCount;
        }, 0);
    }, [answers, material.mcqs]);
    
    useEffect(() => {
        if (step === 'result') {
            saveReadingProgressAndLogActivity(currentUser, material, score, classInfo);
        }
    }, [step, currentUser, material, score, classInfo]);
    
    const handleMcqFinish = (finalAnswers: Record<number, string>) => {
        setAnswers(finalAnswers);
        setStep('result');
    };

    const handleRetry = () => {
        setAnswers({});
        setStep('passage');
    };

    const renderStep = () => {
        switch (step) {
            case 'passage':
                return <PassageStep passage={material.passage} vocab={material.vocabItems} onNext={() => setStep('mcq')} />;
            case 'mcq':
                if (!material.mcqs || material.mcqs.length === 0) {
                    return (
                        <div className="p-4 text-center flex flex-col justify-center items-center h-full">
                            <p className="text-gray-600 mb-4">이 읽기 활동에는 문제가 없습니다.</p>
                            <button 
                                onClick={() => {
                                    setAnswers({});
                                    setStep('result');
                                }} 
                                className="w-full max-w-xs bg-blue-600 text-white font-bold py-3.5 rounded-lg"
                            >
                                완료
                            </button>
                        </div>
                    );
                }
                return <MCQStep questions={material.mcqs} passage={material.passage} onFinish={handleMcqFinish} />;
            case 'result':
                return <ResultStep score={score} total={material.mcqs.length} onRetry={handleRetry} onFinishActivity={onFinish} />;
            default:
                return null;
        }
    };
    
    const stepIndex = ['passage', 'mcq', 'result'].indexOf(step);
    const progressPercentage = stepIndex > -1 ? ((stepIndex + 1) / 3) * 100 : 0;

    return (
        <div className="flex flex-col h-full bg-gray-50">
            <PageIdentifier path="pages/ReadingActivityView.tsx" />
            <header className="flex items-center p-4 pt-4 pb-2 bg-white flex-shrink-0 relative border-b border-gray-200">
                <button onClick={onFinish} className="absolute left-4 p-1 rounded-full hover:bg-gray-200">
                     <div className="w-6 h-6 text-slate-700">
                        <BackIcon />
                    </div>
                </button>
                <div className="text-center w-full">
                    <h1 className="text-lg font-bold text-slate-800 truncate px-12">{material.title}</h1>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                      <div className="bg-blue-600 h-1.5 rounded-full transition-all duration-500" style={{width: `${progressPercentage}%`}}></div>
                    </div>
                </div>
            </header>
            <main className="flex-grow overflow-y-auto">
                {renderStep()}
            </main>
        </div>
    );
};

export default ReadingActivityView;