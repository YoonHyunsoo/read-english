import React, { useState, useEffect, useCallback } from 'react';
import { User, ClassInfo, Day, LeveledQuestion, Activity, ActivityType, ReadingMaterial, DayActivityContentForTeacher, ListeningMaterial } from '../types';
import { getClassesForUser, addClass, getCurriculumDaysForTeacher, getMaterialQuestions, getCompletionStatusForActivity, getCurriculumOverrides, updateCurriculumActivity, updateClass, deleteClass, getReadingMaterialForActivity, startDayForClass, cancelDayForClass, getCurriculumForClass, getDayContentForTeacher } from '../services/api';
import { PlusIcon, CloseIcon, ChevronDownIcon, ChevronUpIcon, VocabIcon, ListeningIcon, ReadingIcon, GrammarIcon, SettingsIcon } from '../components/icons';
import ActivityStatusModal from '../components/ActivityStatusModal';
import ModifyActivityChoiceModal from '../components/ModifyActivityChoiceModal';
import SelectMaterialModal from '../components/SelectMaterialModal';
import QuestionDetailModal from '../components/QuestionDetailModal';
import ReadingMaterialDetailModal from '../components/ReadingMaterialDetailModal';
import FooterNav from '../components/FooterNav';
import { getActivityLevelStyles } from '../utils/colorUtils';
import PageIdentifier from '../components/DevTools/PageIdentifier';

const gradeOptions = [
    '초등 1', '초등 2', '초등 3', '초등 4', '초등 5', '초등 6',
    '중등 1', '중등 2', '중등 3',
    '고등 1', '고등 2', '고등 3',
    '기타'
];

interface ClassesPageProps {
  teacher: User;
  onManageCurriculum: (classId: string) => void;
  onManageStudents: (classId: string) => void;
  onEnterClassSession?: (classId: string, dayId: number) => void;
}

const GradeSelector: React.FC<{ selectedGrades: string[], onChange: (grades: string[]) => void }> = ({ selectedGrades, onChange }) => {
    const handleGradeChange = (grade: string) => {
        const newSelection = selectedGrades.includes(grade)
            ? selectedGrades.filter(g => g !== grade)
            : [...selectedGrades, grade];
        onChange(newSelection);
    };

    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">주요 학년 (1~9개 선택)</label>
            <div className="grid grid-cols-3 gap-2">
                {gradeOptions.map(grade => (
                    <button
                        type="button"
                        key={grade}
                        onClick={() => handleGradeChange(grade)}
                        className={`p-2 rounded-md text-xs sm:text-sm text-center border transition-all duration-200 ${selectedGrades.includes(grade) ? 'bg-blue-600 text-white border-blue-600 font-semibold' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'}`}
                    >
                        {grade}
                    </button>
                ))}
            </div>
        </div>
    );
};

