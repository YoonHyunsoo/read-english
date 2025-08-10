import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { getLeaderboardForInstitution } from '../services/api';
import { CloseIcon, StarIcon } from './icons';

interface LeaderboardModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentUser: User;
}

const LeaderboardModal: React.FC<LeaderboardModalProps> = ({ isOpen, onClose, currentUser }) => {
    const [leaderboard, setLeaderboard] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (isOpen && currentUser.institution) {
            setIsLoading(true);
            getLeaderboardForInstitution(currentUser.institution)
                .then(setLeaderboard)
                .finally(() => setIsLoading(false));
        }
    }, [isOpen, currentUser.institution]);

    if (!isOpen) return null;

    const topFive = leaderboard.slice(0, 5);
    const currentUserRank = leaderboard.findIndex(u => u.email === currentUser.email);
    const isCurrentUserInTopFive = currentUserRank !== -1 && currentUserRank < 5;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4 animate-fade-in">
            <div className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col shadow-xl animate-scale-up">
                <header className="flex items-center justify-between p-4 border-b border-gray-200">
                    <h2 className="text-lg font-bold text-slate-800">기관 내 리더보드</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200">
                        <CloseIcon />
                    </button>
                </header>

                <main className="flex-grow p-4 overflow-y-auto">
                    {isLoading ? (
                        <div className="text-center text-gray-500 py-10">리더보드를 불러오는 중...</div>
                    ) : leaderboard.length === 0 ? (
                        <div className="text-center text-gray-500 py-10">아직 순위가 없습니다.</div>
                    ) : (
                        <div className="space-y-4">
                            <ul className="space-y-2">
                                {topFive.map((user, index) => {
                                    const isCurrentUser = user.email === currentUser.email;
                                    return (
                                        <li key={user.email} className={`flex items-center p-3 rounded-lg border-2 ${isCurrentUser ? 'bg-blue-100 border-blue-500' : 'bg-gray-50 border-gray-200'}`}>
                                            <span className={`w-8 text-center font-bold text-lg ${index < 3 ? 'text-yellow-500' : 'text-gray-500'}`}>
                                                {index + 1}
                                            </span>
                                            <div className="flex-grow">
                                                <p className={`font-semibold ${isCurrentUser ? 'text-blue-800' : 'text-slate-800'}`}>{user.name}</p>
                                                <p className="text-xs text-gray-500">{user.grade}</p>
                                            </div>
                                            <div className="flex items-center gap-1 font-bold text-yellow-500">
                                                <StarIcon className="w-5 h-5" />
                                                <span>{user.stars ?? 0}</span>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>

                            {!isCurrentUserInTopFive && currentUserRank !== -1 && (
                                <div className="pt-4 border-t border-dashed">
                                    <div className="flex items-center p-3 rounded-lg bg-blue-100 border-2 border-blue-500">
                                        <span className="w-8 text-center font-bold text-lg text-gray-500">
                                            {currentUserRank + 1}
                                        </span>
                                        <div className="flex-grow">
                                            <p className="font-semibold text-blue-800">{currentUser.name}</p>
                                            <p className="text-xs text-gray-500">{currentUser.grade}</p>
                                        </div>
                                        <div className="flex items-center gap-1 font-bold text-yellow-500">
                                            <StarIcon className="w-5 h-5" />
                                            <span>{currentUser.stars ?? 0}</span>
                                        </div>
                                    </div>
                                    <p className="text-center text-xs text-gray-500 mt-2">조금만 더 힘내세요!</p>
                                </div>
                            )}
                        </div>
                    )}
                </main>

                <footer className="p-4 border-t border-gray-200 flex justify-end">
                    <button onClick={onClose} className="bg-blue-600 text-white font-bold py-2 px-5 rounded-lg hover:bg-blue-700">
                        닫기
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default LeaderboardModal;
