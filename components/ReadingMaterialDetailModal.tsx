import React from 'react';
import { ReadingMaterial } from '../types';
import { CloseIcon } from './icons';

interface ReadingMaterialDetailModalProps {
    unit: ReadingMaterial;
    onClose: () => void;
}

const ReadingMaterialDetailModal: React.FC<ReadingMaterialDetailModalProps> = ({ unit, onClose }) => {

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4 animate-fade-in">
            <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] flex flex-col shadow-xl animate-scale-up">
                <header className="flex items-center justify-between p-4 border-b border-gray-200">
                    <h2 className="text-lg font-bold text-slate-800">{unit.title}</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200"><CloseIcon /></button>
                </header>
                <div className="p-5 overflow-y-auto space-y-6">
                    {/* Vocabulary Section */}
                    {unit.vocabItems && unit.vocabItems.length > 0 && (
                        <div>
                            <h3 className="font-bold text-md text-slate-700 mb-2">주요 어휘</h3>
                            <ul className="space-y-3">
                                {unit.vocabItems.map(v => (
                                    <li key={v.vocabId} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                                        <p className="font-bold text-sm text-slate-800">{v.word} <span className="font-normal text-gray-500">({v.partofspeech})</span></p>
                                        <p className="text-xs text-gray-700 mt-1">{v.meaningEng} ({v.meaningKor})</p>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    
                    {/* Passage Section */}
                    {unit.passage && (
                         <div>
                            <h3 className="font-bold text-md text-slate-700 mb-2">지문</h3>
                            <p className="text-sm leading-relaxed text-gray-800 bg-gray-50 p-3 rounded-lg border border-gray-200">{unit.passage}</p>
                        </div>
                    )}

                    {/* Questions Section */}
                    {unit.mcqs && unit.mcqs.length > 0 && (
                        <div>
                             <h3 className="font-bold text-md text-slate-700 mb-2">연습 문제</h3>
                             <ul className="space-y-3">
                                {unit.mcqs.map((q, index) => (
                                     <li key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                                        <p className="font-semibold text-sm text-slate-800 mb-2">{index + 1}. {q.question_text}</p>
                                        <ul className="space-y-1 pl-2">
                                            {q.options.map(opt => (
                                                <li key={opt} className={`text-xs ${opt === q.answer ? 'font-bold text-green-700' : 'text-gray-600'}`}>
                                                    - {opt} {opt === q.answer && ' (정답)'}
                                                </li>
                                            ))}
                                        </ul>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
                <footer className="p-4 border-t border-gray-200 flex justify-end">
                  <button onClick={onClose} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">닫기</button>
                </footer>
            </div>
        </div>
    );
};

export default ReadingMaterialDetailModal;