const ClassModal: React.FC<{ 
    isOpen: boolean, 
    onClose: () => void, 
    onSave: (classData: Omit<ClassInfo, 'id' | 'teacherEmail'> | ClassInfo) => void,
    initialData?: ClassInfo,
    onDelete?: () => void 
}> = ({ isOpen, onClose, onSave, initialData, onDelete }) => {
    const [name, setName] = useState(initialData?.name || '');
    const [description, setDescription] = useState(initialData?.description || '');
    const [grades, setGrades] = useState<string[]>(initialData?.grade || []);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setName(initialData?.name || '');
            setDescription(initialData?.description || '');
            setGrades(initialData?.grade || []);
            setError('');
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const handleSave = () => {
        if (!name || grades.length === 0) {
            setError('클래스 이름과 주요 학년은 필수입니다.');
            return;
        }
        if(grades.length > 9) {
            setError('주요 학년은 최대 9개까지 선택할 수 있습니다.');
            return;
        }
        const classData = { name, description, grade: grades };
        if (initialData) {
            onSave({ ...initialData, ...classData });
        } else {
            onSave(classData);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
                <header className="flex items-center justify-between p-4 border-b border-gray-200">
                    <h2 className="text-lg font-bold text-slate-800">{initialData ? '클래스 수정' : '새 클래스 추가하기'}</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200"><CloseIcon /></button>
                </header>
                <div className="p-4 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">클래스 이름</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full form-input" placeholder="예: 중급 영어반" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">클래스 설명 (선택사항)</label>
                        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full form-input" placeholder="예: 주 3회, 2시간 수업" />
                    </div>
                    <GradeSelector selectedGrades={grades} onChange={setGrades} />
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                </div>
                <footer className="p-4 flex justify-between items-center bg-gray-50 rounded-b-xl">
                    <div>
                        {initialData && onDelete && (
                            <button onClick={onDelete} className="bg-red-100 text-red-700 font-bold py-2 px-4 rounded-lg hover:bg-red-200 transition-colors text-sm">
                                클래스 삭제
                            </button>
                        )}
                    </div>
                    <div className="flex gap-3">
                        <button onClick={onClose} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-300">취소</button>
                        <button onClick={handleSave} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700">저장</button>
                    </div>
                </footer>
            </div>
            <style>{`.form-input { display: block; width: 100%; padding: 0.5rem 0.75rem; border: 1px solid #D1D5DB; border-radius: 0.5rem; }`}</style>
        </div>
    );
};


const iconMap: Record<Exclude<ActivityType, 'empty'>, React.ReactNode> = {
  vocab: <VocabIcon />,
  listening: <ListeningIcon />,
  reading: <ReadingIcon />,
  grammar: <GrammarIcon />,
};

const ClassCard: React.FC<{
  classInfo: ClassInfo;
  onManageCurriculum: (classId: string) => void;
  onManageStudents: (classId: string) => void;
  onClassUpdated: () => void;
  onEnterClassSession?: (classId: string, dayId: number) => void;
}> = ({ classInfo, onManageCurriculum, onManageStudents, onClassUpdated, onEnterClassSession }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [days, setDays] = useState<Day[]>([]);
  const [startedDays, setStartedDays] = useState<Set<number>>(new Set());
  const [toastMessage, setToastMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const [expandedDayId, setExpandedDayId] = useState<number | null>(null);
  const [dayContent, setDayContent] = useState<DayActivityContentForTeacher[]>([]);
  const [isLoadingContent, setIsLoadingContent] = useState(false);

  const [viewingQuestion, setViewingQuestion] = useState<{ question: LeveledQuestion; level: number; index: number } | null>(null);
  const [viewingReadingMaterial, setViewingReadingMaterial] = useState<ReadingMaterial | null>(null);
  const [viewingStatus, setViewingStatus] = useState<{ activityId: string; activityTitle: string; classId: string; } | null>(null);

  // State for modification flow
  const [modifyingContent, setModifyingContent] = useState<{ day: Day; content: DayActivityContentForTeacher } | null>(null);
  const [showModifyChoice, setShowModifyChoice] = useState(false);
  const [showSelectMaterial, setShowSelectMaterial] = useState<'single' | 'sequential' | null>(null);

  const fetchCurriculumData = async () => {
    setIsLoading(true);
    const curriculum = await getCurriculumForClass(classInfo.id);
    if (curriculum) {
        const curriculumDays = await getCurriculumDaysForTeacher(classInfo.id);
        setDays(curriculumDays);
        setStartedDays(new Set(curriculum.startedDays || []));
    } else {
        setDays([]);
        setStartedDays(new Set());
    }
    setIsLoading(false);
  };
  
  const handleToggleExpand = () => {
    const newIsExpanded = !isExpanded;
    setIsExpanded(newIsExpanded);
    if (newIsExpanded) {
      fetchCurriculumData();
    }
  };
  
  const handleUpdateClass = async (updatedClassData: ClassInfo) => {
    await updateClass(updatedClassData);
    setIsEditing(false);
    onClassUpdated();
  };

  const handleDeleteClass = async () => {
      if (window.confirm(`'${classInfo.name}' 클래스를 정말로 삭제하시겠습니까? 이 클래스와 관련된 모든 학생 배정 및 커리큘럼 정보가 영구적으로 삭제되며, 복구할 수 없습니다.`)) {
        const result = await deleteClass(classInfo.id);
        if (result.success) {
            setIsEditing(false);
            onClassUpdated();
        } else {
            alert('클래스 삭제에 실패했습니다. 다시 시도해 주세요.');
        }
      }
  };

  const loadDayContent = useCallback(async (day: Day) => {
    setIsLoadingContent(true);
    setDayContent([]);
    try {
        const resolvedContent = await getDayContentForTeacher(day, classInfo.id);
        setDayContent(resolvedContent);
    } catch (error) {
        console.error("Failed to load day content:", error);
        setDayContent([]);
    } finally {
        setIsLoadingContent(false);
    }
  }, [classInfo.id]);
  
  useEffect(() => {
    if (expandedDayId === null) {
        setDayContent([]);
        return;
    }

    const dayToLoad = days.find(d => d.id === expandedDayId);
    if (dayToLoad) {
        loadDayContent(dayToLoad);
    }
  }, [expandedDayId, days, loadDayContent]);

  const handleDayToggle = useCallback((day: Day) => {
    setExpandedDayId(prevId => (prevId === day.id ? null : day.id));
  }, []);
  
  const handleStartDayToggle = async (dayNumber: number) => {
    if (startedDays.has(dayNumber)) {
        if (window.confirm("학생들이 해당 학습을 진행하지 못하게 할까요?")) {
            await cancelDayForClass(classInfo.id, dayNumber);
            setStartedDays(prev => {
                const newSet = new Set(prev);
                newSet.delete(dayNumber);
                return newSet;
            });
            setToastMessage('수업이 마감되었습니다.');
        }
    } else {
        await startDayForClass(classInfo.id, dayNumber);
        setStartedDays(prev => new Set(prev).add(dayNumber));
        setToastMessage('수업이 시작되었습니다. 이제 학생들이 해당 학습을 진행할 수 있습니다!');
    }
    setTimeout(() => setToastMessage(''), 2500);
  };

  const handleEnterSession = (day: Day) => {
    if (!startedDays.has(day.id)) {
      setToastMessage('수업 시작을 먼저 해주세요. 수업 시작 시, 학생들도 해당 커리큘럼을 학습할 수 있습니다.');
      setTimeout(() => setToastMessage(''), 1500);
      return;
    }
    if (onEnterClassSession) onEnterClassSession(classInfo.id, day.id);
  };

  const handleModifyClick = (day: Day, content: DayActivityContentForTeacher) => {
    setModifyingContent({ day, content });
    setShowModifyChoice(true);
  };

  const handleModifyChoiceSelected = (scope: 'single' | 'sequential') => {
    setShowModifyChoice(false);
    setShowSelectMaterial(scope);
  };

  const handleMaterialSelected = async (newQuestionId: string) => {
      if (!modifyingContent || !showSelectMaterial) return;

      const scope = showSelectMaterial;
      const { day, content } = modifyingContent;

      let shouldUpdate = false;
      if (scope === 'single') {
          shouldUpdate = true;
      } else if (scope === 'sequential') {
          const confirmationText = "해당 과제로 바꿀까요? 그 뒤 과제들은 모두 해당 과제 뒷 과제들로 순차적으로 바뀝니다.";
          if (window.confirm(confirmationText)) {
              shouldUpdate = true;
          }
      }

      if (shouldUpdate) {
          await updateCurriculumActivity(classInfo.id, day.id, content.activity, newQuestionId, scope);
          const dayToReload = days.find(d => d.id === day.id);
          if (dayToReload) {
              await loadDayContent(dayToReload);
          }
      }
      
      setShowSelectMaterial(null);
      setModifyingContent(null);
  };


  return (
    <>
      <ClassModal
        isOpen={isEditing}
        onClose={() => setIsEditing(false)}
        onSave={(data) => handleUpdateClass(data as ClassInfo)}
        initialData={classInfo}
        onDelete={handleDeleteClass}
      />
      {viewingQuestion && (
         <QuestionDetailModal 
          question={viewingQuestion?.question}
          level={viewingQuestion?.level}
          index={viewingQuestion?.index}
          onClose={() => setViewingQuestion(null)}
        />
      )}
       {viewingReadingMaterial && (
        <ReadingMaterialDetailModal unit={viewingReadingMaterial} onClose={() => setViewingReadingMaterial(null)} />
      )}
      {viewingStatus && (
        <ActivityStatusModal
          isOpen={!!viewingStatus}
          onClose={() => setViewingStatus(null)}
          activityId={viewingStatus.activityId}
          activityTitle={viewingStatus.activityTitle}
          classId={viewingStatus.classId}
        />
      )}
      {modifyingContent && modifyingContent.content.content && 'text' in modifyingContent.content.content && (
        <>
          <ModifyActivityChoiceModal 
            isOpen={showModifyChoice}
            onClose={() => setShowModifyChoice(false)}
            onSelect={handleModifyChoiceSelected}
          />
          <SelectMaterialModal
            isOpen={!!showSelectMaterial}
            onClose={() => setShowSelectMaterial(null)}
            onSelect={handleMaterialSelected}
            classId={classInfo.id}
            activityType={modifyingContent.content.activity.type}
            level={modifyingContent.content.activity.level}
            currentQuestionId={modifyingContent.content.content.id}
          />
        </>
      )}

      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col gap-4">
        {/* Card Header */}
        <div>
          <div className="flex justify-between items-start">
            <h3 className="font-bold text-lg text-slate-800 flex-1">{classInfo.name}</h3>
            <button onClick={() => setIsEditing(true)} className="p-1 text-slate-500 hover:text-slate-800 transition-colors">
              <SettingsIcon className="w-5 h-5" />
            </button>
          </div>
          <p className="text-sm text-gray-500">{classInfo.grade.join(', ')}</p>
          {classInfo.description && <p className="text-sm text-gray-600 mt-2">{classInfo.description}</p>}
        </div>

        {/* Card Footer */}
        <div className="pt-3 border-t border-gray-200 flex gap-3">
            <button onClick={() => onManageCurriculum(classInfo.id)} className="flex-1 bg-blue-100 text-blue-700 font-semibold py-2 px-4 rounded-lg hover:bg-blue-200 transition-colors text-sm">
                커리큘럼 관리
            </button>
            <button onClick={() => onManageStudents(classInfo.id)} className="flex-1 bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors text-sm">
                학생 관리
            </button>
        </div>

        {/* Card Body (Expandable) */}
        <div className="pt-3 border-t border-gray-200">
          <button onClick={handleToggleExpand} className="flex justify-between items-center w-full text-left text-sm font-semibold text-slate-600 hover:text-slate-800">
            <span>커리큘럼 미리보기</span>
            <div className="w-5 h-5">{isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}</div>
          </button>
          {isExpanded && (
            <div className="mt-3 space-y-3">
              {isLoading ? (
                <p className="text-sm text-gray-500 text-center py-4">커리큘럼을 불러오는 중...</p>
              ) : days.length > 0 ? (
                days.map(day => (
                  <div key={day.id} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <div className="flex justify-between items-center w-full">
                        <span className="font-semibold text-slate-700">{day.title}</span>
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => handleStartDayToggle(day.id)}
                                className={`text-xs font-semibold px-3 py-1.5 rounded-md transition-colors ${
                                    startedDays.has(day.id) 
                                    ? 'bg-green-200 text-green-800 hover:bg-green-300' 
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                            >
                                {startedDays.has(day.id) ? '수업 마감' : '수업 시작'}
                            </button>
                            <button 
                                onClick={() => handleEnterSession(day)}
                                className={`text-xs font-semibold px-3 py-1.5 rounded-md transition-colors bg-blue-100 text-blue-700 hover:bg-blue-200`}
                            >
                                입장하기
                            </button>
                            <button onClick={() => handleDayToggle(day)} className="p-1 rounded-full text-slate-700 hover:bg-gray-200">
                                <div className="w-5 h-5">{expandedDayId === day.id ? <ChevronUpIcon /> : <ChevronDownIcon />}</div>
                            </button>
                        </div>
                    </div>
                    {expandedDayId === day.id && (
                      <div className="mt-3 pl-2 border-l-2 border-gray-300">
                        {isLoadingContent ? <p className="text-sm text-gray-500 p-2">자료를 불러오는 중...</p> : (
                          dayContent.length > 0 && dayContent.some(c => c.content) ? (
                             <div className="space-y-3">
                              {dayContent.map((contentItem) => {
                                const { activity, content } = contentItem;
                                if (!content) return null;
                                
                                const isUnit = (c: typeof content): c is ReadingMaterial | ListeningMaterial => 'activityType' in c;
                                const isQuestion = (c: typeof content): c is LeveledQuestion => 'text' in c;

                                if (isUnit(content)) {
                                  const unit = content;
                                  return (
                                    <div key={activity.id} className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                                      <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-bold text-sm text-slate-700 flex items-center gap-2">
                                          <span className="text-xs font-medium px-2 py-0.5 rounded-md" style={getActivityLevelStyles(activity.type, activity.level)}>
                                            Lv. {activity.level}
                                          </span>
                                          <span>{`${activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}`}</span>
                                        </h4>
                                      </div>
                                      <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-2 flex-grow overflow-hidden">
                                          <div className="w-5 h-5 text-slate-600 flex-shrink-0 ml-1">{iconMap[activity.type]}</div>
                                          <span className="font-medium text-sm truncate flex-shrink">{`${day.id}차시: ${unit.title}`}</span>
                                        </div>
                                        <div className="flex gap-2 flex-shrink-0 ml-2">
                                          <button onClick={() => setViewingReadingMaterial(unit as ReadingMaterial)} className="text-xs font-semibold bg-gray-200 text-gray-800 px-3 py-1.5 rounded-md hover:bg-gray-300">보기</button>
                                          <button onClick={() => setViewingStatus({ activityId: activity.id, activityTitle: `${day.title}: ${unit.title}`, classId: classInfo.id })} className="text-xs font-semibold bg-blue-200 text-blue-800 px-3 py-1.5 rounded-md hover:bg-blue-300">현황</button>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                }
                                
                                if (isQuestion(content)) {
                                  const question = content;
                                  return (
                                    <div key={activity.id} className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                                      <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-bold text-sm text-slate-700 flex items-center gap-2">
                                          <span className="text-xs font-medium px-2 py-0.5 rounded-md" style={getActivityLevelStyles(activity.type, activity.level)}>
                                            Lv. {activity.level}
                                          </span>
                                          <span>{`${activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}`}</span>
                                        </h4>
                                        <button onClick={() => handleModifyClick(day, contentItem)} className="text-xs text-blue-600 hover:underline font-semibold">
                                          수정
                                        </button>
                                      </div>
                                      <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-2 flex-grow overflow-hidden">
                                          <div className="w-5 h-5 text-slate-600 flex-shrink-0 ml-1">{iconMap[activity.type]}</div>
                                          <span className="font-medium text-sm truncate flex-shrink">{`${day.id}차시: ${question.text}`}</span>
                                        </div>
                                        <div className="flex gap-2 flex-shrink-0 ml-2">
                                          <button onClick={() => setViewingQuestion({ question, level: activity.level, index: day.id -1 })} className="text-xs font-semibold bg-gray-200 text-gray-800 px-3 py-1.5 rounded-md hover:bg-gray-300">보기</button>
                                          <button onClick={() => setViewingStatus({ activityId: activity.id, activityTitle: `${day.title}: ${activity.type} L${activity.level}`, classId: classInfo.id })} className="text-xs font-semibold bg-blue-200 text-blue-800 px-3 py-1.5 rounded-md hover:bg-blue-300">현황</button>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                }
                                return null;
                              })}
                            </div>
                          ) : <p className="text-sm text-gray-500 p-2">이 날짜에 정의되거나 사용 가능한 활동이 없습니다.</p>
                        )}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">이 클래스에 설정된 커리큘럼이 없습니다.</p>
              )}
            </div>
          )}
        </div>
        {toastMessage && 
            <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-4 py-2 rounded-lg z-50 animate-fade-in-up shadow-lg">
            {toastMessage}
            </div>
        }
      </div>
    </>
  );
};

const ClassesPage: React.FC<ClassesPageProps> = ({ teacher, onManageCurriculum, onManageStudents }) => {
    const [classes, setClasses] = useState<ClassInfo[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddingClass, setIsAddingClass] = useState(false);

    const fetchClasses = useCallback(async () => {
        setIsLoading(true);
        const fetchedClasses = await getClassesForUser(teacher);
        setClasses(fetchedClasses);
        setIsLoading(false);
    }, [teacher]);

    useEffect(() => {
        fetchClasses();
        const handleCurriculumUpdate = () => { fetchClasses() };
        window.addEventListener('curriculum-updated', handleCurriculumUpdate);
        return () => window.removeEventListener('curriculum-updated', handleCurriculumUpdate);
    }, [fetchClasses]);

    const handleSaveNewClass = async (newClassData: Omit<ClassInfo, 'id' | 'teacherEmail'>) => {
        const newClass: ClassInfo = {
            ...newClassData,
            id: `class-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            teacherEmail: teacher.email,
            institution: teacher.institution,
        };
        await addClass(newClass);
        fetchClasses();
        setIsAddingClass(false);
    };

    if (isLoading) {
        return <div className="p-4 text-center text-gray-500">클래스를 불러오는 중...</div>;
    }

    return (
        <div className="h-full flex flex-col bg-gray-50">
            <PageIdentifier path="pages/ClassesPage.tsx" />
            <ClassModal 
                isOpen={isAddingClass}
                onClose={() => setIsAddingClass(false)}
                onSave={handleSaveNewClass}
            />
            <main className="flex-1 container mx-auto p-4 pb-20">
                <h2 className="text-base font-bold text-slate-800 mb-3">내 클래스 목록</h2>
                {classes.length > 0 ? (
                    <div className="space-y-3">
                        {classes.map(c => (
                           <ClassCard
                             key={c.id}
                             classInfo={c}
                             onManageCurriculum={onManageCurriculum}
                             onManageStudents={onManageStudents}
                             onClassUpdated={fetchClasses}
                           />
                        ))}
                    </div>
                ) : (
                    <div className="text-center text-gray-500 py-10">
                        <p className="font-semibold">생성된 클래스가 없습니다.</p>
                        <p className="mt-2 text-sm">'클래스 추가하기' 버튼을 눌러 첫 클래스를 만들어보세요.</p>
                    </div>
                )}
            </main>
            <FooterNav />
        </div>
    );
};

export default ClassesPage;
