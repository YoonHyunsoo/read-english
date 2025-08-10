
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { User, UserRole } from '../types';
import { fetchAllUsers, deleteUserByEmail, deleteAllNonMasterUsers, getMasterUsageStats } from '../services/api';
import PageIdentifier from '../components/DevTools/PageIdentifier';
import { Card, Button, LoadingSpinner } from '../components/DesignSystem';

interface MasterPageProps {
    currentUser: User;
}

const MasterPage: React.FC<MasterPageProps> = ({ currentUser }) => {
    return (
        <div className="h-full flex flex-col">
            <PageIdentifier path="pages/AdminPage.tsx" />
            <header className="px-5 pt-5 pb-3">
                <h1 className="text-xl font-extrabold text-slate-800">마스터 관리</h1>
                <p className="text-sm text-gray-500 mt-1">전체 기관/계정 요약과 빠른 점검 화면입니다. 상세 관리는 좌측의 ‘마스터’ 버튼으로 패널을 여세요.</p>
            </header>
            <main className="flex-grow p-5 pt-0 overflow-y-auto space-y-5">
                <UsageCharts />
            </main>
        </div>
    );
};

const StatCard: React.FC<{ label: string; value: number; accent?: string; }>=({ label, value, accent = 'text-blue-600' }) => (
    <Card padding="md" className="flex items-center justify-between">
        <span className="text-sm text-gray-500">{label}</span>
        <span className={`text-2xl font-extrabold ${accent}`}>{value.toLocaleString()}</span>
    </Card>
);

const UsersSummary: React.FC = () => {
    const [users, setUsers] = useState<User[] | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            const res = await fetchAllUsers();
            setUsers(res.success ? res.data : []);
            setLoading(false);
        })();
    }, []);

    const stats = useMemo(() => {
        const all = users || [];
        const active = all.filter(u => u.status !== 'ghost');
        const archived = all.filter(u => u.status === 'ghost');
        const admins = active.filter(u => u.role === 'admin').length;
        const teachers = active.filter(u => u.role === 'teacher').length;
        const students = active.filter(u => u.role === 'student').length;
        const instSet = new Set(active.map(u => u.institution).filter((i): i is string => !!i));
        return {
            totalActive: active.length,
            totalArchived: archived.length,
            institutions: instSet.size,
            admins, teachers, students,
        };
    }, [users]);

    if (loading) return (
        <Card padding="md" className="flex items-center justify-center">
            <LoadingSpinner />
        </Card>
    );

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <StatCard label="전체 기관 수" value={stats.institutions} />
            <StatCard label="관리자 수" value={stats.admins} />
            <StatCard label="교사 수" value={stats.teachers} />
            <StatCard label="학생 수" value={stats.students} />
            <StatCard label="보관 계정" value={stats.totalArchived} accent="text-rose-600" />
        </div>
    );
};

// --- Usage Charts (line cards clickable) ---
const UsageCharts: React.FC = () => {
    const [data, setData] = useState<Awaited<ReturnType<typeof getMasterUsageStats>> | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            const stats = await getMasterUsageStats();
            setData(stats);
            setLoading(false);
        })();
    }, []);

    if (loading || !data) return <Card padding="md" className="flex items-center justify-center"><LoadingSpinner /></Card>;

    const Delta = ({value}:{value:number}) => (
        <span className="text-xs text-gray-400 ml-2">{value >= 0 ? `+${value}` : `${value}`}</span>
    );

    const sectionTitle = (t: string, total?: number, delta?: number) => (
        <div className="flex items-baseline justify-between mb-2">
            <h3 className="text-base font-bold text-slate-800">{t}</h3>
            {typeof total === 'number' && (
                <div className="text-slate-800 text-lg font-extrabold">
                    {total.toLocaleString()}
                    {typeof delta === 'number' && <Delta value={delta} />}
                </div>
            )}
        </div>
    );

    const Line = ({points, color}:{points:{date:string;count:number}[], color:string}) => {
        const width = 300, height = 120, padL=28, padB=18, padR=8, padT=8;
        const innerW = width - padL - padR;
        const innerH = height - padT - padB;
        const xs = (points.length>1? points.map((_,i)=> (i/(points.length-1))*innerW) : [0]);
        const maxY = Math.max(...points.map(p=>p.count), 1);
        const ys = points.length>0 ? points.map(p => innerH - (p.count/maxY)*innerH) : [innerH];
        const d = points.length>0 ? xs.map((x,i)=> `${i===0?'M':'L'}${padL+x},${padT+ys[i]}`).join(' ') : '';

        // axes (always draw)
        const xAxisY = padT+innerH;
        const yAxisX = padL;
        const ticks = 4;
        const yTicks = Array.from({length:ticks+1},(_,i)=> Math.round((maxY/ticks)*i));
        const xTicks = points.length>0 ? points.map((p,i)=>({x: padL + (xs[i]||0), label: p.date.slice(5)})) : [];

        return (
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-28">
                <line x1={yAxisX} y1={padT} x2={yAxisX} y2={xAxisY} stroke="#cbd5e1" strokeWidth={1} />
                <line x1={yAxisX} y1={xAxisY} x2={padL+innerW} y2={xAxisY} stroke="#cbd5e1" strokeWidth={1} />
                {yTicks.map((v,i)=>{
                    const y = padT + innerH - (v/maxY)*innerH;
                    return <text key={i} x={yAxisX-6} y={y+4} textAnchor="end" className="fill-gray-400 text-[10px]">{v}</text>
                })}
                {xTicks.slice(0,6).map((t,i)=> (
                    <text key={i} x={t.x} y={xAxisY+10} textAnchor="middle" className="fill-gray-400 text-[10px]">{t.label}</text>
                ))}
                {d && <path d={d} stroke={color} strokeWidth={2} fill="none" />}
            </svg>
        );
    };

    // totals + delta helpers
    const totalLogs = data.studyLogsDaily.reduce((s,p)=>s+p.count,0);
    const totalClasses = data.classesDaily.reduce((s,p)=>s+p.count,0);
    const totalCreated = data.usersCreatedDaily.reduce((s,p)=>s+p.count,0);
    const totalArchived = data.usersArchivedDaily.reduce((s,p)=>s+p.count,0);
    const dayDelta = (arr:{date:string;count:number}[]) => {
        if(arr.length<2) return 0;
        const a = arr[arr.length-1].count;
        const b = arr[arr.length-2].count;
        return a-b;
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card padding="md">
                {sectionTitle('학생 학습 수', totalLogs, dayDelta(data.studyLogsDaily))}
                <Line points={data.studyLogsDaily} color="#2563eb" />
            </Card>
            <Card padding="md">
                {sectionTitle('클래스 생성 수', totalClasses, dayDelta(data.classesDaily))}
                <Line points={data.classesDaily} color="#16a34a" />
            </Card>
            <Card padding="md">
                {sectionTitle('신규 사용자', totalCreated, dayDelta(aggregateByDate(data.usersCreatedDaily)))}
                <Line points={aggregateByDate(data.usersCreatedDaily)} color="#7c3aed" />
            </Card>
            <Card padding="md">
                {sectionTitle('보관 사용자', totalArchived, dayDelta(aggregateByDate(data.usersArchivedDaily)))}
                <Line points={aggregateByDate(data.usersArchivedDaily)} color="#dc2626" />
            </Card>
        </div>
    );

    function aggregateByDate(rows: {date:string; role:string; count:number}[]): {date:string; count:number}[] {
        const map = new Map<string, number>();
        rows.forEach(r => map.set(r.date, (map.get(r.date)||0)+r.count));
        return Array.from(map.entries()).sort((a,b)=>a[0].localeCompare(b[0])).map(([date,count])=>({date,count}));
    }
};

