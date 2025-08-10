

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { User, UserRole, ClassInfo, StudentStudyLog, UserActionLog } from '../types';
import { fetchAllUsers, updateUser, getStudyLogs, getUserActionLogs } from '../services/api';
import { BackIcon, UserGroupIcon, DocumentTextIcon, PencilIcon, TrashIcon, CloseIcon } from '../components/icons';
import { fetchGhostInstitutions, fetchArchivedUsers, restoreUserAccount, restoreInstitutionUsers } from '../services/api';
import { Modal, Button } from '../components/DesignSystem';
import PageIdentifier from '../components/DevTools/PageIdentifier';

interface AdminPanelPageProps {
    currentUser: User;
    onClose: (updatedUser?: User) => void;
}

type AdminTab = 'institutions' | 'archive' | 'logs';
type LogsTab = 'progress' | 'users';

const TabButton: React.FC<{ label: string; isActive: boolean; onClick: () => void; icon: React.ReactNode; }> = ({ label, isActive, onClick, icon }) => (
    <button
        onClick={onClick}
        className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 text-center text-xs font-medium border-b-4 transition-colors ${isActive ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
    >
        <div className="w-5 h-5">{icon}</div>
        <span>{label}</span>
    </button>
);

const EditUserRoleModal: React.FC<{
    user: User;
    isOpen: boolean;
    onClose: () => void;
    onSave: (user: User, newRole: UserRole) => void;
}> = ({ user, isOpen, onClose, onSave }) => {
    const [newRole, setNewRole] = useState<UserRole>(user.role);

    useEffect(() => {
        if(isOpen) setNewRole(user.role);
    }, [isOpen, user.role]);

    if (!isOpen) return null;

    const handleSave = () => {
        onSave(user, newRole);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[60] p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
                <header className="flex items-center justify-between p-4 border-b">
                    <h3 className="font-bold text-lg">역할 변경: {user.name}</h3>
                    <button onClick={onClose}><CloseIcon /></button>
                </header>
                <div className="p-4">
                    <p className="text-sm mb-2">새로운 역할을 선택하세요:</p>
                    <select value={newRole} onChange={(e) => setNewRole(e.target.value as UserRole)} className="w-full p-2 border rounded-md">
                        <option value="teacher">교사</option>
                        <option value="admin">기관 관리자</option>
                    </select>
                </div>
                <footer className="p-4 flex justify-end gap-2 bg-gray-50">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md">취소</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-md">저장</button>
                </footer>
            </div>
        </div>
    );
};

const AdminDelegationConfirmModal: React.FC<{
    onConfirm: () => void;
    onCancel: () => void;
}> = ({ onConfirm, onCancel }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[70] p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
            <div className="p-6">
                <h3 className="font-bold text-lg text-center mb-2">관리자 권한 위임</h3>
                <p className="text-sm text-center text-gray-600 mb-6">
                    관리자는 기관 당 1명만 지정할 수 있습니다. 권한을 위임하면 현재 계정의 관리자 권한은 사라집니다. 계속하시겠습니까?
                </p>
            </div>
            <footer className="p-4 flex justify-end gap-2 bg-gray-50">
                <button onClick={onCancel} className="px-4 py-2 bg-gray-200 rounded-md">취소</button>
                <button onClick={onConfirm} className="px-4 py-2 bg-orange-500 text-white rounded-md">위임하기</button>
            </footer>
        </div>
    </div>
);

const TeacherManagementPanel: React.FC<{ currentUser: User, onClosePanel: (updatedUser?: User) => void }> = ({ currentUser, onClosePanel }) => {
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [institutions, setInstitutions] = useState<string[]>([]);
    const [selectedInstitution, setSelectedInstitution] = useState<string>('all');
    const [userToEdit, setUserToEdit] = useState<User | null>(null);
    const [delegationConfirm, setDelegationConfirm] = useState<{user: User, newRole: UserRole} | null>(null);

    const fetchUsers = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await fetchAllUsers();
            if (result.success) {
                setAllUsers(result.data);
                const uniqueInstitutions = [...new Set(result.data.map(u => u.institution).filter((i): i is string => !!i && i !== 'ghost'))];
                setInstitutions(uniqueInstitutions);
            } else {
                 console.error("Failed to fetch users for admin panel", result.error);
                 setError("교사 목록을 불러오는 데 실패했습니다.");
            }
        } catch (e) {
            console.error("Unexpected error fetching users for admin panel:", e);
            setError("교사 목록을 불러오는 데 실패했습니다.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);
    
    const handleEdit = (user: User) => {
        if (user.email === currentUser.email) {
            alert("자신의 역할은 변경할 수 없습니다.");
            return;
        }
        setUserToEdit(user);
    };
    
    const handleRoleChange = (user: User, newRole: UserRole) => {
        setUserToEdit(null);
        if (newRole === 'admin' && currentUser.role === 'admin' && user.institution === currentUser.institution && user.email !== currentUser.email) {
            setDelegationConfirm({ user, newRole });
        } else {
            updateUser({ ...user, role: newRole }, currentUser).then(fetchUsers);
        }
    };
    
    const handleConfirmDelegation = async () => {
        if (!delegationConfirm) return;
        try {
            await updateUser({ ...delegationConfirm.user, role: 'admin' }, currentUser);
            const updatedCurrentUser = { ...currentUser, role: 'teacher' as UserRole };
            await updateUser(updatedCurrentUser, currentUser);
            setDelegationConfirm(null);
            alert('관리자 권한이 위임되었습니다. 관리자 패널을 닫습니다.');
            onClosePanel(updatedCurrentUser);
        } catch (error) {
            console.error("Delegation failed:", error);
            alert("권한 위임에 실패했습니다.");
            fetchUsers();
        }
    };

    const handleArchive = async (userToArchive: User) => {
        if (userToArchive.email === currentUser.email) {
            alert("자신의 계정은 보관 처리할 수 없습니다.");
            return;
        }

        if (userToArchive.role === 'admin' && userToArchive.institution) {
            const adminsInInst = allUsers.filter(u => 
                u.role === 'admin' && 
                u.institution === userToArchive.institution &&
                u.institution !== 'ghost'
            );
            
            if (adminsInInst.length <= 1) {
                alert("기관의 마지막 관리자 계정은 보관 처리할 수 없습니다. 다른 교사에게 관리자 권한을 먼저 위임해주세요.");
                return;
            }
        }
    
        if (window.confirm(`${userToArchive.name}(${userToArchive.email}) 교사 계정을 보관 처리하시겠습니까? 계정은 삭제되지 않으며, 소속 기관에서만 제외됩니다.`)) {
            await updateUser({ ...userToArchive, institution: 'ghost' }, currentUser);
            fetchUsers();
        }
    };

    const filteredUsers = useMemo(() => {
        let users = allUsers.filter(u => (u.role === 'teacher' || u.role === 'admin') && u.status !== 'ghost');
        if (currentUser.role === 'admin') {
            users = users.filter(u => u.institution === currentUser.institution);
        } else if (currentUser.role === 'master' && selectedInstitution !== 'all') {
            users = users.filter(u => u.institution === selectedInstitution);
        }
        return users;
    }, [allUsers, currentUser, selectedInstitution]);

    if (isLoading) return <p className="text-center p-4">사용자 정보 로딩 중...</p>;
    if (error) return <p className="text-center p-4 text-red-500">{error}</p>;

    return (
        <div className="p-4 space-y-4">
            {currentUser.role === 'master' && (
                <div>
                    <label htmlFor="institution-filter" className="text-sm font-medium text-gray-700">기관 필터:</label>
                    <select id="institution-filter" value={selectedInstitution} onChange={e => setSelectedInstitution(e.target.value)} className="w-full p-2 mt-1 border rounded-md bg-white">
                        <option value="all">모든 기관</option>
                        {institutions.map(inst => <option key={inst} value={inst}>{inst}</option>)}
                    </select>
                </div>
            )}
            <div className="space-y-3">
                {filteredUsers.length > 0 ? filteredUsers.map(user => {
                    const isCurrentUserRow = user.email === currentUser.email;
                    return (
                        <div key={user.email} className={`p-3 rounded-lg border flex justify-between items-center transition-colors ${isCurrentUserRow ? 'bg-blue-50 border-blue-200' : 'bg-white'}`}>
                            <div>
                                <p className="font-bold text-sm">{user.name} <span className="text-xs font-normal text-gray-500">({user.role === 'admin' ? '관리자' : '교사'})</span></p>
                                <p className="text-xs text-gray-600">{user.email}</p>
                                <p className="text-xs text-blue-700 font-semibold">{user.institution}</p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleEdit(user)}
                                    title="역할 변경"
                                    className="p-2 text-gray-500 hover:text-blue-600 disabled:text-gray-300 disabled:cursor-not-allowed"
                                    disabled={isCurrentUserRow}
                                >
                                    <PencilIcon />
                                </button>
                                <button
                                    onClick={() => handleArchive(user)}
                                    title="계정 삭제"
                                    className="p-2 text-gray-500 hover:text-red-600 disabled:text-gray-300 disabled:cursor-not-allowed"
                                    disabled={isCurrentUserRow}
                                >
                                    <TrashIcon />
                                </button>
                            </div>
                        </div>
                    );
                }) : <p className="text-center text-gray-500 py-6">해당하는 교사 계정이 없습니다.</p>}
            </div>
            {userToEdit && <EditUserRoleModal user={userToEdit} isOpen={!!userToEdit} onClose={() => setUserToEdit(null)} onSave={handleRoleChange} />}
            {delegationConfirm && <AdminDelegationConfirmModal onConfirm={handleConfirmDelegation} onCancel={() => setDelegationConfirm(null)} />}
        </div>
    );
};

const ProgressSummary: React.FC<{ logs: StudentStudyLog[] }> = ({ logs }) => {
    const summary = useMemo(() => {
        if (!logs || logs.length === 0) {
            return { totalActivities: 0, averageScore: 0, activeStudents: 0 };
        }
        
        const totalActivities = logs.length;
        
        const totalScoreSum = logs.reduce((sum, log) => {
            if (log.score !== null && log.total_questions !== null && log.total_questions > 0) {
                return sum + (log.score / log.total_questions) * 100;
            }
            return sum;
        }, 0);
        const averageScore = totalActivities > 0 ? Math.round(totalScoreSum / totalActivities) : 0;
        
        const activeStudents = new Set(logs.map(log => log.user_email)).size;

        return { totalActivities, averageScore, activeStudents };
    }, [logs]);

    return (
        <div className="p-4 bg-white rounded-xl border border-gray-200 mb-4">
            <h3 className="text-base font-bold text-slate-800 text-center mb-4">학습 현황 요약</h3>
            <div className="flex justify-around text-center">
                <div>
                    <p className="text-2xl font-bold text-slate-800">{summary.totalActivities}</p>
                    <p className="text-sm text-gray-500">전체 학습활동</p>
                </div>
                <div>
                    <p className="text-2xl font-bold text-slate-800">{summary.averageScore}%</p>
                    <p className="text-sm text-gray-500">평균 점수</p>
                </div>
                <div>
                    <p className="text-2xl font-bold text-slate-800">{summary.activeStudents}</p>
                    <p className="text-sm text-gray-500">참여 학생 수</p>
                </div>
            </div>
        </div>
    );
};

const DataLogsPanel: React.FC<{ currentUser: User }> = ({ currentUser }) => {
    const [activeLogsTab, setActiveLogsTab] = useState<LogsTab>('progress');
    const [studyLogs, setStudyLogs] = useState<StudentStudyLog[]>([]);
    const [userActionLogs, setUserActionLogs] = useState<UserActionLog[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    
    const [institutions, setInstitutions] = useState<string[]>([]);
    const [selectedInstitution, setSelectedInstitution] = useState<string>('all');

    const fetchLogs = useCallback(async () => {
        setIsLoading(true);
        try {
            const [fetchedStudyLogs, fetchedUserActionLogs] = await Promise.all([
                getStudyLogs(),
                getUserActionLogs(),
            ]);
            setStudyLogs(fetchedStudyLogs);
            setUserActionLogs(fetchedUserActionLogs);

            if (currentUser.role === 'master') {
                const uniqueInstitutions = [...new Set(
                    [...fetchedStudyLogs.map(l => l.institution), ...fetchedUserActionLogs.map(l => l.institution)]
                    .filter((i): i is string => !!i && i !== 'ghost')
                )];

                const hasIndividualLogs = [...fetchedStudyLogs, ...fetchedUserActionLogs].some(l => l.institution === null);
                
                let finalInstitutions = uniqueInstitutions;
                if(hasIndividualLogs) {
                    finalInstitutions = ['INDIVIDUAL_USERS_FILTER', ...uniqueInstitutions];
                }
                setInstitutions(finalInstitutions);
            }
        } catch (error) {
            console.error("Failed to fetch logs:", error);
        } finally {
            setIsLoading(false);
        }
    }, [currentUser.role]);
    
    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const filteredStudyLogs = useMemo(() => {
        let logsToFilter = studyLogs;
        if (currentUser.role === 'admin') {
            logsToFilter = studyLogs.filter(log => log.institution === currentUser.institution);
        } else if (currentUser.role === 'master' && selectedInstitution !== 'all') {
            if (selectedInstitution === 'INDIVIDUAL_USERS_FILTER') {
                logsToFilter = studyLogs.filter(log => log.institution === null);
            } else {
                logsToFilter = studyLogs.filter(log => log.institution === selectedInstitution);
            }
        }
        return logsToFilter;
    }, [studyLogs, selectedInstitution, currentUser]);

    const filteredUserActionLogs = useMemo(() => {
        let logsToFilter = userActionLogs;
        if (currentUser.role === 'admin') {
            logsToFilter = userActionLogs.filter(log => log.institution === currentUser.institution)
        } else if (currentUser.role === 'master' && selectedInstitution !== 'all') {
             if (selectedInstitution === 'INDIVIDUAL_USERS_FILTER') {
                logsToFilter = userActionLogs.filter(log => log.institution === null);
            } else {
                logsToFilter = userActionLogs.filter(log => log.institution === selectedInstitution);
            }
        }
        return logsToFilter;
    }, [userActionLogs, selectedInstitution, currentUser]);

    const renderActionDetails = (log: UserActionLog) => {
        const details = log.details?.changes;
        if(details && Array.isArray(details) && details.length > 0) {
            return details.map((c: any, i: number) => `${c.field}: ${c.from} -> ${c.to}`).join(', ');
        }
        return log.details?.note || '-';
    };

    return (
        <div>
            <div className="flex justify-around border-b">
                <button onClick={() => setActiveLogsTab('progress')} className={`py-2 px-4 text-sm font-semibold ${activeLogsTab === 'progress' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}>학습 활동 로그</button>
                <button onClick={() => setActiveLogsTab('users')} className={`py-2 px-4 text-sm font-semibold ${activeLogsTab === 'users' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}>사용자 변경 로그</button>
            </div>
             {currentUser.role === 'master' && (
                <div className="p-4 border-b">
                    <label htmlFor="log-institution-filter" className="text-sm font-medium text-gray-700">필터:</label>
                    <select id="log-institution-filter" value={selectedInstitution} onChange={e => setSelectedInstitution(e.target.value)} className="w-full p-2 mt-1 border rounded-md bg-white">
                        <option value="all">전체</option>
                        {institutions.map(inst => (
                            <option key={inst} value={inst}>
                                {inst === 'INDIVIDUAL_USERS_FILTER' ? '개인 사용자' : inst}
                            </option>
                        ))}
                    </select>
                </div>
            )}
            <div className="p-4">
                {isLoading ? <p className="text-center py-8">로그를 불러오는 중...</p> : (
                    <>
                        {activeLogsTab === 'progress' && (
                            <>
                                <ProgressSummary logs={filteredStudyLogs} />
                                <div className="space-y-2">
                                    {filteredStudyLogs.length > 0 ? filteredStudyLogs.map(log => (
                                        <div key={log.id} className="text-xs p-3 border rounded-lg bg-white shadow-sm">
                                            <div className="flex justify-between items-start">
                                                <p className="font-semibold text-slate-800">{log.activity_title}</p>
                                                <span className="text-gray-600 flex-shrink-0 ml-2">{new Date(log.timestamp).toLocaleString()}</span>
                                            </div>
                                            <p className="text-gray-700">
                                                <span className="font-medium">{log.user_name || log.user_email}</span>
                                                <span className="mx-1 text-gray-400">|</span>
                                                <span>{log.institution || '개인'}</span>
                                                <span className="mx-1 text-gray-400">|</span>
                                                <span>{log.class_name || 'N/A'}</span>
                                            </p>
                                            <p className="text-blue-700 font-semibold mt-1">Score: {log.score}/{log.total_questions}</p>
                                        </div>
                                    )) : <p className="text-center text-gray-500 py-6">학습 활동 로그가 없습니다.</p>}
                                </div>
                            </>
                        )}
                         {activeLogsTab === 'users' && (
                             <div className="space-y-2">
                                {filteredUserActionLogs.length > 0 ? filteredUserActionLogs.map(log => (
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
                                         <p className="text-gray-700">
                                            <span className="font-medium">Institution:</span> {log.institution || '개인'}
                                        </p>
                                        <p className="mt-1 text-blue-700"><span className="font-medium text-gray-700">Details:</span> {renderActionDetails(log)}</p>
                                    </div>
                                )) : <p className="text-center text-gray-500 py-6">사용자 변경 로그가 없습니다.</p>}
                            </div>
                         )}
                    </>
                )}
            </div>
        </div>
    );
};


const AdminPanelPage: React.FC<AdminPanelPageProps> = ({ currentUser, onClose }) => {
    const [activeTab, setActiveTab] = useState<AdminTab>(currentUser.role === 'master' ? 'institutions' : 'teachers');

    return (
        <div className="flex flex-col h-full bg-gray-50">
            <PageIdentifier path="pages/AdminPanelPage.tsx" />
            <header className="flex items-center p-4 bg-white flex-shrink-0 relative border-b">
                <button onClick={() => onClose()} className="absolute left-4 p-1 rounded-full hover:bg-gray-200" aria-label="이전 화면으로 돌아가기">
                    <div className="w-6 h-6 text-slate-700">
                        <BackIcon />
                    </div>
                </button>
                <h1 className="text-lg font-bold text-center w-full">{currentUser.role === 'master' ? '마스터 패널' : '어드민 패널'}</h1>
            </header>
            <nav className="flex-shrink-0 bg-white shadow-sm">
                <div className="flex justify-around">
                    {currentUser.role === 'master' && (
                        <>
                          <TabButton label="기관 관리" icon={<DocumentTextIcon />} isActive={activeTab === 'institutions'} onClick={() => setActiveTab('institutions')} />
                          <TabButton label="보관 관리" icon={<DocumentTextIcon />} isActive={activeTab === 'archive'} onClick={() => setActiveTab('archive')} />
                        </>
                    )}
                    <TabButton label="데이터 로그" icon={<DocumentTextIcon />} isActive={activeTab === 'logs'} onClick={() => setActiveTab('logs')} />
                </div>
            </nav>
            <main className="flex-grow overflow-y-auto">
                {activeTab === 'institutions' && currentUser.role === 'master' && <InstitutionManagementPanel currentUser={currentUser} />}
                {activeTab === 'archive' && currentUser.role === 'master' && <ArchiveManagementPanel currentUser={currentUser} />}
                {activeTab === 'logs' && <DataLogsPanel currentUser={currentUser} />}
            </main>
        </div>
    );
};

export default AdminPanelPage;

// --- Master: Institution Management ---
import { fetchAllUsers, archiveInstitution } from '../services/api';

const InstitutionManagementPanel: React.FC<{ currentUser: User }> = ({ currentUser }) => {
    const [institutions, setInstitutions] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedInstitution, setSelectedInstitution] = useState<string | null>(null);
    const [details, setDetails] = useState<{ admins: User[]; teachers: User[]; students: User[] } | null>(null);
    const [query, setQuery] = useState('');
    const [sortAsc, setSortAsc] = useState(true);
    const [confirmUser, setConfirmUser] = useState<User | null>(null);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [instToArchive, setInstToArchive] = useState<string | null>(null);
    const [isInstConfirmOpen, setIsInstConfirmOpen] = useState(false);

    const loadInstitutions = useCallback(async () => {
        setIsLoading(true);
        const res = await fetchAllUsers();
        if (res.success) {
            const names = [...new Set(res.data.map(u => u.institution).filter((i): i is string => !!i && i !== 'ghost'))];
            setInstitutions(names);
        }
        setIsLoading(false);
    }, []);

    useEffect(() => { loadInstitutions(); }, [loadInstitutions]);

    const openDetails = async (inst: string) => {
        setSelectedInstitution(inst);
        const res = await fetchAllUsers();
        if (res.success) {
            const admins = res.data.filter(u => u.institution === inst && u.role === 'admin');
            const teachers = res.data.filter(u => u.institution === inst && u.role === 'teacher');
            const students = res.data.filter(u => u.institution === inst && u.role === 'student');
            setDetails({ admins, teachers, students });
        }
    };

    const openArchiveInstitutionModal = (inst: string) => {
        setInstToArchive(inst);
        setIsInstConfirmOpen(true);
    };
    const confirmArchiveInstitution = async () => {
        if (!instToArchive) return;
        const res = await archiveInstitution(instToArchive, currentUser);
        setIsInstConfirmOpen(false);
        setInstToArchive(null);
        if (res.success) {
            setSelectedInstitution(null);
            setDetails(null);
            loadInstitutions();
        } else {
            alert('보관 처리에 실패했습니다.');
        }
    };

    const filtered = institutions
        .filter(n => n.toLowerCase().includes(query.toLowerCase()))
        .sort((a, b) => sortAsc ? a.localeCompare(b) : b.localeCompare(a));

    const requestArchiveUser = (user: User) => {
        setConfirmUser(user);
        setIsConfirmOpen(true);
    };

    const confirmArchiveUser = async () => {
        if (!confirmUser) return;
        await updateUser({ ...confirmUser, institution: 'ghost' }, currentUser);
        setIsConfirmOpen(false);
        setConfirmUser(null);
        if (selectedInstitution) await openDetails(selectedInstitution);
    };

    const canDeleteAdmins = (details?.teachers?.length || 0) === 0;

    return (
        <div className="p-4 space-y-4">
            <div className="flex items-center gap-2">
                <input value={query} onChange={e => setQuery(e.target.value)} placeholder="기관 검색" className="flex-1 p-2 border rounded-md" />
                <button onClick={() => setSortAsc(!sortAsc)} className="px-3 py-2 text-sm border rounded-md bg-white">
                    {sortAsc ? 'A→Z' : 'Z→A'}
                </button>
            </div>
            {isLoading ? <p className="text-center">기관 목록을 불러오는 중...</p> : (
                filtered.length > 0 ? (
                    <div className="space-y-2">
                        {filtered.map(inst => (
                            <div key={inst} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                                <span className="font-semibold text-slate-800">{inst}</span>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => openDetails(inst)} className="text-sm font-semibold text-blue-600 hover:underline">상세</button>
                                    <button onClick={() => openArchiveInstitutionModal(inst)} className="text-sm font-semibold text-red-600 hover:underline">삭제</button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : <p className="text-center text-gray-500 py-6">등록된 기관이 없습니다.</p>
            )}

            {selectedInstitution && details && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[80vh] overflow-y-auto">
                        <header className="p-4 border-b">
                            <h3 className="text-lg font-bold">기관 상세: {selectedInstitution}</h3>
                            <p className="text-xs text-gray-500 mt-1">이 화면에서 관리자 권한 위임/계정 삭제를 처리할 수 있습니다.</p>
                        </header>
                        <div className="p-4 space-y-4">
                            <div>
                                <h4 className="font-semibold text-slate-800 mb-1">관리자</h4>
                                <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                                    {details.admins.length > 0 ? details.admins.map(u => (
                                        <li key={u.email} className="flex items-center justify-between gap-2">
                                            <span>{u.name} ({u.email})</span>
                                            <div className="flex items-center gap-2">
                                                <button onClick={async () => { await updateUser({ ...u, role: 'admin' }, currentUser); openDetails(selectedInstitution!); }} className="text-xs px-2 py-1 rounded bg-indigo-100 text-indigo-700">유지</button>
                                                <button
                                                    onClick={async () => {
                                                        if (details.admins.length <= 1) {
                                                            alert('해당 기관의 관리자가 1명뿐입니다. 먼저 다른 교사에게 관리자 권한을 위임한 뒤 다운그레이드하세요.');
                                                            return;
                                                        }
                                                        await updateUser({ ...u, role: 'teacher' }, currentUser);
                                                        openDetails(selectedInstitution!);
                                                    }}
                                                    className="text-xs px-2 py-1 rounded bg-amber-100 text-amber-700"
                                                >교사로 변경</button>
                                                <button
                                                    disabled={!canDeleteAdmins}
                                                    title={canDeleteAdmins ? '관리자 삭제' : '선생님을 모두 삭제한 후 관리자 삭제가 가능합니다.'}
                                                    onClick={() => requestArchiveUser(u)}
                                                    className={`text-xs px-2 py-1 rounded ${canDeleteAdmins ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                                                >계정 삭제</button>
                                            </div>
                                        </li>
                                    )) : <li>없음</li>}
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-semibold text-slate-800 mb-1">선생님</h4>
                                <ul className="list-disc pl-5 text-sm text-gray-700">
                                    {details.teachers.length > 0 ? details.teachers.map(u => (
                                        <li key={u.email} className="flex items-center justify-between gap-2">
                                            <span>{u.name} ({u.email})</span>
                                            <span className="flex items-center gap-2">
                                                <button onClick={async () => { await updateUser({ ...u, role: 'admin' }, currentUser); openDetails(selectedInstitution!); }} className="text-xs px-2 py-1 rounded bg-indigo-100 text-indigo-700">관리자 위임</button>
                                                <button onClick={() => requestArchiveUser(u)} className="text-xs px-2 py-1 rounded bg-red-100 text-red-700">계정 삭제</button>
                                            </span>
                                        </li>
                                    )) : <li>없음</li>}
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-semibold text-slate-800 mb-1">학생</h4>
                                <ul className="list-disc pl-5 text-sm text-gray-700">
                                    {details.students.length > 0 ? details.students.map(u => (
                                        <li key={u.email} className="flex items-center justify-between gap-2">
                                            <span>{u.name} ({u.email})</span>
                                            <button onClick={() => requestArchiveUser(u)} className="text-xs px-2 py-1 rounded bg-red-100 text-red-700">계정 삭제</button>
                                        </li>
                                    )) : <li>없음</li>}
                                </ul>
                            </div>
                        </div>
                        <footer className="p-4 border-t flex justify-end gap-2">
                            <button onClick={() => setSelectedInstitution(null)} className="px-4 py-2 rounded-md bg-gray-200">닫기</button>
                        </footer>
                    </div>
                </div>
            )}

            {/* Confirm archive modal */}
            <Modal isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} title="계정 보관 처리 확인" size="sm">
                <p className="text-sm text-slate-700 mb-5">삭제하시겠습니까? 해당 계정은 ghost계정으로 전환됩니다.</p>
                <div className="flex justify-end gap-2">
                    <Button variant="secondary" size="sm" onClick={() => setIsConfirmOpen(false)}>취소</Button>
                    <Button variant="primary" size="sm" onClick={confirmArchiveUser}>확인</Button>
                </div>
            </Modal>

            {/* Confirm institution archive modal */}
            <Modal isOpen={isInstConfirmOpen} onClose={() => setIsInstConfirmOpen(false)} title="기관 보관 처리 확인" size="sm">
                <p className="text-sm text-slate-700 mb-5">{instToArchive} 기관을 보관 처리하시겠습니까? 소속 모든 관리자/선생님/학생 계정은 해당 기관에서 분리되어 ghost 상태가 됩니다.</p>
                <div className="flex justify-end gap-2">
                    <Button variant="secondary" size="sm" onClick={() => setIsInstConfirmOpen(false)}>취소</Button>
                    <Button variant="primary" size="sm" onClick={confirmArchiveInstitution}>확인</Button>
                </div>
            </Modal>
        </div>
    );
};

// --- Master: Archive Management ---
const ArchiveManagementPanel: React.FC<{ currentUser: User }> = ({ currentUser }) => {
    const [ghostInstitutions, setGhostInstitutions] = useState<{ institution_name: string; origin_institution_name: string | null; domain_name: string; }[]>([]);
    const [archivedUsers, setArchivedUsers] = useState<User[]>([]);
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [restoreEmail, setRestoreEmail] = useState<string | null>(null);
    const [newEmail, setNewEmail] = useState<string>('');
    const [newInstitution, setNewInstitution] = useState<string>('');

    const load = useCallback(async () => {
        setLoading(true);
        const [gi, au] = await Promise.all([
            fetchGhostInstitutions(),
            fetchArchivedUsers(),
        ]);
        setGhostInstitutions(gi);
        setArchivedUsers(au);
        setLoading(false);
    }, []);

    useEffect(() => { load(); }, [load]);

    const filteredInst = ghostInstitutions.filter(i => i.institution_name.toLowerCase().includes(query.toLowerCase()));
    const filteredUsers = archivedUsers.filter(u =>
        (u.email.toLowerCase().includes(query.toLowerCase()) || (u.originalEmail || '').toLowerCase().includes(query.toLowerCase()))
    );

    const openRestoreUser = (u: User) => {
        setRestoreEmail(u.email);
        setNewEmail(u.originalEmail || '');
        const guessedInst = (u.institution && u.institution.endsWith('_ghost')) ? u.institution.slice(0, -6) : (u.institution || '');
        setNewInstitution(guessedInst);
    };

    const submitRestoreUser = async () => {
        if (!restoreEmail) return;
        const res = await restoreUserAccount(restoreEmail, newInstitution, newEmail || null, currentUser);
        if (!res.success) {
            alert(res.error || '복원 실패');
            return;
        }
        setRestoreEmail(null);
        await load();
    };

    const restoreInstitution = async (instGhost: string) => {
        const res = await restoreInstitutionUsers(instGhost, currentUser);
        if (res.success) alert(`복원 완료: ${res.restored}건, 실패: ${res.failed}건`);
        await load();
    };

    return (
        <div className="p-4 space-y-4">
            <div className="flex items-center gap-2">
                <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="보관 기관/계정 검색" className="flex-1 p-2 border rounded-md" />
            </div>
            {loading ? <p className="text-center">로딩 중...</p> : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <h3 className="font-bold text-slate-800 mb-1">보관된 기관</h3>
                        {filteredInst.length === 0 ? <p className="text-gray-500 text-sm">보관된 기관이 없습니다.</p> : filteredInst.map(inst => (
                            <div key={inst.institution_name} className="p-3 bg-white rounded-lg border flex items-center justify-between">
                                <div>
                                    <p className="font-semibold text-slate-800">{inst.institution_name}</p>
                                    <p className="text-xs text-gray-500">원 기관: {inst.origin_institution_name || '-'}</p>
                                </div>
                                <button onClick={()=>restoreInstitution(inst.institution_name)} className="text-sm font-semibold text-blue-600 hover:underline">기관 복원</button>
                            </div>
                        ))}
                    </div>
                    <div className="space-y-2">
                        <h3 className="font-bold text-slate-800 mb-1">보관된 계정</h3>
                        {filteredUsers.length === 0 ? <p className="text-gray-500 text-sm">보관된 계정이 없습니다.</p> : filteredUsers.map(u => (
                            <div key={u.email} className="p-3 bg-white rounded-lg border">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-semibold text-slate-800">{u.name} <span className="text-xs text-gray-500 ml-1">({u.role})</span></p>
                                        <p className="text-xs text-gray-600">현재: {u.email}</p>
                                        {u.originalEmail && <p className="text-xs text-gray-400">원본: {u.originalEmail}</p>}
                                    </div>
                                    <button onClick={()=>openRestoreUser(u)} className="text-sm font-semibold text-blue-600 hover:underline">복원</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Restore user modal */}
            <Modal isOpen={!!restoreEmail} onClose={()=>setRestoreEmail(null)} title="계정 복원" size="sm">
                <div className="space-y-3">
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">복원할 기관명</label>
                        <input value={newInstitution} onChange={e=>setNewInstitution(e.target.value)} className="w-full p-2 border rounded-md" placeholder="기관명" />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">새 이메일(선택, 미입력 시 원본 이메일 시도)</label>
                        <input value={newEmail} onChange={e=>setNewEmail(e.target.value)} className="w-full p-2 border rounded-md" placeholder="새 이메일 (충돌 시 수정)" />
                    </div>
                    <div className="flex justify-end gap-2">
                        <button onClick={()=>setRestoreEmail(null)} className="px-3 py-2 bg-gray-200 rounded-md">취소</button>
                        <button onClick={submitRestoreUser} className="px-3 py-2 bg-blue-600 text-white rounded-md">복원</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};