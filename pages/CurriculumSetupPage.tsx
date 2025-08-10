import React, { useState, useEffect, useCallback } from 'react';
import { Curriculum, ClassFormatActivity, ActivityType, ListeningMaterial } from '../types';
import { getCurriculumForClass, saveCurriculumForClass, getMaxCompletedDaysForClass } from '../services/api';
import { BackIcon, PlusIcon, VocabIcon, ListeningIcon, ReadingIcon, GrammarIcon } from '../components/icons';
import { getActivityLevelStyles } from '../utils/colorUtils';
import PageIdentifier from '../components/DevTools/PageIdentifier';

// Props
interface CurriculumSetupPageProps {
  classId: string;
  onClose: () => void;
}

interface ActivitySelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (activity: ClassFormatActivity) => void;
    currentActivity: ClassFormatActivity;
    dayActivities: ClassFormatActivity[];
}

// ActivitySelectionModal Component
const ActivitySelectionModal: React.FC<ActivitySelectionModalProps> = ({ isOpen, onClose, onSave, currentActivity, dayActivities }) => {
    const [selectedType, setSelectedType] = useState<ActivityType>(currentActivity.type);
    const [selectedLevel, setSelectedLevel] = useState<number>(currentActivity.level);

    useEffect(() => {
        setSelectedType(currentActivity.type);
        setSelectedLevel(currentActivity.level);
    }, [currentActivity]);

    if (!isOpen) return null;

    const activityTypes: ActivityType[] = ['vocab', 'listening', 'reading', 'grammar', 'empty'];

    const getAvailableLevels = (type: ActivityType) => {
        if (type === 'empty') return [];
        // Allow duplicate type/level activities
        return Array.from({ length: 9 }, (_, i) => i + 1);
    };

    const availableLevels = getAvailableLevels(selectedType);

    useEffect(() => {
        if (selectedType !== 'empty' && !availableLevels.includes(selectedLevel)) {
            setSelectedLevel(availableLevels[0] || 1);
        }
    }, [selectedType, selectedLevel, availableLevels]);
    
    const handleSave = () => {
        onSave({ ...currentActivity, type: selectedType, level: selectedType === 'empty' ? 0 : selectedLevel });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-80 p-5">
                <h3 className="text-lg font-bold mb-4">활동 선택</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">유형</label>
                        <select value={selectedType} onChange={e => setSelectedType(e.target.value as ActivityType)} className="w-full form-select">
                            {activityTypes.map(type => (
                                <option key={type} value={type}>{type === 'empty' ? '-' : type.charAt(0).toUpperCase() + type.slice(1)}</option>
                            ))}
                        </select>
                    </div>
                    {selectedType !== 'empty' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Level</label>
                            <select value={selectedLevel} onChange={e => setSelectedLevel(parseInt(e.target.value))} className="w-full form-select" disabled={availableLevels.length === 0}>
                                {availableLevels.length > 0 ? (
                                     availableLevels.map(level => <option key={level} value={level}>Level {level}</option>)
                                 ) : (
                                     <option>사용 가능한 레벨 없음</option>
                                 )}
                            </select>
                        </div>
                    )}
                </div>
                <div className="mt-6 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md">취소</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-md">저장</button>
                </div>
            </div>
            <style>{`.form-select { flex-grow: 1; padding: 0.5rem 0.75rem; border: 1px solid #D1D5DB; border-radius: 0.375rem; }`}</style>
        </div>
    );
};