// --- Users Panel (moved to Master Panel later; keep hidden) ---
const UsersPanel: React.FC<{ currentUser: User }> = ({ currentUser }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchUsers = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await fetchAllUsers();
            if (result.success) {
                setUsers(result.data);
            } else {
                console.error("Failed to load users:", result.error);
                setError("사용자 목록을 불러오는 데 실패했습니다. 데이터베이스 설정을 확인해주세요.");
                setUsers([]);
            }
        } catch (err) {
            console.error("Failed to load users:", err);
            setError("알 수 없는 오류가 발생했습니다.");
            setUsers([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        const loadData = async () => { await fetchUsers(); };
        loadData();
    }, [fetchUsers]);

    const handleDeleteUser = async (emailToDelete: string) => {
        if (emailToDelete === 'master@app.com') {
            alert("메인 마스터 계정은 삭제할 수 없습니다.");
            return;
        }
        if (window.confirm(`사용자 ${emailToDelete}를 정말로 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) {
            await deleteUserByEmail(emailToDelete, currentUser);
            await fetchUsers();
        }
    };
    
    const handleClearUsers = async () => {
        if (window.confirm("정말로 마스터가 아닌 모든 사용자를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) {
            await deleteAllNonMasterUsers();
            await fetchUsers();
        }
    };
    
    const getRoleLabel = (role: UserRole) => {
        const labels: Record<UserRole, string> = {
            master: '마스터', 
            admin: '기관 관리자',
            teacher: '교사', 
            student: '학생', 
            individual: '개인'
        };
        return labels[role] || 'Unknown';
    };
    
    if (isLoading) return <Card padding="md" className="flex items-center justify-center"><LoadingSpinner /></Card>;
    if (error) return <Card padding="md" className="text-center text-red-600">{error}</Card>;

    return (
        <div className="hidden">
            <Card padding="md">
                {users.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">아직 등록된 사용자가 없습니다.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm text-left">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-4 py-2 font-medium text-gray-600">이름</th>
                                    <th className="px-4 py-2 font-medium text-gray-600">이메일</th>
                                    <th className="px-4 py-2 font-medium text-gray-600">역할</th>
                                    <th className="px-4 py-2 font-medium text-gray-600">상태</th>
                                    <th className="px-4 py-2 font-medium text-gray-600">작업</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user) => (
                                    <tr key={user.email} className="border-b border-gray-100 last:border-b-0">
                                        <td className="px-4 py-3">{user.name}</td>
                                        <td className="px-4 py-3 truncate max-w-xs">{user.email}</td>
                                        <td className="px-4 py-3">{getRoleLabel(user.role)}</td>
                                        <td className="px-4 py-3">
                                            {user.status === 'ghost' ? <span className="text-rose-600 font-semibold">보관</span> : <span className="text-emerald-600 font-semibold">활성</span>}
                                        </td>
                                        <td className="px-4 py-3">
                                            <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50"
                                                onClick={() => handleDeleteUser(user.email)}
                                                disabled={user.email === 'master@app.com'}
                                            >삭제</Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>
            <div>
                <Button variant="primary" size="md" onClick={handleClearUsers} className="w-full bg-red-600 hover:bg-red-700">모든 사용자 삭제 (마스터 제외)</Button>
            </div>
        </div>
    );
};

export default MasterPage;