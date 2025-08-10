
import React from 'react';
import { VocabItem } from '../types';
import { CloseIcon } from './icons';

interface VocabPreviewModalProps {
  vocabItems: VocabItem[];
  onClose: () => void;
  onStart: () => void;
  title?: string;
}

const VocabPreviewModal: React.FC<VocabPreviewModalProps> = ({ vocabItems, onClose, onStart, title="오늘의 어휘" }) => {

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4 transition-opacity duration-300">
      <div className="bg-white rounded-2xl w-full max-w-md h-[75vh] max-h-[600px] flex flex-col shadow-xl animate-fade-in-up">
        <header className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-lg font-bold text-slate-800">{title}</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 transition-colors" aria-label="어휘 미리보기 닫기">
            <CloseIcon />
          </button>
        </header>

        <div className="flex-grow p-4 overflow-y-auto">
          <ul className="space-y-4">
            {vocabItems.map((item, index) => (
              item && (
                <li key={item.vocabId || index} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <p className="text-xl font-semibold text-slate-800">
                    {item.word}
                    {item.partofspeech ? (
                      <span className="text-base text-gray-500 font-normal"> ({item.partofspeech})</span>
                    ) : null}
                  </p>
                  <p className="text-md text-gray-700 mt-1">{item.meaningKor}</p>
                   {item.sentence && (
                    <div className="mt-2 pt-2 border-t border-gray-100 text-sm">
                      <p className="text-gray-600">{item.sentence}</p>
                    </div>
                  )}
                </li>
              )
            ))}
          </ul>
        </div>

        <footer className="p-4 border-t border-gray-200 flex-shrink-0">
           <button
             onClick={onStart}
             className="w-full bg-blue-600 text-white font-bold py-3 px-5 rounded-lg hover:bg-blue-700 transition-colors text-base"
           >
             학습 시작
           </button>
        </footer>
      </div>
    </div>
  );
};

export default VocabPreviewModal;
