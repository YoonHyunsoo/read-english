import React from 'react';
import { ActiveTab, User } from '../types';
import PageIdentifier from './DevTools/PageIdentifier';
import { ClassIcon, MaterialsIcon, StudentsIcon, SettingsIcon, MasterIcon, DocumentTextIcon, UserGroupIcon, ReviewIcon, ProgressIcon, AppLogo } from './icons';

interface DesktopLayoutProps {
  currentUser: User;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onLogout?: () => void;
  onOpenAdminPanel?: () => void;
  onOpenTeacherLogs?: () => void;
  children: React.ReactNode;
}

const DesktopLayout: React.FC<DesktopLayoutProps> = ({ currentUser, activeTab, setActiveTab, onLogout, onOpenAdminPanel, onOpenTeacherLogs, children }) => {
  const role = currentUser.role;

  const getRoleInfo = (r: User['role']) => {
    switch (r) {
      case 'student':
        return { label: '학생', className: 'bg-blue-100 text-blue-800' };
      case 'admin':
        return { label: '기관 관리자', className: 'bg-indigo-100 text-indigo-800' };
      case 'teacher':
        return { label: '교사', className: 'bg-green-100 text-green-800' };
      case 'individual':
        return { label: '개인', className: 'bg-purple-100 text-purple-800' };
      case 'master':
        return { label: '마스터', className: 'bg-yellow-400 text-yellow-900 border border-yellow-300' };
      default:
        return { label: '사용자', className: 'bg-gray-200 text-gray-800' };
    }
  };
  const roleInfo = getRoleInfo(role);

  const NavButton: React.FC<{label: string; icon: React.ReactNode; tab: ActiveTab}> = ({ label, icon, tab }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-100'}`}
    >
      <span className="w-5 h-5 [&>svg]:w-5 [&>svg]:h-5 [&>svg]:block">{icon}</span>
      <span>{label}</span>
    </button>
  );

  return (
    <div className="flex h-screen bg-gray-50">
      <PageIdentifier path="components/DesktopLayout.tsx" />
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 p-4 flex flex-col gap-4 h-screen overflow-hidden">
        <div>
          {/* Top brand title removed per requirement */}
          <div className="mt-1 flex items-center gap-2">
            <span className={`px-2 py-1 rounded-md text-xs sm:text-sm font-bold ${roleInfo.className}`}>{roleInfo.label}</span>
            <span className="text-slate-800 text-sm sm:text-base font-semibold truncate">{currentUser.name}</span>
          </div>
          {/* Quick actions row */}
          <div className="mt-3 flex flex-col gap-2">
            {role === 'teacher' && onOpenTeacherLogs && (
              <button onClick={onOpenTeacherLogs} className="w-full flex items-center justify-center gap-1 px-2 py-1 rounded-md text-xs font-semibold bg-slate-600 text-white hover:bg-slate-700">
                <span className="w-5 h-5 [&>svg]:w-5 [&>svg]:h-5 [&>svg]:block"><DocumentTextIcon /></span>
                <span>로그</span>
              </button>
            )}
            {(role === 'admin' || role === 'master') && onOpenAdminPanel && (
              <button onClick={onOpenAdminPanel} className="w-full flex items-center justify-center gap-1 px-2 py-1 rounded-md text-xs font-semibold bg-slate-700 text-white hover:bg-slate-800">
                <span className="w-5 h-5 [&>svg]:w-5 [&>svg]:h-5 [&>svg]:block">{role === 'master' ? <MasterIcon /> : <SettingsIcon className="w-5 h-5" />}</span>
                <span>{role === 'master' ? '마스터' : '어드민'}</span>
              </button>
            )}
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto pr-1">
          {role === 'teacher' && (
            <>
              <NavButton label="클래스 관리" icon={<ClassIcon />} tab="classes" />
              <NavButton label="수업 자료" icon={<MaterialsIcon />} tab="materials" />
              <NavButton label="학생 관리" icon={<StudentsIcon />} tab="students" />
              <NavButton label="데이터 로그" icon={<DocumentTextIcon />} tab="classes" />
              <NavButton label="설정" icon={<SettingsIcon className="w-5 h-5" />} tab="settings" />
            </>
          )}
          {role === 'admin' && (
            <>
              <NavButton label="클래스 관리" icon={<ClassIcon />} tab="classes" />
              <NavButton label="수업 자료" icon={<MaterialsIcon />} tab="materials" />
              <NavButton label="학생 관리" icon={<StudentsIcon />} tab="students" />
              <NavButton label="설정" icon={<SettingsIcon className="w-5 h-5" />} tab="settings" />
            </>
          )}
          {role === 'master' && (
            <>
              <NavButton label="마스터 관리" icon={<MasterIcon />} tab="master" />
              <NavButton label="설정" icon={<SettingsIcon className="w-5 h-5" />} tab="settings" />
            </>
          )}
          {role === 'student' && (
            <>
              <NavButton label="수업 활동" icon={<ClassIcon />} tab="class" />
              <NavButton label="레벨업" icon={<ReviewIcon />} tab="review" />
              <NavButton label="학습 진행률" icon={<ProgressIcon />} tab="progress" />
              <NavButton label="설정" icon={<SettingsIcon className="w-5 h-5" />} tab="settings" />
            </>
          )}
          {role === 'individual' && (
            <>
              <NavButton label="수업 자료" icon={<MaterialsIcon />} tab="materials" />
              <NavButton label="레벨업" icon={<ReviewIcon />} tab="review" />
              <NavButton label="학습 진행률" icon={<ProgressIcon />} tab="progress" />
              <NavButton label="설정" icon={<SettingsIcon className="w-5 h-5" />} tab="settings" />
            </>
          )}
        </nav>

        {/* Left-bottom watermark with logo and brand */}
        <div className="mt-auto pt-3">
          <div className="flex items-center gap-3">
            <AppLogo className="w-10 h-10 text-blue-500" />
            <span className="text-2xl font-extrabold tracking-wide text-blue-500">READ:ENG</span>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 h-screen p-6 overflow-hidden">
        <div className="relative bg-white border border-gray-200 rounded-xl shadow-sm p-4 h-full overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
            <AppLogo className="w-[60%] h-[60%] text-blue-100 opacity-40" />
          </div>
          <div className="relative z-10 h-full overflow-y-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default DesktopLayout;


