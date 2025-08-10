import React, { useState, useMemo, useEffect } from 'react';
import { ActivityType, LeveledQuestion, User, Quiz, ClassInfo, Level, ReadingMaterial, ListeningMaterial } from '../types';
import { getQuizForActivity, getAllMaterialsForType, getReadingMaterialForActivity, getAllReadingMaterials, getAllListeningMaterials, getListeningMaterial } from '../services/api';
import { VocabIcon, ListeningIcon, ReadingIcon, GrammarIcon, CloseIcon } from '../components/icons';
import { getActivityLevelStyles } from '../utils/colorUtils';
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
  const [materials, setMaterials] = useState<any[]>([]); // Can be Level[] or { level: number, units: ReadingMaterial[] }[]
  const [isLoading, setIsLoading] = useState(true);
  
  const [selectedQuestion, setSelectedQuestion] = useState<{ question: LeveledQuestion; level: number; index: number } | null>(null);
  const [selectedReadingMaterial, setSelectedReadingMaterial] = useState<ReadingMaterial | null>(null);
  const [levelFilter, setLevelFilter] = useState<string>('all');

  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        if (activeType === 'reading') {
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
  }, [activeType]);


  const filteredMaterials = useMemo(() => {
    if (levelFilter === 'all') {
      return materials;
    }
    const numericLevel = parseInt(levelFilter, 10);
    return materials.filter(item => item.level === numericLevel);
  }, [materials, levelFilter]);
  
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
        <div className="grid grid-cols-4 gap-2">
          {activityTypes.map(type => (
            <button
              key={type}
              onClick={() => setActiveType(type)}
              className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${
                activeType === type ? 'bg-blue-100 border-blue-500' : 'bg-white border-gray-200 hover:bg-gray-50'
              }`}
            >
                <div className="w-6 h-6 text-slate-700">{iconMap[type]}</div>
                <span className={`mt-1 text-xs font-semibold ${activeType === type ? 'text-blue-700' : 'text-slate-600'}`}>
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
          className="w-full p-2 border border-blue-200 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-blue-100 text-sm"
        >
          <option value="all">전체보기</option>
          {Object.entries(levelDescriptions).map(([level, description]) => (
            <option key={level} value={level}>{description}</option>
          ))}
        </select>
      </div>

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
                                      <li key={unit.id} className="flex justify-between items-center bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
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
                                          <div className="flex items-center gap-2 flex-shrink-0">
                                            <button
                                                onClick={() => setSelectedReadingMaterial(unit as ReadingMaterial)}
                                                className="text-xs font-semibold bg-gray-200 text-gray-800 px-4 py-1.5 rounded-md hover:bg-gray-300 transition-colors"
                                            >
                                                보기
                                            </button>
                                            {currentUser.role === 'individual' && onStartActivity && (
                                                <button
                                                    onClick={() => onStartActivity(unit, undefined)}
                                                    className="text-xs font-semibold bg-blue-600 text-white px-4 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
                                                >
                                                    학습
                                                </button>
                                            )}
                                          </div>
                                      </li>
                                  )
                              })}
                          </ul>
                      </div>
                  ))
              ) : (
                  (filteredMaterials as Level[]).map(levelData => (
                    <div key={levelData.level}>
                      <h3 className="text-base font-bold text-slate-800 mb-3 flex justify-between items-center">
                        <span>{levelDescriptions[levelData.level] || `Level ${levelData.level}`}</span>
                        {currentUser.role === 'individual' && onStartActivity && (
                          <button
                              onClick={() => handleStartClick(activeType, levelData.level)}
                              className="text-xs font-semibold bg-blue-600 text-white px-4 py-1.5 rounded-lg hover:bg-blue-700 transition-colors flex-shrink-0"
                          >
                              이 레벨 학습 시작
                          </button>
                        )}
                      </h3>
                      <ul className="space-y-3">
                        {(levelData.questions || []).map((question, index) => {
                          const itemLevelStyles = getActivityLevelStyles(activeType, levelData.level);
                          return (
                            <li key={question.id} className="flex justify-between items-center bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
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
                              <button 
                                  onClick={() => setSelectedQuestion({ question, level: levelData.level, index })}
                                  className="text-xs font-semibold bg-gray-200 text-gray-800 px-4 py-1.5 rounded-md hover:bg-gray-300 transition-colors flex-shrink-0"
                              >
                                  보기
                              </button>
                            </li>
                          )
                        })}
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