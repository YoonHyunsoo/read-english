import React from 'react';
import { CloseIcon } from './icons';

interface PassageModalProps {
    isVisible: boolean;
    passage: string;
    onClose: () => void;
}

const PassageModal: React.FC<PassageModalProps> = ({ isVisible, passage, onClose }) => {
    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4 animate-fade-in">
            <div className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col shadow-xl animate-scale-up">
                <header className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
                    <h2 className="text-lg font-bold text-slate-800">지문 다시보기</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200" aria-label="지문 닫기">
                        <CloseIcon />
                    </button>
                </header>
                <main className="flex-grow p-5 overflow-y-auto">
                    <p className="text-base leading-relaxed text-gray-800 whitespace-pre-wrap">{passage}</p>
                </main>
                <footer className="p-4 border-t border-gray-200 flex-shrink-0 flex justify-end">
                    <button onClick={onClose} className="bg-blue-600 text-white font-bold py-2 px-5 rounded-lg hover:bg-blue-700 transition-colors">
                        닫기
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default PassageModal;
