import React, { useState, useEffect } from 'react';
import { StudentStudyLog, User } from '../types';
import { getStudyLogs } from '../services/api';
import PageIdentifier from '../components/DevTools/PageIdentifier';


interface ProgressPageProps {
    currentUser: User;
}

const ProgressPage: React.FC<ProgressPageProps> = ({ currentUser }) => {
    const [progress, setProgress] = useState<StudentStudyLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchProgress = async () => {
            setIsLoading(true);
            try {
                const allProgress = await getStudyLogs();
                const userProgress = allProgress
                    .filter(p => p.user_email === currentUser.email)
                    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
                setProgress(userProgress);
            } catch (error) {
                console.error("Failed to load progress:", error);
                setProgress([]);
            } finally {
                setIsLoading(false);
            }
        };
        fetchProgress();

        window.addEventListener('activity-completed', fetchProgress);
        return () => window.removeEventListener('activity-completed', fetchProgress);
    }, [currentUser.email]);

    const totalQuizzes = progress.length;
    const totalScore = progress.reduce((sum, record) => sum + (record.score || 0), 0);
    const totalQuestions = progress.reduce((sum, record) => sum + (record.total_questions || 0), 0);
    const averageScore = totalQuizzes > 0 && totalQuestions > 0 ? Math.round((totalScore / totalQuestions) * 100) : 0;

    return (
        <div className="h-full flex flex-col">
            <PageIdentifier path="pages/ProgressPage.tsx" />
            <main className="flex-grow p-4 pt-4 overflow-y-auto">
                {isLoading ? (
                    <div className="text-center text-gray-500">진행 상황을 불러오는 중...</div>
                ) : totalQuizzes === 0 ? (
                    <div className="text-center text-gray-500 py-10">
                        <p className="font-semibold">아직 진행 상황이 없습니다!</p>
                        <p className="mt-2 text-sm">'수업' 또는 '복습' 탭에서 퀴즈를 완료하여 여기에서 진행 상황을 확인하세요.</p>
                    </div>
                ) : (
                    <>
                        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6">
                            <h2 className="text-base font-bold text-center mb-4 text-slate-800">요약</h2>
                            <div className="flex justify-around text-center">
                                <div>
                                    <p className="text-2xl font-bold text-slate-800">{totalQuizzes}</p>
                                    <p className="text-sm text-gray-500">응시한 활동</p>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-slate-800">{averageScore}%</p>
                                    <p className="text-sm text-gray-500">평균 점수</p>
                                </div>
                            </div>
                        </div>

                        <h2 className="text-base font-bold text-slate-800 mb-3">기록</h2>
                        <div className="space-y-3">
                            {progress.map((record, index) => (
                                <div key={record.id || index} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex justify-between items-center">
                                    <div>
                                        <p className="font-bold text-slate-800">{record.activity_title}</p>
                                        <p className="text-sm text-gray-500">{new Date(record.timestamp).toLocaleDateString()}</p>
                                    </div>
                                    <div className="text-lg font-bold text-slate-800">
                                        {record.score}/{record.total_questions}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </main>
        </div>
    );
};

export default ProgressPage;