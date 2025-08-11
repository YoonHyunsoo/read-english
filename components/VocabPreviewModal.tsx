
import React, { useMemo, useState, useCallback } from 'react';
import { VocabItem } from '../types';
import { CloseIcon } from './icons';

interface VocabPreviewModalProps {
  vocabItems: VocabItem[];
  onClose: () => void;
  onStart: () => void;
  title?: string;
}

const VocabPreviewModal: React.FC<VocabPreviewModalProps> = ({ vocabItems, onClose, onStart, title="오늘의 어휘" }) => {
  const safeItems = useMemo(() => (vocabItems || []).filter(Boolean), [vocabItems]);
  // Precompute speech voices once
  const selectVoice = useCallback((): SpeechSynthesisVoice | null => {
    try {
      const voices = window.speechSynthesis.getVoices();
      // Prefer high-quality US voices if available
      const preferred = ['Google US English', 'Microsoft Aria Online (Natural) - English (United States)', 'Samantha'];
      for (const name of preferred) {
        const v = voices.find((vv) => vv.name.includes(name));
        if (v) return v;
      }
      // Fallback: first en-* voice
      return voices.find((v) => v.lang?.toLowerCase().startsWith('en')) || null;
    } catch { return null; }
  }, []);

  const speak = useCallback((text: string) => {
    try {
      if (!text) return;
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = 'en-US';
      utter.rate = 0.8; // slower for learners
      const voice = selectVoice();
      if (voice) utter.voice = voice;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utter);
    } catch {}
  }, [selectVoice]);
  const [index, setIndex] = useState(0);
  const [showMeaning, setShowMeaning] = useState(false);
  const [showSentenceMeaning, setShowSentenceMeaning] = useState(false);

  const total = safeItems.length;
  const current = safeItems[Math.min(index, Math.max(0, total - 1))];

  const goPrev = useCallback(() => {
    setIndex((i) => Math.max(0, i - 1));
    setShowMeaning(false);
    setShowSentenceMeaning(false);
  }, []);

  const goNext = useCallback(() => {
    setIndex((i) => Math.min(total - 1, i + 1));
    setShowMeaning(false);
    setShowSentenceMeaning(false);
  }, [total]);

  const canPrev = index > 0;
  const canNext = index < total - 1;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4 transition-opacity duration-300">
      <div className="bg-white rounded-2xl w-full max-w-md h-[75vh] max-h-[600px] flex flex-col shadow-xl animate-fade-in-up">
        <header className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-lg font-bold text-slate-800">{title}</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 transition-colors" aria-label="어휘 미리보기 닫기">
            <CloseIcon />
          </button>
        </header>

        <div className="flex-grow p-4 pb-2 flex flex-col">
          {/* Progress with edge-aligned nav */}
          <div className="flex items-center justify-between mb-3 w-full">
            <button
              type="button"
              onClick={goPrev}
              disabled={!canPrev}
              className={`ml-1 w-12 h-12 flex items-center justify-center rounded-full text-2xl ${canPrev ? 'bg-slate-700 hover:bg-slate-800 text-white' : 'bg-gray-400 text-white opacity-60 cursor-not-allowed'}`}
              aria-label="이전 단어"
            >
              ‹
            </button>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-800">{index + 1} / {total}</span>
              <div className="flex items-center gap-1">
                {safeItems.map((_, i) => (
                  <span key={i} className={`h-1.5 rounded-full ${i === index ? 'w-6 bg-blue-600' : 'w-2 bg-gray-300'}`} />
                ))}
              </div>
            </div>
            <button
              type="button"
              onClick={goNext}
              disabled={!canNext}
              className={`mr-1 w-12 h-12 flex items-center justify-center rounded-full text-2xl ${canNext ? 'bg-slate-700 hover:bg-slate-800 text-white' : 'bg-gray-400 text-white opacity-60 cursor-not-allowed'}`}
              aria-label="다음 단어"
            >
              ›
            </button>
          </div>

          {/* Card */}
          <div className="relative flex-1 min-h-[480px] flex items-center justify-center select-none">
            {current ? (
              <div className="w-full max-w-md min-h-[440px]">
                {/* Box 1: 단어 + 뜻 */}
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <p className="text-3xl font-extrabold text-slate-800 tracking-wide">{current.word}</p>
                    {current.partofspeech && (
                      <p className="text-sm text-gray-500">{current.partofspeech}</p>
                    )}
                    {title?.includes('레벨업') && (
                      <button
                        type="button"
                        onClick={() => speak(current.word)}
                        className="ml-1 p-1.5 rounded-full hover:bg-gray-200"
                        aria-label="발음 듣기"
                      >
                        <span className="inline-block w-5 h-5">🔊</span>
                      </button>
                    )}
                  </div>

                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={() => setShowMeaning((v) => !v)}
                      className="w-full py-3 rounded-lg border border-gray-300 bg-white text-slate-700 hover:bg-gray-100 transition-colors text-sm font-medium"
                    >
                      {showMeaning ? (
                        <span className="block text-xl font-semibold text-slate-800">{current.meaningKor}</span>
                      ) : (
                        <span>탭하여 뜻 보기</span>
                      )}
                    </button>
                  </div>
                </div>

                {/* Box 2: 예문 + 번역 */}
                {current.sentence && (
                  <div className="mt-4 bg-gray-50 border border-gray-200 rounded-xl p-6 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <p className="text-lg md:text-xl text-gray-700">
                        {(() => {
                          const s = current.sentence || '';
                          const highlight = current.sentenceEngHighlight || current.word || '';
                          const i = s.toLowerCase().indexOf(highlight.toLowerCase());
                          if (!highlight || i === -1) return s;
                          return (
                            <>
                              {s.slice(0, i)}
                              <span className="font-bold underline">{s.slice(i, i + highlight.length)}</span>
                              {s.slice(i + highlight.length)}
                            </>
                          );
                        })()}
                      </p>
                      {title?.includes('레벨업') && (
                        <button
                          type="button"
                          onClick={() => speak(current.sentence || '')}
                          className="ml-1 p-1.5 rounded-full hover:bg-gray-200"
                          aria-label="예문 발음 듣기"
                        >
                          <span className="inline-block w-5 h-5">🔊</span>
                        </button>
                      )}
                    </div>

                    <div className="mt-3">
                      <button
                        type="button"
                        onClick={() => setShowSentenceMeaning((v) => !v)}
                        className="w-full py-2.5 rounded-lg border border-gray-300 bg-white text-slate-700 hover:bg-gray-100 transition-colors text-sm font-medium"
                      >
                        {showSentenceMeaning ? (
                          <span className="block text-base md:text-lg text-slate-800">
                            {current.sentenceKor ? (
                              <>
                                {current.sentenceKorHighlight
                                  ? (
                                    <>
                                      {current.sentenceKor.split(current.sentenceKorHighlight)[0]}
                                      <span className="font-bold underline">{current.sentenceKorHighlight}</span>
                                      {current.sentenceKor.split(current.sentenceKorHighlight)[1]}
                                    </>
                                  ) : current.sentenceKor}
                              </>
                            ) : (
                              <span className="text-gray-600">예문 해석은 준비 중입니다.</span>
                            )}
                          </span>
                        ) : (
                          <span>탭하여 뜻 보기</span>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-gray-500">표시할 어휘가 없습니다.</div>
            )}

            {/* Side arrows removed; navigation moved to progress bar */}
          </div>
        </div>

        <footer className="p-4 border-t border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-100 text-slate-800 font-semibold py-3 px-5 rounded-lg hover:bg-gray-200 transition-colors text-base"
            >
              닫기
            </button>
            <button
              onClick={onStart}
              disabled={total === 0 || index < total - 1}
              className={`flex-1 font-bold py-3 px-5 rounded-lg transition-colors text-base ${
                (total === 0 || index < total - 1)
                  ? 'bg-gray-300 text-white cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              학습 시작
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default VocabPreviewModal;
