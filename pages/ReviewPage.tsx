import React, { useState, useEffect, useCallback } from 'react';
import { Quiz, User, VocabItem } from '../types';
import { getSelfStudyVocabSet, authenticateUser, getLeaderboardForInstitution } from '../services/api';
import QuizView from '../components/QuizView';
import { StarIcon } from '../components/icons';
import VocabPreviewModal from '../components/VocabPreviewModal';
import PageIdentifier from '../components/DevTools/PageIdentifier';
import { Card, Button } from '../components/DesignSystem';

interface ReviewPageProps {
    currentUser: User;
}

const ReviewPage: React.FC<ReviewPageProps> = ({ currentUser }) => {
    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [vocabToPreview, setVocabToPreview] = useState<VocabItem[] | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [localUser, setLocalUser] = useState<User>(currentUser);
    const [leaderboard, setLeaderboard] = useState<User[]>([]);
    const topThree = leaderboard.slice(0, 3);

    const startNewSelfStudySession = useCallback(async () => {
        setIsLoading(true);
        setMessage('');
        setQuiz(null);
        setVocabToPreview(null);
        
        const user = await authenticateUser(currentUser.email);
        if (!user) {
            setMessage('사용자 정보를 불러올 수 없습니다.'); setIsLoading(false); return;
        }
        setLocalUser(user);

        if (typeof user.vocabLevel === 'undefined') {
            setMessage('자율학습 레벨이 배정되지 않았습니다. 선생님께 문의하세요.'); setIsLoading(false); return;
        }

        const vocabSet = await getSelfStudyVocabSet(user);
        if (vocabSet && vocabSet.length > 0) {
            setVocabToPreview(vocabSet);
        } else {
            setMessage(`레벨 ${user.vocabLevel}에 대한 학습 자료를 찾을 수 없습니다.`);
        }
        setIsLoading(false);
    }, [currentUser.email]);

    // Load leaderboard for the user's institution (student only)
    useEffect(() => {
        const loadLeaderboard = async () => {
            if (currentUser.role === 'student' && currentUser.institution) {
                const lb = await getLeaderboardForInstitution(currentUser.institution);
                setLeaderboard(lb);
            } else {
                setLeaderboard([]);
            }
        };
        loadLeaderboard();
    }, [currentUser.role, currentUser.institution]);

    // Persist current user email for Wordbook usage in reading flow (simple bridge)
    useEffect(() => {
        if (currentUser?.email) {
            try { localStorage.setItem('currentUserEmail', currentUser.email); } catch {}
        }
    }, [currentUser?.email]);
    
    const handleStartQuiz = (vocabItems: VocabItem[]) => {
        const quizQuestions = vocabItems.map(item => {
            const allWordsInLevel = vocabItems.map(v => v.word);
            const distractors = allWordsInLevel
                .filter(w => w !== item.word)
                .sort(() => 0.5 - Math.random())
                .slice(0, 3);
            
            const options = new Set([item.word, ...distractors]);
            
            // Add dummy options if not enough distractors are available
            const dummyOptions = ["Apple", "Book", "Car", "Desk", "Run", "Study"];
            let i = 0;
            while(options.size < 4 && i < dummyOptions.length) {
                if (!options.has(dummyOptions[i])) {
                    options.add(dummyOptions[i]);
                }
                i++;
            }
            
            const finalOptions = Array.from(options).sort(() => 0.5 - Math.random());
            
            return {
                word: item.meaningKor,
                options: finalOptions,
                correctAnswer: item.word
            };
        });

        const newQuiz: Quiz = {
            activityId: `self-study-vocab-level-${localUser.vocabLevel}-${Date.now()}`,
            title: `레벨업 어휘 - Level ${localUser.vocabLevel}`,
            activityType: 'vocab',
            questions: quizQuestions
        };
        setQuiz(newQuiz);
        setVocabToPreview(null);
    };

    const handleQuizFinish = async () => {
        setQuiz(null);
        setIsLoading(true);
        // Fetch updated user data to show new star count
        const updatedUser = await authenticateUser(currentUser.email);
        if (updatedUser) {
            setLocalUser(updatedUser);
        }
        // Start the next session
        await startNewSelfStudySession();
    };
    
    if (vocabToPreview) {
        return (
          <VocabPreviewModal
            vocabItems={vocabToPreview}
            onClose={() => setVocabToPreview(null)}
            onStart={() => handleStartQuiz(vocabToPreview)}
            title="레벨업 어휘"
          />
        );
    }

    if (quiz) {
        return <QuizView quiz={quiz} onBack={handleQuizFinish} currentUser={currentUser} />;
    }

    return (
        <div className="h-full flex flex-col p-4 gap-4">
            <PageIdentifier path="pages/ReviewPage.tsx" />

            {/* 상단 1/3: 리더보드 (좌: My Stars, 우: Top 3) */}
            <div className="w-full" style={{ minHeight: '200px', maxHeight: '240px' }}>
                <Card className="h-full">
                    <div className="grid grid-cols-3 gap-4 h-full">
                        {/* 왼쪽: My Stars */}
                        <div className="col-span-1 flex flex-col items-center justify-center">
                            <p className="text-base font-bold text-slate-800">My Stars</p>
                            <div className="mt-2 flex items-center gap-2 text-yellow-500">
                                <StarIcon className="w-10 h-10" />
                                <span className="text-3xl font-extrabold">{localUser.stars ?? 0}</span>
                            </div>
                            <p className="mt-2 text-xs text-gray-500">{localUser.name} · {localUser.grade || '-'}</p>
                        </div>

                        {/* 오른쪽: Top 3 leaderboard */}
                        <div className="col-span-2 flex flex-col">
                            <p className="text-base font-bold text-slate-800 mb-2">LEADERBOARD</p>
                            <ul className="space-y-2">
                                {[0,1,2].map((idx) => {
                                    const user = topThree[idx];
                                    if (!user) {
                                        return (
                                            <li key={`placeholder-${idx}`} className="flex items-center p-1.5 rounded-lg border bg-gray-50 border-gray-200 opacity-70">
                                                <span className="w-6 text-center font-bold text-gray-400">{idx + 1}</span>
                                                <div className="flex-grow">
                                                    <div className="flex items-center gap-2 overflow-hidden">
                                                        <span className="text-sm font-semibold text-slate-400 truncate">-</span>
                                                        <span className="text-[11px] text-gray-400 flex-shrink-0">-</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1 text-gray-400 font-bold">
                                                    <StarIcon className="w-3 h-3" />
                                                    <span className="text-xs">0</span>
                                                </div>
                                            </li>
                                        );
                                    }
                                    const isMe = user.email === localUser.email;
                                    return (
                                        <li key={user.email} className={`flex items-center p-1.5 rounded-lg border ${isMe ? 'bg-blue-100 border-blue-400' : 'bg-gray-50 border-gray-200'}`}>
                                            <span className={`w-6 text-center font-bold ${idx < 3 ? 'text-yellow-500' : 'text-gray-500'}`}>{idx + 1}</span>
                                            <div className="flex-grow">
                                                <div className="flex items-center gap-2 overflow-hidden">
                                                    <span className={`text-sm font-semibold ${isMe ? 'text-blue-800' : 'text-slate-800'} truncate`}>{user.name}</span>
                                                    <span className="text-[11px] text-gray-500 flex-shrink-0">{user.grade || '-'}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1 text-yellow-500 font-bold">
                                                <StarIcon className="w-3 h-3" />
                                                <span className="text-xs">{user.stars ?? 0}</span>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                            {/* Top3 메시지 */}
                            <div className="mt-1">
                                {(() => {
                                    const rank = leaderboard.findIndex(u => u.email === localUser.email);
                                    const inTop3 = rank !== -1 && rank < 3;
                                    return (
                                        <p className="text-[11px] text-gray-500">
                                            {inTop3 ? '잘했어요! Keep up the good work!' : '조금만 더 해봐요! You can do it!'}
                                        </p>
                                    );
                                })()}
                            </div>
                        </div>
                    </div>
                </Card>
            </div>

            {/* 중간 영역: 안내/메시지 */}
            {message && (
                <Card className="p-4">
                    <p className="text-sm text-red-600 text-center">{message}</p>
                </Card>
            )}

            {/* 하단 버튼: Wordbook 이동 + 레벨업 시작 */}
            {currentUser.role === 'student' && (
                <div className="mt-auto">
                    <div className="grid grid-cols-2 gap-2">
                        <Button
                            variant="secondary"
                            size="lg"
                            onClick={() => window.dispatchEvent(new CustomEvent('navigate-to-wordbook'))}
                            className="w-full"
                        >
                            Wordbook
                        </Button>
                        <Button
                            variant="primary"
                            size="lg"
                            onClick={startNewSelfStudySession}
                            className="w-full"
                            disabled={isLoading}
                        >
                            레벨업
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReviewPage;