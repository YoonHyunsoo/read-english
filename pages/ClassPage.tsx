
import React, { useState, useCallback, useEffect } from 'react';
import DayItem from '../components/DayItem';
import { Day, User, Activity, ClassInfo } from '../types';
import { getDays, getClassesForStudent } from '../services/api';
import { BackIcon, ClassIcon } from '../components/icons';
import FooterNav from '../components/FooterNav';
import Header from '../components/Header';
import PageIdentifier from '../components/DevTools/PageIdentifier';

const SkeletonLoader: React.FC<{className?: string}> = ({ className }) => (
  <div className={`bg-gray-200 rounded-xl animate-pulse ${className}`}></div>
);

interface ClassPageProps {
  onStartActivity: (activity: Activity, classInfo: ClassInfo) => void;
  currentUser: User;
}

const StudentDayView: React.FC<{
  classInfo: ClassInfo;
  currentUser: User;
  onStartActivity: (activity: Activity, classInfo: ClassInfo) => void;
  onBack: () => void;
}> = ({ classInfo, currentUser, onStartActivity, onBack }) => {
  const [daysData, setDaysData] = useState<Day[]>([]);
  const [isLoadingDays, setIsLoadingDays] = useState(true);
  const [expandedDay, setExpandedDay] = useState<number | null>(null);

  const fetchDays = useCallback(async () => {
    setIsLoadingDays(true);
    try {
      const days = await getDays(currentUser.email, classInfo.id);
      setDaysData(days);
      
      if (days.length > 0 && expandedDay === null) {
          const firstLockedDayIndex = days.findIndex(d => d.isLocked);
          let dayToExpand: number;
          if (firstLockedDayIndex === -1) {
            dayToExpand = days[days.length - 1].id;
          } else if (firstLockedDayIndex > 0) {
             dayToExpand = days[firstLockedDayIndex - 1].id;
          } else {
             dayToExpand = days[0].id;
          }
          setExpandedDay(dayToExpand);
      }
    } catch (error) {
      console.error("Failed to fetch days:", error);
    } finally {
      setIsLoadingDays(false);
    }
  }, [currentUser.email, classInfo.id, expandedDay]);

  useEffect(() => {
    const handleActivityCompleted = () => fetchDays();
    fetchDays();
    window.addEventListener('activity-completed', handleActivityCompleted);
    return () => window.removeEventListener('activity-completed', handleActivityCompleted);
  }, [fetchDays]);


  const handleToggle = useCallback((dayId: number) => {
    setExpandedDay(prev => (prev === dayId ? null : dayId));
  }, []);

  const handleActivityClick = useCallback((activity: Activity) => {
    onStartActivity(activity, classInfo);
  }, [onStartActivity, classInfo]);

  return (
    <div className="h-full flex flex-col">
       <PageIdentifier path="pages/ClassPage.tsx" />
       <header className="flex items-center p-4 pt-4 pb-2 bg-white flex-shrink-0 relative border-b border-gray-200">
          <button onClick={onBack} className="absolute left-4 p-1 rounded-full hover:bg-gray-200" aria-label="클래스 선택으로 돌아가기">
              <div className="w-6 h-6 text-slate-700">
                  <BackIcon />
              </div>
          </button>
          <h1 className="text-lg font-bold text-slate-800 text-center w-full truncate px-12">
              {classInfo.name}
          </h1>
      </header>
      <main className="flex-grow overflow-y-auto">
        <div className="flex flex-col items-start p-4 pt-4 gap-3">
          {isLoadingDays ? (
            Array.from({length: 4}).map((_, i) => <SkeletonLoader key={i} className="h-[60px] w-full" />)
          ) : daysData.length > 0 ? (
            daysData.map((day) => (
              <DayItem 
                key={day.id} 
                day={day} 
                isExpanded={expandedDay === day.id} 
                onToggle={() => handleToggle(day.id)} 
                onActivityClick={handleActivityClick}
              />
            ))
          ) : (
             <div className="w-full text-center py-10 px-4">
                <p className="text-gray-600 font-semibold">설정된 커리큘럼이 없습니다</p>
                <p className="text-gray-500 text-sm mt-2">선생님께서 아직 커리큘럼을 설정하지 않았습니다. 나중에 다시 확인해주세요.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};


const ClassPage: React.FC<ClassPageProps> = ({ onStartActivity, currentUser }) => {
  const [selectedClass, setSelectedClass] = useState<ClassInfo | null>(null);
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchClasses = useCallback(async () => {
    if (currentUser.role !== 'student') return;
    setIsLoading(true);
    try {
      const studentClasses = await getClassesForStudent(currentUser.email);
      setClasses(studentClasses);
    } catch(e) {
      console.error("Failed to fetch student classes", e);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser.role, currentUser.email]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  if (currentUser.role !== 'student') {
    return (
      <div className="w-full text-center py-10 px-4">
        <p className="text-gray-600 font-semibold">수업 자료에서 학습 시작</p>
        <p className="text-gray-500 text-sm mt-2">'수업 자료' 탭을 사용하여 학습 활동을 찾아보고 시작하세요.</p>
      </div>
    );
  }

  if (selectedClass) {
    return (
      <StudentDayView
        classInfo={selectedClass}
        currentUser={currentUser}
        onStartActivity={onStartActivity}
        onBack={() => setSelectedClass(null)}
      />
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <PageIdentifier path="pages/ClassPage.tsx" />
      <main className="flex-1 container mx-auto p-4 pb-20">
        <div className="h-full flex flex-col p-4 pt-4">
          <PageIdentifier path="pages/ClassPage.tsx" />
          <main className="flex-grow overflow-y-auto">
            <div className="space-y-3">
              {isLoading ? (
                Array.from({ length: 2 }).map((_, i) => <SkeletonLoader key={i} className="h-[100px] w-full" />)
              ) : classes.length > 0 ? (
                classes.map(classInfo => (
                  <button 
                    key={classInfo.id}
                    onClick={() => setSelectedClass(classInfo)}
                    className="w-full text-left bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 flex flex-col justify-between h-[110px]"
                  >
                    <div>
                      <h3 className="font-bold text-lg text-slate-800">{classInfo.name}</h3>
                      <p className="text-sm text-gray-500 truncate">{classInfo.description || '클래스 설명이 없습니다.'}</p>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold bg-gray-200 text-gray-700 px-2 py-1 rounded-md">{classInfo.grade.join(', ')}</span>
                      <div className="w-6 h-6 text-slate-400">
                        <ClassIcon />
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="w-full text-center py-10 px-4">
                    <p className="text-gray-600 font-semibold">소속된 클래스가 없습니다</p>
                    <p className="text-gray-500 text-sm mt-2">선생님께서 클래스에 초대하면 여기에 표시됩니다.</p>
                </div>
              )}
            </div>
          </main>
        </div>
      </main>
      <FooterNav />
    </div>
  );
};

export default ClassPage;
