import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { getCompletionStatusForActivity } from '../services/api';
import { CloseIcon } from './icons';

interface ActivityStatusModalProps {
    isOpen: boolean;
    onClose: () => void;
    activityId: string;
    activityTitle: string;
    classId: string;
}

interface StudentStatus {
    student: User;
    completed: boolean;
}

const ActivityStatusModal: React.FC<ActivityStatusModalProps> = ({ isOpen, onClose, activityId, activityTitle, classId }) => {
    const [statusList, setStatusList] = useState<StudentStatus[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            setIsLoading(true);
            getCompletionStatusForActivity(activityId, classId)
                .then(setStatusList)
                .catch(err => {
                    console.error("Failed to get activity status", err);
                    setStatusList([]);
                })
                .finally(() => setIsLoading(false));
        }
    }, [isOpen, activityId, classId]);

    if (!isOpen) return null;

    const completedCount = statusList.filter(s => s.completed).length;
    const totalStudents = statusList.length;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4 animate-fade-in">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[80vh] flex flex-col">
                <header className="flex items-center justify-between p-4 border-b border-gray-200">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">학습 현황</h2>
                        <p className="text-sm text-gray-500">{activityTitle}</p>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200"><CloseIcon /></button>
                </header>

                <div className="p-4 overflow-y-auto">
                    {isLoading ? (
                        <p className="text-center text-gray-500 py-6">학생 현황을 불러오는 중...</p>
                    ) : totalStudents > 0 ? (
                        <>
                            <div className="mb-4 text-center font-semibold text-slate-700">
                                완료 현황: {completedCount} / {totalStudents} 명
                            </div>
                            <ul className="space-y-2">
                                {statusList.map(({ student, completed }) => (
                                    <li key={student.email} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <p className="font-semibold">{student.name}</p>
                                        {completed ? (
                                            <span className="text-xs font-bold text-green-700 bg-green-200 px-2 py-1 rounded-full">완료</span>
                                        ) : (
                                            <span className="text-xs font-bold text-red-700 bg-red-100 px-2 py-1 rounded-full">미완료</span>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </>
                    ) : (
                        <p className="text-center text-gray-500 py-6">클래스에 배정된 학생이 없습니다.</p>
                    )}
                </div>

                <footer className="p-4 flex justify-end gap-3 bg-gray-50 rounded-b-xl">
                    <button onClick={onClose} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700">닫기</button>
                </footer>
            </div>
        </div>
    );
};

export default ActivityStatusModal;