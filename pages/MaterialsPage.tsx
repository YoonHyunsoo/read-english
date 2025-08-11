import React, { useState, useMemo, useEffect } from 'react';
import { ActivityType, LeveledQuestion, User, Quiz, ClassInfo, Level, ReadingMaterial, ListeningMaterial } from '../types';
import { getQuizForActivity, getAllMaterialsForType, getReadingMaterialForActivity, getAllReadingMaterials, getAllListeningMaterials, getListeningMaterial, getAllVocabWords, getVocabMaterialPreview } from '../services/api';
import { VocabIcon, ListeningIcon, ReadingIcon, GrammarIcon, CloseIcon } from '../components/icons';
import { getActivityLevelStyles } from '../utils/colorUtils';
import { Input } from '../components/DesignSystem';
import ReadingMaterialDetailModal from '../components/ReadingMaterialDetailModal';
import PageIdentifier from '../components/DevTools/PageIdentifier';


const iconMap: Record<Exclude<ActivityType, 'empty'>, React.ReactNode> = {
  vocab: <VocabIcon />,
  listening: <ListeningIcon />,
  reading: <ReadingIcon />,
  grammar: <GrammarIcon />,
};

const levelDescriptions: Record<number, string> = {
  1: '레벨 1: 초등학교 기초',
  2: '레벨 2: 초등학교 저학년 수준',
  3: '레벨 3: 초등학교 고학년 수준',
  4: '레벨 4: 중학교 1학년 수준',
  5: '레벨 5: 중학교 2학년 수준',
  6: '레벨 6: 중학교 3학년 수준',
  7: '레벨 7: 고등학교 1학년 수준',
  8: '레벨 8: 고등학교 2학년 수준',
  9: '레벨 9: 고등학교 3학년 수준 (수능대비용)',
};

