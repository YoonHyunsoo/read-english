import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { User, ClassInfo } from '../types';
import { getStudentProgressSummary, getStudentsForClass, getClassesForUser, getStudentsForTeacher, createUser, assignStudentToClass, removeStudentFromClass, getClassMembershipsForTeacher, updateUser } from '../services/api';
import { BackIcon, CloseIcon, PlusIcon } from '../components/icons';
import FooterNav from '../components/FooterNav';
// 글로벌 헤더는 App.tsx에서 렌더링됨. 페이지 내부에서는 중복 렌더링하지 않음
import PageIdentifier from '../components/DevTools/PageIdentifier';
import { createStudentEmail } from '../utils/domainUtils';

interface StudentsPageProps {
  teacher: User;
  classId?: string;
  onClose?: () => void;
}

interface GroupedStudents {
    [key: string]: {
        className: string;
        students: User[];
    };
}

const gradeOptions = [
    '초등 1', '초등 2', '초등 3', '초등 4', '초등 5', '초등 6',
    '중등 1', '중등 2', '중등 3',
    '고등 1', '고등 2', '고등 3',
    '기타'
];

const gradeToVocabLevelMap: { [key: string]: number } = {
    '초등 1': 1, '초등 2': 2, '초등 3': 2,
    '초등 4': 3, '초등 5': 3, '초등 6': 3,
    '중등 1': 4, '중등 2': 5, '중등 3': 6,
    '고등 1': 7, '고등 2': 8, '고등 3': 9,
};


interface StudentProgressItemProps {
    student: User;
    classId?: string;
    onRemove?: (student: User) => void;
    onDelete?: (student: User) => void;
    isCurrentUserAdmin?: boolean;
}

const StudentProgressItem: React.FC<StudentProgressItemProps> = ({ student, classId, onRemove, onDelete, isCurrentUserAdmin }) => {
    const [progress, setProgress] = useState<{ completedDays: number; totalDays: number } | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchProgress = async () => {
            if (!classId) {
                setIsLoading(false);
                return;
            }
            setIsLoading(true);
            try {
                const summary = await getStudentProgressSummary(student.email, classId);
                setProgress(summary);
            } finally {
                setIsLoading(false);
            }
        };
        fetchProgress();
    }, [student.email, classId]);

    return (
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
            <div className='flex-grow'>
                <div className="flex justify-between items-center">
                    <p className="font-bold text-slate-800">{student.name}</p>
                    <p className="text-sm text-gray-500">{student.grade}</p>
                </div>
                {classId && (
                  <div className="mt-2 text-sm text-gray-600">
                      {isLoading ? (
                          '진행률 불러오는 중...'
                      ) : progress && progress.totalDays > 0 ? (
                          `학습 진행률: ${progress.completedDays} / ${progress.totalDays} 일 완료`
                      ) : (
                          '할당된 커리큘럼이 없습니다.'
                      )}
                  </div>
                )}
            </div>
             <div className="flex items-center flex-shrink-0 ml-4 space-x-2">
                 {onRemove && (
                    <button onClick={() => onRemove(student)} className="text-xs font-semibold bg-orange-100 text-orange-700 px-3 py-1.5 rounded-lg hover:bg-orange-200 transition-colors">
                        제외
                    </button>
                )}
                {isCurrentUserAdmin && onDelete && (
                    <button onClick={() => onDelete(student)} className="text-xs font-semibold bg-red-100 text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-200 transition-colors">
                        계정 삭제
                    </button>
                )}
             </div>
        </div>
    );
};

const StudentWithClassesItem: React.FC<{
    student: User;
    assignedClasses: ClassInfo[];
    onDelete?: (student: User) => void;
    isCurrentUserAdmin?: boolean;
}> = ({ student, assignedClasses, onDelete, isCurrentUserAdmin }) => {
    return (
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-start justify-between mb-3">
                <div>
                    <p className="font-bold text-slate-800">{student.name}</p>
                    <p className="text-sm text-gray-500">{student.grade}</p>
                </div>
                {isCurrentUserAdmin && onDelete && (
                    <button onClick={() => onDelete(student)} className="text-xs font-semibold bg-red-100 text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-200 transition-colors">
                        계정 삭제
                    </button>
                )}
            </div>
            <div>
                <h4 className="text-xs font-semibold text-gray-600 mb-2">소속 클래스:</h4>
                {assignedClasses.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                        {assignedClasses.map(c => (
                            <span key={c.id} className="text-xs font-medium bg-gray-200 text-gray-800 px-2 py-1 rounded-full">{c.name}</span>
                        ))}
                    </div>
                ) : (
                    <p className="text-xs text-gray-500">배정된 클래스가 없습니다.</p>
                )}
            </div>
        </div>
    );
};

