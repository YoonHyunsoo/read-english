import React, { useEffect, useMemo, useState } from 'react';
import PageIdentifier from '../components/DevTools/PageIdentifier';
import { ClassInfo, Day, User, Activity, ReadingMaterial, ListeningMaterial, Quiz } from '../types';
import { getCurriculumForClass, getCurriculumDaysForTeacher, getDayContentForTeacher, getListeningMaterial, getReadingMaterialForActivity, getQuizForActivity } from '../services/api';
import { ChevronLeftIcon } from '../components/icons';

interface TeacherClassSessionPageProps {
  currentUser: User;
  classId: string;
  dayId: number;
  onClose: () => void;
}

const TeacherClassSessionPage: React.FC<TeacherClassSessionPageProps> = ({ currentUser, classId, dayId, onClose }) => {
  const [day, setDay] = useState<Day | null>(null);
  const [contents, setContents] = useState<ReturnType<typeof Object>[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const days = await getCurriculumDaysForTeacher(classId);
        const target = days.find(d => d.id === dayId) || null;
        setDay(target);
        if (target) {
          const items = await getDayContentForTeacher(target, classId);
          setContents(items);
        } else {
          setContents([]);
        }
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [classId, dayId]);

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <PageIdentifier path="pages/TeacherClassSessionPage.tsx" />
      <header className="flex items-center p-4 bg-white border-b">
        <button onClick={onClose} className="p-1 rounded-md hover:bg-gray-100 mr-2" aria-label="뒤로">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>
        </button>
        <h1 className="text-lg font-bold text-slate-800">{day ? `${day.title} 수업 화면` : '수업 화면'}</h1>
      </header>
      <main className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <p className="text-center text-gray-500 py-10">콘텐츠를 불러오는 중...</p>
        ) : day && contents.length > 0 ? (
          <div className="space-y-3">
            {contents.map((item) => {
              if (!item.content) return null;
              const activity = item.activity as Activity;

              if ((item.content as ReadingMaterial).activityType === 'reading') {
                const unit = item.content as ReadingMaterial;
                return (
                  <div key={activity.id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-bold text-slate-800">[Reading L{unit.level}] {unit.title}</h3>
                    </div>
                    <p className="text-sm text-gray-700 line-clamp-2">{unit.passage}</p>
                  </div>
                );
              }

              if ((item.content as ListeningMaterial).activityType === 'listening') {
                const mat = item.content as ListeningMaterial;
                return (
                  <div key={activity.id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-bold text-slate-800">[Listening L{mat.level}] {mat.title}</h3>
                    </div>
                    <p className="text-sm text-gray-700">문항 수: {mat.mcqs.length}</p>
                  </div>
                );
              }

              // vocab/grammar 요약 표시
              if ((item.content as any).options && (item.content as any).answer) {
                const q = item.content as any;
                return (
                  <div key={activity.id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <h3 className="font-bold text-slate-800">[{activity.type.toUpperCase()} L{activity.level}]</h3>
                    <p className="text-sm text-gray-700 truncate">{q.text}</p>
                  </div>
                );
              }

              return null;
            })}
          </div>
        ) : (
          <p className="text-center text-gray-500 py-10">해당 일차에 표시할 콘텐츠가 없습니다.</p>
        )}
      </main>
    </div>
  );
};

export default TeacherClassSessionPage;