// Modal Component
const QuestionDetailModal: React.FC<{ question: LeveledQuestion; level: number; index: number; onClose: () => void; }> = ({ question, level, index, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4 animate-fade-in">
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

// Main Page Component
interface MaterialsPageProps {
  currentUser: User;
  onStartActivity?: (payload: Quiz | ReadingMaterial | ListeningMaterial, classInfo?: ClassInfo) => void;
}

const MaterialsPage: React.FC<MaterialsPageProps> = ({ currentUser, onStartActivity }) => {
  const [activeType, setActiveType] = useState<Exclude<ActivityType, 'empty'>>('vocab');
  const [showWordDb, setShowWordDb] = useState<boolean>(true);
  const [materials, setMaterials] = useState<any[]>([]); // Can be Level[] or { level: number, units: ReadingMaterial[] }[]
  const [isLoading, setIsLoading] = useState(true);
  
  const [selectedQuestion, setSelectedQuestion] = useState<{ question: LeveledQuestion; level: number; index: number } | null>(null);
  const [selectedReadingMaterial, setSelectedReadingMaterial] = useState<ReadingMaterial | null>(null);
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [openWordIds, setOpenWordIds] = useState<Set<string>>(new Set());
  const [openUnitIds, setOpenUnitIds] = useState<Set<string>>(new Set());
  const [openQuestionIds, setOpenQuestionIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [vocabPreviewBySetId, setVocabPreviewBySetId] = useState<Record<string, { total: number; items: { word: string; type: 1|2|3|4; pos?: string; meaningKor?: string; }[] }>>({});
  const [loadingPreviewIds, setLoadingPreviewIds] = useState<Set<string>>(new Set());

  const toggleWordOpen = (vocabId: string) => {
    setOpenWordIds(prev => {
      const next = new Set(prev);
      if (next.has(vocabId)) next.delete(vocabId); else next.add(vocabId);
      return next;
    });
  };

  const toggleUnitOpen = (unitId: string) => {
    setOpenUnitIds(prev => {
      const next = new Set(prev);
      if (next.has(unitId)) next.delete(unitId); else next.add(unitId);
      return next;
    });
  };

  const toggleQuestionOpen = async (questionId: string, setIdForVocab?: string) => {
    setOpenQuestionIds(prev => {
      const next = new Set(prev);
      if (next.has(questionId)) next.delete(questionId); else next.add(questionId);
      return next;
    });
    if (activeType === 'vocab' && setIdForVocab && !vocabPreviewBySetId[setIdForVocab] && !loadingPreviewIds.has(setIdForVocab)) {
      setLoadingPreviewIds(prev => new Set(prev).add(setIdForVocab));
      try {
        const pv = await getVocabMaterialPreview(setIdForVocab);
        setVocabPreviewBySetId(prev => ({ ...prev, [setIdForVocab]: pv }));
      } finally {
        setLoadingPreviewIds(prev => { const n = new Set(prev); n.delete(setIdForVocab); return n; });
      }
    }
  };

  const renderHighlighted = (text?: string, highlight?: string, caseInsensitive: boolean = false) => {
    if (!text) return null;
    if (!highlight) return <>{text}</>;
    const source = caseInsensitive ? text.toLowerCase() : text;
    const target = caseInsensitive ? highlight.toLowerCase() : highlight;
    const idx = source.indexOf(target);
    if (idx === -1) return <>{text}</>;
    const before = text.slice(0, idx);
    const mid = text.slice(idx, idx + highlight.length);
    const after = text.slice(idx + highlight.length);
    return (<>
      {before}
      <span className="font-bold underline">{mid}</span>
      {after}
    </>);
  };

  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        if (showWordDb) {
            const grouped = await getAllVocabWords();
            setMaterials(grouped);
        } else if (activeType === 'reading') {
            const fetchedUnits = await getAllReadingMaterials();
            const groupedByLevel = new Map<number, ReadingMaterial[]>();
            fetchedUnits.forEach(unit => {
                if (!groupedByLevel.has(unit.level)) {
                    groupedByLevel.set(unit.level, []);
                }
                groupedByLevel.get(unit.level)!.push(unit);
            });
            const materialsByLevel = Array.from(groupedByLevel.entries()).map(([level, units]) => ({ level, units }));
            setMaterials(materialsByLevel);
        } else if (activeType === 'listening') {
             const fetchedUnits = await getAllListeningMaterials();
            const groupedByLevel = new Map<number, ListeningMaterial[]>();
            fetchedUnits.forEach(unit => {
                if (!groupedByLevel.has(unit.level)) {
                    groupedByLevel.set(unit.level, []);
                }
                groupedByLevel.get(unit.level)!.push(unit);
            });
            const materialsByLevel = Array.from(groupedByLevel.entries()).map(([level, units]) => ({ level, units }));
            setMaterials(materialsByLevel);
        } else {
            const fetchedMaterials = await getAllMaterialsForType(activeType);
            setMaterials(fetchedMaterials);
        }
      } catch (e) {
        console.error("Failed to fetch materials", e);
        setMaterials([]);
      } finally {
        setIsLoading(false);
      }
    };

    setIsLoading(true);
    setMaterials([]);
    fetchMaterials();
  }, [activeType, showWordDb]);


  const filteredMaterials = useMemo(() => {
    if (levelFilter === 'all') {
      return materials;
    }
    const numericLevel = parseInt(levelFilter, 10);
    return materials.filter(item => item.level === numericLevel);
  }, [materials, levelFilter]);

  const isSearching = searchQuery.trim().length > 0;

  const wordDbFilteredLevels = useMemo(() => {
    if (!showWordDb) return [] as any[];
    const q = searchQuery.trim().toLowerCase();
    const base = filteredMaterials as any[];
    if (!q) return base;
    const filtered = base
      .map(ld => ({
        ...ld,
        words: (ld.words || []).filter((w: any) => String(w.word || '').toLowerCase().includes(q))
      }))
      .filter(ld => (ld.words || []).length > 0);
    return filtered;
  }, [filteredMaterials, searchQuery, showWordDb]);
  
  const handleStartClick = async (type: Exclude<ActivityType, 'empty'>, level: number) => {
    if (!onStartActivity) return;
    const activity = {
      id: `material-${type}-level-${level}`,
      type,
      level
    };
    try {
        if (type === 'reading') {
            const unit = await getReadingMaterialForActivity(activity);
            onStartActivity(unit, undefined);
        } else if (type === 'listening') {
            const material = await getListeningMaterial(activity);
            onStartActivity(material, undefined);
        } else {
            const quiz = await getQuizForActivity(activity);
            onStartActivity(quiz, undefined);
        }
    } catch (e) {
      console.error(e);
      alert('활동을 시작하지 못했습니다. 다시 시도해 주세요.');
    }
  };

  const activityTypes: Exclude<ActivityType, 'empty'>[] = ['vocab', 'listening', 'reading', 'grammar'];
  const isUnitType = activeType === 'reading' || activeType === 'listening';

  return (
    <div className="h-full flex flex-col">
      <PageIdentifier path="pages/MaterialsPage.tsx" />
      {selectedQuestion && (
        <QuestionDetailModal 
            question={selectedQuestion.question}
            level={selectedQuestion.level}
            index={selectedQuestion.index}
            onClose={() => setSelectedQuestion(null)}
        />
      )}
      {selectedReadingMaterial && (
        <ReadingMaterialDetailModal
          unit={selectedReadingMaterial}
          onClose={() => setSelectedReadingMaterial(null)}
        />
      )}
      <div className="p-4 pb-2 flex-shrink-0">
        <div className="grid grid-cols-5 gap-2">
          {/* Word DB tab (first, gray) */}
          <button
            onClick={() => { setShowWordDb(true); setActiveType('vocab'); }}
            className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${showWordDb ? 'bg-gray-300 border-gray-500' : 'bg-gray-100 border-gray-300 hover:bg-gray-200'}`}
          >
            <div className="w-6 h-6 text-slate-700">W</div>
            <span className={`mt-1 text-xs font-semibold ${showWordDb ? 'text-blue-700' : 'text-slate-600'}`}>Word DB</span>
          </button>
          {activityTypes.map(type => (
            <button
              key={type}
              onClick={() => { setActiveType(type); setShowWordDb(false); }}
              className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${
                !showWordDb && activeType === type ? 'bg-blue-100 border-blue-500' : 'bg-white border-gray-200 hover:bg-gray-50'
              }`}
            >
                <div className="w-6 h-6 text-slate-700">{iconMap[type]}</div>
                <span className={`mt-1 text-xs font-semibold ${(!showWordDb && activeType === type) ? 'text-blue-700' : 'text-slate-600'}`}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                </span>
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pb-2">
        <label htmlFor="level-filter" className="sr-only">레벨별 보기</label>
        <select
          id="level-filter"
          value={levelFilter}
          onChange={(e) => setLevelFilter(e.target.value)}
          className={`w-full p-2 rounded-lg shadow-sm text-sm border-blue-200 bg-blue-100 focus:ring-blue-500 focus:border-blue-500`}
        >
          <option value="all">전체보기</option>
          {Object.entries(levelDescriptions).map(([level, description]) => (
            <option key={level} value={level}>{description}</option>
          ))}
        </select>
      </div>

      {showWordDb && (
        <div className="px-4 pb-2">
          <Input
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="단어, 뜻 또는 예문으로 검색"
          />
        </div>
      )}

      <main className="flex-grow p-4 pt-2 overflow-y-auto">
        {isLoading ? (
            <div className="text-center text-gray-500 py-10">
              <p>자료를 불러오는 중...</p>
            </div>
        ) : (
          <div className="space-y-4">
            {filteredMaterials.length > 0 ? (
                isUnitType ? (
                  (filteredMaterials as { level: number; units: (ReadingMaterial | ListeningMaterial)[] }[]).map(levelData => (
                      <div key={levelData.level}>
                          <h3 className="text-base font-bold text-slate-800 mb-3 flex justify-between items-center">
                              <span>{levelDescriptions[levelData.level] || `Level ${levelData.level}`}</span>
                          </h3>
                          <ul className="space-y-3">
                              {(levelData.units || []).map((unit, index) => {
                                  const itemLevelStyles = getActivityLevelStyles(activeType, levelData.level);
                                  return (
                                      <React.Fragment key={unit.id}>
                                        <li className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
                                          <div className="flex items-center justify-between gap-3">
                                            <button type="button" onClick={() => toggleUnitOpen(unit.id)} className="flex-1 text-left">
                                              <div className="flex items-center gap-3 overflow-hidden">
                                                <span
                                                  className="text-xs font-medium px-3 py-1.5 rounded-lg"
                                                  style={itemLevelStyles}
                                                >
                                                  Lv. {levelData.level}
                                                </span>
                                                <div className="w-5 h-5 text-slate-600 flex-shrink-0">{iconMap[activeType]}</div>
                                                <span className="font-medium text-sm truncate">{`${unit.title || `${activeType} ${index + 1}차시`}`}</span>
                                              </div>
                                            </button>
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                              {currentUser.role === 'individual' && onStartActivity && (
                                                <button
                                                  onClick={(e) => { e.stopPropagation(); onStartActivity(unit, undefined); }}
                                                  className="text-xs font-semibold bg-blue-600 text-white px-4 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
                                                >
                                                  학습
                                                </button>
                                              )}
                                              <span className={`inline-block transition-transform ${openUnitIds.has(unit.id) ? 'rotate-180' : ''}`}>▼</span>
                                            </div>
                                          </div>
                                        </li>
            {openUnitIds.has(unit.id) && (
                                          <li className="mt-2 bg-gray-50 p-3 rounded-xl border border-gray-200 shadow-inner">
                <div className="text-sm text-slate-700 whitespace-pre-wrap">
                  {activeType === 'reading' ? (unit as ReadingMaterial).passage : (unit as ListeningMaterial).script}
                </div>
              </li>
            )}
                                        </React.Fragment>
                                  )
                              })}
                          </ul>
                      </div>
                  ))
                ) : (
                  ((showWordDb ? wordDbFilteredLevels : filteredMaterials) as Level[]).map(levelData => (
                    <div key={levelData.level}>
                      {(!showWordDb || !isSearching) && (
                        <h3 className="text-base font-bold text-slate-800 mb-3 flex justify-between items-center">
                          <span>{levelDescriptions[levelData.level] || `Level ${levelData.level}`}</span>
                          {!showWordDb && currentUser.role === 'individual' && onStartActivity && (
                            <button
                                onClick={() => handleStartClick(activeType, levelData.level)}
                                className="text-xs font-semibold bg-blue-600 text-white px-4 py-1.5 rounded-lg hover:bg-blue-700 transition-colors flex-shrink-0"
                            >
                                이 레벨 학습 시작
                            </button>
                          )}
                        </h3>
                      )}
                      <ul className="space-y-3">
                        {showWordDb ? (
                          // Word DB list view
                          ((levelData as any).words || []).map((w: any) => (
                            <React.Fragment key={w.vocabId}>
                              <li className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
                                <button type="button" onClick={() => toggleWordOpen(w.vocabId)} className="w-full text-left">
                                  <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                      <span className="text-xs font-medium px-3 py-1.5 rounded-lg bg-gray-100 text-slate-700">Lv. {levelData.level}</span>
                                      <span className="font-bold text-slate-800 truncate">{w.word}</span>
                                      <span className="text-xs text-gray-500 flex-shrink-0">({w.partofspeech})</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-right text-sm text-gray-600">
                                      <div>{w.meaningKor}</div>
                                      <span className={`ml-1 inline-block transition-transform ${openWordIds.has(w.vocabId) ? 'rotate-180' : ''}`}>▼</span>
                                    </div>
                                  </div>
                                </button>
                              </li>
                              {openWordIds.has(w.vocabId) && (
                                <li className="mt-2 bg-gray-50 p-3 rounded-xl border border-gray-200 shadow-inner">
                                  <div className="text-sm text-slate-700 space-y-2">
                                    <div>
                                      {renderHighlighted(w.sentence, w.sentenceEngHighlight || w.word, true)}
                                    </div>
                                    <div className="text-gray-600">
                                      {renderHighlighted(w.sentenceKor, w.sentenceKorHighlight || '')}
                                    </div>
                                  </div>
                                </li>
                              )}
                            </React.Fragment>
                          ))
                        ) : (
                        (levelData.questions || []).map((question, index) => {
                          const itemLevelStyles = getActivityLevelStyles(activeType, levelData.level);
                          return (
                            <React.Fragment key={question.id}>
                              <li className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
                                <button type="button" onClick={() => toggleQuestionOpen(`${levelData.level}-${question.id}`, activeType==='vocab' ? String(question.id) : undefined)} className="w-full text-left">
                                  <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                      <span 
                                        className="text-xs font-medium px-3 py-1.5 rounded-lg"
                                        style={itemLevelStyles}
                                      >
                                        Lv. {levelData.level}
                                      </span>
                                      <div className="w-5 h-5 text-slate-600 flex-shrink-0">{iconMap[activeType]}</div>
                                      <span className="font-medium text-sm">{`${activeType.charAt(0).toUpperCase() + activeType.slice(1)} ${index + 1}차시`}</span>
                                    </div>
                                    <span className={`inline-block transition-transform ${openQuestionIds.has(`${levelData.level}-${question.id}`) ? 'rotate-180' : ''}`}>▼</span>
                                  </div>
                                </button>
                              </li>
                            {openQuestionIds.has(`${levelData.level}-${question.id}`) && (
                              <li className="mt-2 bg-gray-50 p-3 rounded-xl border border-gray-200 shadow-inner">
                                {activeType === 'vocab' ? (
                                  <div className="text-sm text-slate-700">
                                    {loadingPreviewIds.has(String(question.id)) && (
                                      <div className="text-gray-500">미리보기 불러오는 중...</div>
                                    )}
                                    {!loadingPreviewIds.has(String(question.id)) && (
                                      <>
                                        <div className="font-semibold mb-2">[총 단어 수 : {vocabPreviewBySetId[String(question.id)]?.total ?? 0}개]</div>
                                        <ul className="space-y-1">
                                          {(vocabPreviewBySetId[String(question.id)]?.items || []).map((it) => {
                                            const typeLabel = (
                                              it.type === 1 ? '한국어 뜻 → Vocab 선택' :
                                              it.type === 2 ? 'Vocab 단어 → 한국어 뜻 선택' :
                                              it.type === 3 ? '영어 예문(빈칸) → Vocab 선택' :
                                              '영어 뜻 → Vocab 선택'
                                            );
                                            return (
                                              <li key={it.word} className="text-slate-800">
                                                - {it.word} : {it.pos ? `(${it.pos}) ` : ''}{it.meaningKor || ''} / ({typeLabel})
                                              </li>
                                            );
                                          })}
                                        </ul>
                                      </>
                                    )}
                                  </div>
                                ) : (
                                  <div className="text-sm text-slate-700">
                                    <div className="font-semibold mb-1">문항</div>
                                    <div className="mb-2">{question.text}</div>
                                    <div className="font-semibold mb-1">보기</div>
                                    <ul className="list-disc pl-5 space-y-1">
                                      {question.options.map((o) => (
                                        <li key={o}>{o}</li>
                                      ))}
                                    </ul>
                                    <div className="mt-2"><span className="font-semibold">정답:</span> {question.answer}</div>
                                  </div>
                                )}
                              </li>
                            )}
                            </React.Fragment>
                          )
                        })
                        )}
                      </ul>
                    </div>
                  ))
                )
            ) : (
              <div className="text-center text-gray-500 py-10">
                <p>표시할 자료가 없습니다.</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default MaterialsPage;