import React from 'react';
import { LeveledQuestion } from '../types';
import { CloseIcon } from './icons';

interface QuestionDetailModalProps {
    question?: LeveledQuestion;
    level?: number;
    index?: number;
    onClose: () => void;
}

const QuestionDetailModal: React.FC<QuestionDetailModalProps> = ({ question, level, index, onClose }) => {
    if (!question || typeof level === 'undefined' || typeof index === 'undefined') return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-[60] p-4 animate-fade-in">
            <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] flex flex-col shadow-xl animate-scale-up">
                <header className="flex items-center justify-between p-4 border-b border-gray-200">
                    <h2 className="text-lg font-bold text-slate-800">{`Level ${level} - Q${index + 1}`}</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200"><CloseIcon /></button>
                </header>
                <div className="p-5 overflow-y-auto">
                    <p className="font-semibold text-slate-800 mb-4">{question.text}</p>
                    <ul className="space-y-2">
                        {question.options.map((option, optIndex) => (
                            <li key={optIndex} className={`p-3 rounded-lg border-2 text-sm ${
                                option === question.answer
                                ? 'bg-green-100 border-green-500 font-bold text-green-800'
                                : 'bg-gray-50 border-gray-200'
                            }`}>
                                {option}
                            </li>
                        ))}
                    </ul>
                </div>
                <footer className="p-4 border-t border-gray-200 flex justify-end">
                  <button onClick={onClose} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">닫기</button>
                </footer>
            </div>
        </div>
    );
};

export default QuestionDetailModal;