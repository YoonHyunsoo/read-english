import React from 'react';
import { User } from '../types';
import { getWordbookEntries } from '../utils/wordbook';
import { BackIcon, SpeakerIcon } from '../components/icons';

interface WordbookPageProps {
  currentUser: User;
  onClose?: () => void;
}

const speakWord = (word: string) => {
  try {
    const utter = new SpeechSynthesisUtterance(word);
    utter.lang = 'en-US';
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  } catch {}
};

const WordbookPage: React.FC<WordbookPageProps> = ({ currentUser }) => {
  const entries = getWordbookEntries(currentUser.email);
  return (
    <div className="flex flex-col h-full bg-white">
      <header className="flex items-center p-4 pt-4 pb-2 bg-white flex-shrink-0 relative border-b border-gray-200">
        <button onClick={() => window.dispatchEvent(new CustomEvent('close-wordbook'))} className="absolute left-4 p-1 rounded-full hover:bg-gray-200" aria-label="뒤로가기">
          <div className="w-6 h-6 text-slate-700">
            <BackIcon />
          </div>
        </button>
        <h1 className="text-lg font-bold text-slate-800 text-center w-full">Wordbook</h1>
      </header>
      <div className="flex-1 overflow-y-auto p-4">
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="grid grid-cols-4 bg-gray-50 border-b text-xs font-semibold text-slate-700">
            <div className="p-2">단어</div>
            <div className="p-2">뜻</div>
            <div className="p-2">발음</div>
            <div className="p-2">저장일</div>
          </div>
          {entries.length === 0 ? (
            <div className="p-4 text-center text-gray-500 text-sm">아직 저장된 단어가 없습니다.</div>
          ) : (
            entries.map((e) => (
              <div key={`${e.word}-${e.addedAt}`} className="grid grid-cols-4 border-t text-sm items-center">
                <div className="p-2 font-semibold text-slate-800 truncate">{e.word}</div>
                <div className="p-2 text-slate-700 truncate">{e.meaning || '-'}</div>
                <div className="p-2">
                  <button onClick={() => speakWord(e.word)} className="p-1 rounded hover:bg-gray-100" aria-label="발음 재생">
                    <SpeakerIcon className="w-5 h-5 text-slate-700" />
                  </button>
                </div>
                <div className="p-2 text-gray-500">{new Date(e.addedAt).toLocaleString()}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default WordbookPage;


