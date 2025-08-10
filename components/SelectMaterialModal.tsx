import React, { useState, useEffect } from 'react';
import { ActivityType, LeveledQuestion } from '../types';
import { getMaterialQuestions, getUsedQuestionIdsForClass } from '../services/api';
import { CloseIcon } from './icons';
import QuestionDetailModal from './QuestionDetailModal';

interface SelectMaterialModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (questionId: string) => void;
    classId: string;
    activityType: ActivityType;
    level: number;
    currentQuestionId?: string;
}

const SelectMaterialModal: React.FC<SelectMaterialModalProps> = ({
    isOpen,
    onClose,
    onSelect,
    classId,
    activityType,
    level,
    currentQuestionId,
}) => {
    const [questions, setQuestions] = useState<LeveledQuestion[]>([]);
    const [usedQuestionIds, setUsedQuestionIds] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(true);
    const [viewingQuestion, setViewingQuestion] = useState<{ question: LeveledQuestion, index: number } | null>(null);

    useEffect(() => {
        if (isOpen) {
            setIsLoading(true);
            Promise.all([
                getMaterialQuestions(activityType, level),
                Promise.resolve(getUsedQuestionIdsForClass(classId)),
            ]).then(([allQuestions, usedIds]) => {
                setQuestions(allQuestions);
                setUsedQuestionIds(usedIds);
            }).catch(err => {
                console.error("Failed to load materials for selection", err);
            }).finally(() => {
                setIsLoading(false);
            });
        }
    }, [isOpen, activityType, level, classId]);

    if (!isOpen) return null;

    const handleSelect = (questionId: string) => {
        onSelect(questionId);
    };

    return (
        <>
            {viewingQuestion && (
                <QuestionDetailModal
                    question={viewingQuestion.question}
                    level={level}
                    index={viewingQuestion.index}
                    onClose={() => setViewingQuestion(null)}
                />
            )}
            <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4 animate-fade-in">
                <div className="bg-white rounded-xl shadow-xl w-full max-w-lg h-[90vh] flex flex-col">
                    <header className="flex items-center justify-between p-4 border-b border-gray-200">
                        <h2 className="text-lg font-bold text-slate-800">{`${activityType.charAt(0).toUpperCase() + activityType.slice(1)} - Level ${level} 자료 선택`}</h2>
                        <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200"><CloseIcon /></button>
                    </header>

                    <div className="flex-grow p-4 overflow-y-auto">
                        {isLoading ? (
                            <div className="text-center text-gray-500 py-10">자료를 불러오는 중...</div>
                        ) : (
                            <ul className="space-y-2">
                                {questions.map((q, index) => {
                                    const isUsed = usedQuestionIds.has(q.id) && q.id !== currentQuestionId;
                                    const isCurrent = q.id === currentQuestionId;
                                    
                                    let itemClasses = "flex items-center justify-between p-3 rounded-lg border transition-colors";
                                    if (isUsed) {
                                        itemClasses += " bg-gray-200 opacity-60";
                                    } else if (isCurrent) {
                                        itemClasses += " bg-blue-100 border-blue-300";
                                    } else {
                                        itemClasses += " bg-white hover:bg-gray-50";
                                    }

                                    return (
                                        <li
                                            key={q.id}
                                            className={itemClasses}
                                        >
                                            <span className={`text-sm font-medium ${isUsed ? 'text-gray-500' : 'text-slate-800'}`}>
                                                {q.text}
                                            </span>
                                            <div className="flex-shrink-0 ml-4 flex items-center gap-2">
                                                <button
                                                    onClick={() => setViewingQuestion({ question: q, index })}
                                                    className="text-xs font-semibold bg-gray-200 text-gray-800 px-3 py-1.5 rounded-md hover:bg-gray-300"
                                                >
                                                    보기
                                                </button>
                                                <button
                                                    onClick={() => handleSelect(q.id)}
                                                    disabled={isUsed}
                                                    className="text-xs font-semibold bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                                >
                                                    {isUsed ? '사용중' : '선택'}
                                                </button>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>

                    <footer className="p-4 flex justify-end gap-3 bg-gray-50 rounded-b-xl">
                        <button onClick={onClose} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-300">취소</button>
                    </footer>
                </div>
            </div>
        </>
    );
};

export default SelectMaterialModal;