const StudentAssignmentItem: React.FC<{ student: User; onAssign: (student: User) => void; }> = ({ student, onAssign }) => (
    <li className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <div>
            <p className="font-semibold">{student.name}</p>
            <p className="text-xs text-gray-500">{student.grade}</p>
        </div>
        <button onClick={() => onAssign(student)} className="text-sm font-semibold bg-blue-600 text-white px-4 py-1.5 rounded-lg hover:bg-blue-700">
            추가
        </button>
    </li>
);

const AssignStudentModal: React.FC<{
    isOpen: boolean,
    onClose: () => void,
    onAssign: (student: User) => void,
    assignableStudents: User[],
    classGrades: string[]
}> = ({ isOpen, onClose, onAssign, assignableStudents, classGrades }) => {
    if (!isOpen) return null;

    const targetGradeStudents = assignableStudents.filter(s => s.grade && classGrades.includes(s.grade));
    const otherStudents = assignableStudents.filter(s => !s.grade || !classGrades.includes(s.grade));

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[70vh] flex flex-col">
                 <header className="flex items-center justify-between p-4 border-b border-gray-200">
                    <h2 className="text-lg font-bold text-slate-800">클래스 학생 추가</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200"><CloseIcon /></button>
                </header>
                <div className="p-4 overflow-y-auto space-y-4">
                    {assignableStudents.length > 0 ? (
                        <>
                            {targetGradeStudents.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-bold text-gray-500 mb-2">주요 학년 학생</h3>
                                    <ul className="space-y-2">
                                        {targetGradeStudents.map(student => (
                                            <StudentAssignmentItem key={student.email} student={student} onAssign={onAssign} />
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {otherStudents.length > 0 && (
                                <div>
                                    <h3 className={`text-sm font-bold text-gray-500 mb-2 ${targetGradeStudents.length > 0 ? 'border-t pt-4 mt-4 border-gray-200' : ''}`}>
                                        그 외 학생
                                    </h3>
                                    <ul className="space-y-2">
                                        {otherStudents.map(student => (
                                            <StudentAssignmentItem key={student.email} student={student} onAssign={onAssign} />
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </>
                    ) : (
                        <p className="text-center text-gray-500 py-6">클래스에 배정할 수 있는 학생이 없습니다.</p>
                    )}
                </div>
                 <footer className="p-4 flex justify-end gap-3 bg-gray-50 rounded-b-xl">
                    <button onClick={onClose} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-300">닫기</button>
                </footer>
            </div>
        </div>
    );
};

const AddStudentModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (studentData: Omit<User, 'email' | 'role' | 'teacherEmail' | 'institution'> & { vocabLevel: number; studentId?: string }) => Promise<{ success: boolean; error?: string }>;
    teacher: User;
}> = ({ isOpen, onClose, onSave, teacher }) => {
    const [name, setName] = useState('');
    const [studentId, setStudentId] = useState('');
    const [password, setPassword] = useState('');
    const [grade, setGrade] = useState('');
    const [vocabLevel, setVocabLevel] = useState('');
    const [error, setError] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setName('');
            setStudentId('');
            setPassword('');
            setGrade('');
            setVocabLevel('');
            setError('');
            setIsSaving(false);
        }
    }, [isOpen]);

    useEffect(() => {
        if (grade in gradeToVocabLevelMap) {
            setVocabLevel(String(gradeToVocabLevelMap[grade]));
        }
    }, [grade]);

    if (!isOpen) return null;

    const handleSave = async () => {
        if (!name || !studentId || !password || !grade || !vocabLevel) {
            setError('모든 필드를 입력해야 합니다.');
            return;
        }
        setError('');
        setIsSaving(true);
        try {
            const result = await onSave({ name, password, grade, studentId: studentId, vocabLevel: Number(vocabLevel) });
            if (result.success) {
                onClose();
            } else {
                setError(result.error || '학생 추가에 실패했습니다. 이메일이 중복되지 않는지 확인하세요.');
            }
        } catch (e: any) {
            setError(e.message || '예상치 못한 오류가 발생했습니다.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
                 <header className="flex items-center justify-between p-4 border-b border-gray-200">
                    <h2 className="text-lg font-bold text-slate-800">새 학생 추가</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200"><CloseIcon /></button>
                </header>
                 <div className="p-4 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full form-input" placeholder="학생 이름" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">아이디</label>
                        <input type="text" value={studentId} onChange={e => setStudentId(e.target.value)} className="w-full form-input" placeholder="로그인 시 사용할 아이디" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호</label>
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full form-input" placeholder="초기 비밀번호" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">학년</label>
                        <select value={grade} onChange={e => setGrade(e.target.value)} required className="w-full form-input">
                            <option value="" disabled>학년 선택</option>
                            {gradeOptions.map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Vocab 레벨(자율학습)</label>
                        <select value={vocabLevel} onChange={e => setVocabLevel(e.target.value)} required className="w-full form-input">
                            <option value="" disabled>레벨 선택</option>
                            {Array.from({ length: 9 }, (_, i) => i + 1).map(level => (
                                <option key={level} value={level}>Level {level}</option>
                            ))}
                        </select>
                    </div>
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                </div>
                 <footer className="p-4 flex justify-end gap-3 bg-gray-50 rounded-b-xl">
                    <button onClick={onClose} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-300">취소</button>
                    <button onClick={handleSave} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50" disabled={isSaving}>
                        {isSaving ? '저장 중...' : '저장'}
                    </button>
                </footer>
            </div>
             <style>{`.form-input { display: block; width: 100%; padding: 0.5rem 0.75rem; border: 1px solid #D1D5DB; border-radius: 0.5rem; }`}</style>
        </div>
    );
};


const StudentsPage: React.FC<StudentsPageProps> = ({ teacher, classId, onClose }) => {
    const [allStudents, setAllStudents] = useState<User[]>([]);
    const [classes, setClasses] = useState<ClassInfo[]>([]);
    const [memberships, setMemberships] = useState<{ class_id: string; user_email: string; }[]>([]);
    
    const [isLoading, setIsLoading] = useState(true);
    const [isAddingStudent, setIsAddingStudent] = useState(false);
    const [isAssigning, setIsAssigning] = useState(false);
    const [viewMode, setViewMode] = useState<'byClass' | 'byStudent'>('byClass');

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [fetchedClasses, teacherStudents, teacherMemberships] = await Promise.all([
                getClassesForUser(teacher),
                getStudentsForTeacher(teacher.institution || ''),
                getClassMembershipsForTeacher(teacher.institution || ''),
            ]);
            setClasses(fetchedClasses);
            setAllStudents(teacherStudents);
            setMemberships(teacherMemberships);
        } catch (error) {
            console.error("Failed to fetch student data:", error);
        } finally {
            setIsLoading(false);
        }
    }, [teacher]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);
    
    const currentClass = classId ? classes.find(c => c.id === classId) : null;
    
    // Students logic for specific class view
    const studentsInCurrentClass = classId ? allStudents.filter(s => memberships.some(m => m.user_email === s.email && m.class_id === classId)) : [];
    const assignableStudents = classId ? allStudents.filter(s => !memberships.some(m => m.user_email === s.email && m.class_id === classId)) : [];

    const handleRemoveStudentFromClass = async (studentToUnassign: User) => {
        if (classId && window.confirm(`${studentToUnassign.name} 학생을 이 클래스에서 제외하시겠습니까?`)) {
            const result = await removeStudentFromClass(studentToUnassign.email, classId);
            if (result.success) {
                fetchData();
            } else {
                alert('학생 제외에 실패했습니다. 다시 시도해 주세요.');
            }
        }
    };
    
    const handleAssignStudent = async (studentToAssign: User) => {
        if (classId) {
            await assignStudentToClass(studentToAssign.email, classId);
            fetchData();
        }
    };
    
     const handleSaveNewStudent = async (studentData: Omit<User, 'email' | 'role' | 'teacherEmail' | 'institution'> & { studentId?: string; vocabLevel: number; }): Promise<{ success: boolean; error?: string }> => {
        if (!teacher.institution) {
            return { success: false, error: '기관 정보가 없는 교사는 학생을 추가할 수 없습니다.' };
        }

        const studentEmail = await createStudentEmail(studentData.studentId || '', teacher.institution);

        const newStudent: User = {
            ...studentData,
            email: studentEmail,
            role: 'student',
            institution: teacher.institution,
            teacherEmail: teacher.email
        };

        const result = await createUser(newStudent, teacher);
        if (result.success) {
            await fetchData();
            return { success: true };
        } else {
            return { success: false, error: result.error || '학생 추가에 실패했습니다.' };
        }
    };
    
    const handleArchiveStudentAccount = async (studentToArchive: User) => {
        if (window.confirm(`${studentToArchive.name}(${studentToArchive.email}) 학생의 계정을 보관 처리하시겠습니까? 학생의 모든 학습 기록은 유지되지만, 더 이상 로그인할 수 없습니다.`)) {
            await updateUser({ ...studentToArchive, institution: 'ghost' }, teacher);
            fetchData();
        }
    };
    
    const studentToClassesMap = useMemo(() => {
        const map = new Map<string, ClassInfo[]>();
        if (viewMode === 'byStudent') {
            allStudents.forEach(student => {
                const studentClasses = memberships
                    .filter(m => m.user_email === student.email)
                    .map(m => classes.find(c => c.id === m.class_id))
                    .filter((c): c is ClassInfo => !!c);
                map.set(student.email, studentClasses);
            });
        }
        return map;
    }, [viewMode, allStudents, memberships, classes]);

    // Grouping logic for "All Students" view
    const groupedStudents = useMemo(() => {
        if (classId) return {};

        const groups: GroupedStudents = {};
        classes.forEach(c => {
            groups[c.id] = {
                className: c.name,
                students: allStudents.filter(s => memberships.some(m => m.user_email === s.email && m.class_id === c.id))
            };
        });
        const unassigned = allStudents.filter(s => !memberships.some(m => m.user_email === s.email));
        if (unassigned.length > 0) {
            groups['unassigned'] = { className: '배정되지 않은 학생', students: unassigned };
        }
        return groups;
    }, [classId, classes, allStudents, memberships]);
    
    const classOrder = ['unassigned', ...classes.map(c => c.id)];

    // Render logic
    if (isLoading) {
        return <div className="p-4 text-center text-gray-500">학생 정보를 불러오는 중...</div>;
    }
    
    if (classId && !currentClass) {
        return <div className="flex items-center justify-center h-full"><p className="text-gray-500">클래스 정보를 불러오는 중...</p></div>;
    }

    // View for managing a specific class's students
    if (classId && currentClass && onClose) {
        return (
            <>
                <PageIdentifier path="pages/StudentsPage.tsx" />
                <AssignStudentModal
                    isOpen={isAssigning}
                    onClose={() => setIsAssigning(false)}
                    onAssign={handleAssignStudent}
                    assignableStudents={assignableStudents}
                    classGrades={currentClass.grade}
                />

                <div className="flex flex-col h-full bg-gray-50">
                    <header className="flex items-center p-4 pt-4 pb-2 bg-white flex-shrink-0 relative border-b border-gray-200 h-[60px]">
                        <button onClick={onClose} className="absolute left-4 p-1 rounded-full hover:bg-gray-200" aria-label="Back to class list">
                            <div className="w-6 h-6 text-slate-700">
                               <BackIcon />
                            </div>
                        </button>
                        <h1 className="text-lg font-bold text-slate-800 text-center w-full truncate px-12">
                            {currentClass.name} 클래스 학생 관리
                        </h1>
                    </header>
                    
                    <main className="flex-grow p-4 overflow-y-auto">
                        {studentsInCurrentClass.length > 0 ? (
                            <div className="space-y-3">
                                {studentsInCurrentClass.map(student => (
                                    <StudentProgressItem key={student.email} student={student} classId={classId} onRemove={handleRemoveStudentFromClass} isCurrentUserAdmin={teacher.role === 'admin'} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center text-gray-500 py-10 px-4">
                                <p className="font-semibold">클래스에 학생이 없습니다.</p>
                                <p className="mt-2 text-sm">아래 버튼을 눌러 소속 학생을 추가하거나, '전체 학생 관리' 탭에서 새 학생을 등록하세요.</p>
                            </div>
                        )}
                    </main>

                    <footer className="p-4 border-t border-gray-200 bg-white">
                        <button
                            onClick={() => setIsAssigning(true)}
                            className="flex items-center justify-center gap-2 w-full bg-blue-600 text-white font-bold py-3 px-5 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                            disabled={assignableStudents.length === 0}
                        >
                            <PlusIcon className="w-5 h-5" />
                            <span>클래스 학생 추가</span>
                        </button>
                         {assignableStudents.length === 0 && <p className="text-xs text-center text-gray-500 mt-2">모든 학생이 이미 배정되었습니다.</p>}
                    </footer>
                </div>
            </>
        );
    }
    
    // Default view: All students grouped by class
    return (
        <div className="h-full flex flex-col bg-gray-50">
             <PageIdentifier path="pages/StudentsPage.tsx" />
             <AddStudentModal 
                isOpen={isAddingStudent}
                onClose={() => setIsAddingStudent(false)}
                onSave={handleSaveNewStudent}
                teacher={teacher}
            />
            <div className="p-1 bg-gray-200 rounded-lg flex mb-4">
                <button
                    onClick={() => setViewMode('byClass')}
                    className={`flex-1 text-sm font-semibold py-2 rounded-md transition-all ${viewMode === 'byClass' ? 'bg-white shadow-sm' : 'text-gray-600'}`}
                >
                    클래스별 보기
                </button>
                <button
                    onClick={() => setViewMode('byStudent')}
                    className={`flex-1 text-sm font-semibold py-2 rounded-md transition-all ${viewMode === 'byStudent' ? 'bg-white shadow-sm' : 'text-gray-600'}`}
                >
                    학생별 보기
                </button>
            </div>

            <main className="flex-1 overflow-y-auto">
            {allStudents.length > 0 ? (
                <div className="pb-24">
                    {viewMode === 'byClass' && (
                        <div className="space-y-6">
                            {classOrder.map(key => {
                                if (!groupedStudents[key] || groupedStudents[key].students.length === 0) return null;
                                const { className, students: groupStudents } = groupedStudents[key];
                                return (
                                    <div key={key}>
                                        <h2 className="text-base font-bold text-slate-800 mb-3">{className} ({groupStudents.length})</h2>
                                        <div className="space-y-3">
                                            {groupStudents.map(student => (
                                                <StudentProgressItem 
                                                    key={student.email} 
                                                    student={student} 
                                                    onDelete={handleArchiveStudentAccount} 
                                                    isCurrentUserAdmin={teacher.role === 'admin'} 
                                                />
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                     {viewMode === 'byStudent' && (
                        <div className="space-y-3">
                            {allStudents.map(student => (
                                <StudentWithClassesItem 
                                    key={student.email}
                                    student={student}
                                    assignedClasses={studentToClassesMap.get(student.email) || []}
                                    onDelete={handleArchiveStudentAccount}
                                    isCurrentUserAdmin={teacher.role === 'admin'}
                                />
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                 <div className="text-center text-gray-500 py-10">
                    <p className="font-semibold">등록된 학생이 없습니다.</p>
                    {teacher.role === 'admin' && (
                         <p className="mt-2 text-sm">아래 버튼을 눌러 새 학생을 추가하세요.</p>
                    )}
                    {teacher.role === 'admin' && (
                        <div className="mt-4">
                          <button onClick={() => setIsAddingStudent(true)} className="w-full max-w-sm mx-auto bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors">
                            학생 추가하기
                          </button>
                        </div>
                    )}
                </div>
            )}
            </main>
            {teacher.role === 'admin' && allStudents.length > 0 && (
              <footer className="p-4 border-t border-gray-200 bg-white sticky bottom-0">
                <button onClick={() => setIsAddingStudent(true)} className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors">
                  학생 추가하기
                </button>
              </footer>
            )}
        </div>
    );
};

export default StudentsPage;