// Main Page Component
const CurriculumSetupPage: React.FC<CurriculumSetupPageProps> = ({ classId, onClose }) => {
    const [numberOfDays, setNumberOfDays] = useState(1);
    const [classFormat, setClassFormat] = useState<ClassFormatActivity[]>([]);
    const [message, setMessage] = useState('');
    const [modalState, setModalState] = useState<{ isOpen: boolean; activity: ClassFormatActivity | null }>({ isOpen: false, activity: null });

    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

    const [minAllowedDays, setMinAllowedDays] = useState(1);
    const [daysError, setDaysError] = useState('');


    useEffect(() => {
      const fetchInitialData = async () => {
        const existingCurriculum = await getCurriculumForClass(classId);
        const initialFormat = Array(6).fill(null).map((_, index) => ({ id: `slot-${index}`, type: 'empty' as ActivityType, level: 0 }));

        if (existingCurriculum) {
            setNumberOfDays(existingCurriculum.numberOfDays);
            const paddedFormat = [...existingCurriculum.classFormat];
            while(paddedFormat.length < 6) {
                paddedFormat.push({ id: `slot-${paddedFormat.length}`, type: 'empty', level: 0 });
            }
            setClassFormat(paddedFormat);
        } else {
            setNumberOfDays(1);
            setClassFormat(initialFormat);
        }
        
        const maxCompleted = await getMaxCompletedDaysForClass(classId);
        setMinAllowedDays(maxCompleted > 0 ? maxCompleted : 1);
      };
      fetchInitialData();
    }, [classId]);

    const handleDaysChange = (newDayCount: number) => {
        if (newDayCount < 1) newDayCount = 1;
        if (newDayCount > 30) newDayCount = 30; 
        
        if (newDayCount < minAllowedDays) {
            setDaysError(`완료된 수업이 있어 ${minAllowedDays}회차 미만으로 축소할 수 없습니다.`);
        } else {
            setDaysError('');
        }
        setNumberOfDays(newDayCount);
    };

    const handleSaveChanges = async () => {
        if (numberOfDays < minAllowedDays) {
            setDaysError(`완료된 수업이 있어 ${minAllowedDays}회차 미만으로 축소할 수 없습니다.`);
            return;
        }

        const cleanedFormat = classFormat.filter(act => act.type !== 'empty');
        const newCurriculum: Curriculum = {
            numberOfDays,
            classFormat: cleanedFormat
        };
        await saveCurriculumForClass(classId, newCurriculum);
        setMessage('커리큘럼이 성공적으로 저장되었습니다.');
        setTimeout(() => {
            setMessage('');
            onClose();
        }, 1000);
    };
    
    const handleSlotClick = (activity: ClassFormatActivity) => {
        setModalState({ isOpen: true, activity });
    };

    const handleModalSave = (updatedActivity: ClassFormatActivity) => {
        setClassFormat(prev => prev.map(act => act.id === updatedActivity.id ? updatedActivity : act));
    };

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
        e.preventDefault();
        const targetActivity = classFormat[index];
        if (draggedIndex !== null && draggedIndex !== index && targetActivity.type !== 'empty') {
            e.dataTransfer.dropEffect = 'move';
            setDragOverIndex(index);
        } else {
            e.dataTransfer.dropEffect = 'none';
            if (dragOverIndex !== null) setDragOverIndex(null);
        }
    };
    
    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setDragOverIndex(null);
    };
    
    const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetIndex: number) => {
        e.preventDefault();
        setDragOverIndex(null);
        if (draggedIndex === null || draggedIndex === targetIndex) return;
        
        const targetActivity = classFormat[targetIndex];
        if (targetActivity.type === 'empty') {
            setDraggedIndex(null);
            return;
        }
        
        const newFormat = [...classFormat];
        const [reorderedItem] = newFormat.splice(draggedIndex, 1);
        newFormat.splice(targetIndex, 0, reorderedItem);
        
        setDraggedIndex(null);
        setClassFormat(newFormat);
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
        setDragOverIndex(null);
    };
    
    const iconMap: Record<ActivityType, React.ReactNode> = {
        vocab: <VocabIcon />, listening: <ListeningIcon />, reading: <ReadingIcon />, grammar: <GrammarIcon />, empty: null,
    };
    
    return (
        <div className="flex flex-col h-full bg-gray-50">
            <PageIdentifier path="pages/CurriculumSetupPage.tsx" />
            <header className="flex items-center p-4 pt-4 pb-2 bg-white flex-shrink-0 relative border-b border-gray-200">
                <button onClick={onClose} className="absolute left-4 p-1 rounded-full hover:bg-gray-200" aria-label="Back">
                    <div className="w-6 h-6 text-slate-700">
                        <BackIcon />
                    </div>
                </button>
                <h1 className="text-lg font-bold text-slate-800 text-center w-full">커리큘럼 관리</h1>
            </header>
            <main className="flex-grow p-4 overflow-y-auto">
                <div className="space-y-6">
                    <div className="bg-white p-4 rounded-xl border border-gray-200">
                        <h3 className="font-bold text-slate-800">생성 회차 수</h3>
                         <ul className="list-disc list-inside text-xs text-gray-500 mt-2 mb-3 space-y-1">
                          <li>해당 클래스에, 몇 차시의 수업을 진행할 예정인지 숫자를 입력하세요.</li>
                          <li>회차 수는 언제든 증가/축소 가능합니다.</li>
                          <li>완료한 수업 수보다 적은 회차 수로 축소는 불가합니다.</li>
                        </ul>
                        <input
                            type="number"
                            id="day-count"
                            min={minAllowedDays}
                            max="30"
                            value={numberOfDays}
                            onChange={(e) => handleDaysChange(parseInt(e.target.value, 10))}
                            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                         {daysError && <p className="text-red-500 text-sm mt-2">{daysError}</p>}
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-gray-200">
                      <h3 className="font-bold text-slate-800">수업 형식 (모든 회차에 적용)</h3>
                      <ul className="list-disc list-inside text-xs text-gray-500 mt-2 space-y-1">
                        <li>박스를 눌러 수업에 필요한 수업자료를 선택하세요. (최소 1개 ~ 최대 6개)</li>
                        <li>수업자료는 4가지 종류가 있으며, 각각 1개 이상씩 추가할수도 있습니다.</li>
                        <li>활성화된 박스를 클릭+드래그해서 순서를 조정할 수 있습니다.</li>
                      </ul>
                      <div className="grid grid-cols-3 gap-3 mt-3">
                        {classFormat.map((activity, index) => {
                            const isPreviousSlotFilled = index === 0 || classFormat[index - 1].type !== 'empty';
                            const isCurrentSlotFilled = activity.type !== 'empty';
                            const isClickable = isCurrentSlotFilled || isPreviousSlotFilled;

                            const isDraggable = activity.type !== 'empty';
                            const levelStyles = getActivityLevelStyles(activity.type, activity.level);

                            const isBeingDragged = draggedIndex === index;
                            const isDragOverTarget = dragOverIndex === index && isDraggable && classFormat[dragOverIndex].type !== 'empty';

                            const getSlotClasses = () => {
                                let baseClasses = 'relative flex flex-col items-center justify-center p-2 h-24 rounded-lg border-2 border-dashed transition-all ';
                                
                                if (isBeingDragged) return baseClasses + 'opacity-50 bg-white border-gray-300';
                                if (isDragOverTarget) return baseClasses + 'border-blue-500 bg-blue-50 scale-105';
                                if (isDraggable) return baseClasses + 'bg-white border-gray-300 cursor-grab';

                                // Logic for empty slots
                                if (isClickable) {
                                    return baseClasses + 'bg-gray-100 border-gray-300 cursor-pointer hover:border-blue-500 hover:bg-blue-50';
                                } else {
                                    return baseClasses + 'bg-gray-50 border-gray-200 opacity-70 cursor-not-allowed';
                                }
                            };

                            return (
                                <div
                                    key={activity.id}
                                    draggable={isDraggable}
                                    onDragStart={isDraggable ? (e) => handleDragStart(e, index) : undefined}
                                    onDragOver={(e) => handleDragOver(e, index)}
                                    onDragLeave={handleDragLeave}
                                    onDrop={(e) => handleDrop(e, index)}
                                    onDragEnd={handleDragEnd}
                                    onClick={isClickable ? () => handleSlotClick(activity) : undefined}
                                    className={getSlotClasses()}
                                >
                                    <div className="absolute top-1 left-2 text-xs font-bold text-gray-400">{index + 1}</div>
                                    {activity.type === 'empty' ? (
                                        <PlusIcon className="w-8 h-8 text-gray-300" />
                                    ) : (
                                        <>
                                            <div className="w-8 h-8 text-slate-700">{iconMap[activity.type]}</div>
                                            <p className="text-xs font-semibold text-center mt-1 text-slate-700">{activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}</p>
                                            <span 
                                                className="text-xs font-medium px-2 py-0.5 rounded-md mt-1"
                                                style={levelStyles}
                                            >
                                                Lv. {activity.level}
                                            </span>
                                        </>
                                    )}
                                </div>
                            );
                        })}
                      </div>
                    </div>
                </div>
                 {modalState.isOpen && modalState.activity && (
                    <ActivitySelectionModal
                        isOpen={modalState.isOpen}
                        onClose={() => setModalState({ isOpen: false, activity: null })}
                        onSave={handleModalSave}
                        currentActivity={modalState.activity}
                        dayActivities={classFormat}
                    />
                )}
            </main>
             <footer className="p-4 border-t border-gray-200 bg-white sticky bottom-0">
                <button onClick={handleSaveChanges} className="w-full bg-blue-600 text-white font-bold py-3 px-5 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400" disabled={!!daysError}>
                    Save Changes
                </button>
                {message && <p className="text-green-600 text-sm text-center mt-2">{message}</p>}
            </footer>
        </div>
    );
};

export default CurriculumSetupPage;