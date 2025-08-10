import React from 'react';

interface ModifyActivityChoiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (scope: 'single' | 'sequential') => void;
}

const ModifyActivityChoiceModal: React.FC<ModifyActivityChoiceModalProps> = ({ isOpen, onClose, onSelect }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4 animate-fade-in">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
                <div className="p-6">
                    <h2 className="text-lg font-bold text-slate-800 text-center mb-2">반복 일정 수정</h2>
                    <p className="text-sm text-gray-600 text-center mb-6">
                        이 활동의 수정을 어디까지 적용하시겠습니까?
                    </p>
                    <div className="space-y-3">
                        <button
                            onClick={() => onSelect('single')}
                            className="w-full text-left p-4 bg-gray-50 hover:bg-blue-50 border border-gray-200 rounded-lg transition-colors"
                        >
                            <span className="font-semibold text-slate-700">이번 차시만 수정</span>
                            <p className="text-xs text-gray-500 mt-1">이 활동만 개별적으로 수정합니다.</p>
                        </button>
                        <button
                            onClick={() => onSelect('sequential')}
                            className="w-full text-left p-4 bg-gray-50 hover:bg-blue-50 border border-gray-200 rounded-lg transition-colors"
                        >
                            <span className="font-semibold text-slate-700">향후 모든 차시 수정</span>
                            <p className="text-xs text-gray-500 mt-1">이번 차시를 포함한 모든 향후 활동을 순차적으로 수정합니다.</p>
                        </button>
                    </div>
                </div>
                <footer className="px-6 pb-4 flex justify-center">
                    <button
                        onClick={onClose}
                        className="text-sm font-semibold text-gray-600 hover:text-gray-800 py-2 px-4"
                    >
                        취소
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default ModifyActivityChoiceModal;