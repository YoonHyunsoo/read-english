import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { User, StudentStudyLog, UserActionLog, ClassInfo } from '../types';
import { getStudyLogs, getUserActionLogs, getClassesForUser, getStudentsForClass } from '../services/api';
import { BackIcon, DocumentTextIcon, UserGroupIcon } from '../components/icons';
import FooterNav from '../components/FooterNav';
import Header from '../components/Header';
import PageIdentifier from '../components/DevTools/PageIdentifier';

interface TeacherLogsPageProps {
    currentUser: User;
    onClose: () => void;
}

type LogType = 'study' | 'user';

const TeacherLogsPage: React.FC<TeacherLogsPageProps> = ({ currentUser, onClose }) => {
    const [logType, setLogType] = useState<LogType>('study');
    const [studyLogs, setStudyLogs] = useState<StudentStudyLog[]>([]);
    const [userActionLogs, setUserActionLogs] = useState<UserActionLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchLogs = useCallback(async () => {
        setIsLoading(true);
        try {
            const [allStudyLogs, allUserActionLogs, teacherClasses] = await Promise.all([
                getStudyLogs(),
                getUserActionLogs(),
                getClassesForUser(currentUser),
            ]);

            const teacherClassIds = new Set(teacherClasses.map(c => c.id));
            const studentPromises = teacherClasses.map(c => getStudentsForClass(c.id));
            const studentsPerClass = await Promise.all(studentPromises);
            const teacherStudentEmails = new Set(studentsPerClass.flat().map(s => s.email));

            const filteredStudyLogs = allStudyLogs.filter(log =>
                log.class_id && teacherClassIds.has(log.class_id)
            );

            const filteredUserActionLogs = allUserActionLogs.filter(log => {
                const actorIsTeacher = log.actor_email === currentUser.email;
                const targetIsTeacherStudent = log.target_email && teacherStudentEmails.has(log.target_email);
                // A simple check for class-related actions performed by the teacher
                const isClassActionByTeacher = log.actor_email === currentUser.email && (log.details?.note?.includes('클래스') || log.details?.note?.includes('class'));

                return (log.institution === currentUser.institution) && (actorIsTeacher || targetIsTeacherStudent || isClassActionByTeacher);
            });

            setStudyLogs(filteredStudyLogs);
            setUserActionLogs(filteredUserActionLogs);

        } catch (error) {
            console.error("Failed to fetch logs for teacher:", error);
        } finally {
            setIsLoading(false);
        }
    }, [currentUser]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);
    
    const renderActionDetails = (log: UserActionLog) => {
        const details = log.details?.changes;
        if (details && Array.isArray(details) && details.length > 0) {
            return details.map((c: any, i: number) => `${c.field}: ${c.from} -> ${c.to}`).join(', ');
        }
        return log.details?.note || '-';
    };


    return (
        <div className="flex flex-col h-full bg-gray-50">
            <PageIdentifier path="pages/TeacherLogsPage.tsx" />
            {/* 상단 글로벌 헤더는 App.tsx에서 렌더링되므로 페이지 내부에서는 중복 렌더링하지 않음 */}
            <main className="flex-1 container mx-auto p-4 pb-20">
                <header className="flex items-center p-4 bg-white flex-shrink-0 relative border-b">
                    <button onClick={onClose} className="absolute left-4 p-1 rounded-full hover:bg-gray-200" aria-label="이전 화면으로 돌아가기">
                        <div className="w-6 h-6 text-slate-700">
                            <BackIcon />
                        </div>
                    </button>
                    <h1 className="text-lg font-bold text-center w-full">데이터 로그</h1>
                </header>

                <nav className="flex-shrink-0 bg-white shadow-sm">
                    <div className="flex justify-around">
                        <button
                            onClick={() => setLogType('study')}
                            className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 text-center text-xs font-medium border-b-4 transition-colors ${logType === 'study' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        >
                            <DocumentTextIcon className="w-5 h-5"/>
                            <span>학습 활동 로그</span>
                        </button>
                        <button
                            onClick={() => setLogType('user')}
                            className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 text-center text-xs font-medium border-b-4 transition-colors ${logType === 'user' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        >
                             <UserGroupIcon className="w-5 h-5"/>
                            <span>사용자 변경 로그</span>
                        </button>
                    </div>
                </nav>

                {isLoading ? (
                    <p className="text-center py-8 text-gray-500">로그를 불러오는 중...</p>
                ) : (
                    <div className="space-y-2">
                        {logType === 'study' && (
                            studyLogs.length > 0 ? (
                                studyLogs.map(log => (
                                    <div key={log.id} className="text-xs p-3 border rounded-lg bg-white shadow-sm">
                                        <div className="flex justify-between items-start">
                                            <p className="font-semibold text-slate-800">{log.activity_title}</p>
                                            <span className="text-gray-600 flex-shrink-0 ml-2">{new Date(log.timestamp).toLocaleString()}</span>
                                        </div>
                                        <p className="text-gray-700">
                                            <span className="font-medium">{log.user_name || log.user_email}</span>
                                            <span className="mx-1 text-gray-400">|</span>
                                            <span>{log.class_name || 'N/A'}</span>
                                        </p>
                                        <p className="text-blue-700 font-semibold mt-1">Score: {log.score}/{log.total_questions}</p>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-gray-500 py-6">학습 활동 로그가 없습니다.</p>
                            )
                        )}
                        {logType === 'user' && (
                            userActionLogs.length > 0 ? (
                                userActionLogs.map(log => (
                                     <div key={log.id} className="text-xs p-3 border rounded-lg bg-white shadow-sm">
                                        <div className="flex justify-between items-start">
                                            <p className="font-semibold text-slate-800 uppercase">{log.action_type.replace(/_/g, ' ')}</p>
                                            <span className="text-gray-600 flex-shrink-0 ml-2">{new Date(log.timestamp).toLocaleString()}</span>
                                        </div>
                                         <p className="text-gray-700">
                                            <span className="font-medium">Actor:</span> {log.actor_name || log.actor_email}
                                        </p>
                                        <p className="text-gray-700">
                                            <span className="font-medium">Target:</span> {log.target_name || log.target_email} ({log.target_role})
                                        </p>
                                        <p className="mt-1 text-blue-700"><span className="font-medium text-gray-700">Details:</span> {renderActionDetails(log)}</p>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-gray-500 py-6">사용자 변경 로그가 없습니다.</p>
                            )
                        )}
                    </div>
                )}
            </main>
            <FooterNav />
        </div>
    );
};

export default TeacherLogsPage;