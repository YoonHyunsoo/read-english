import React from 'react';
import { User, ActiveTab, UserRole } from '../types';

interface HeaderProps {
  activeTab: ActiveTab;
  currentUser: User;
  onNavigateToAdminPanel: () => void;
  onNavigateToTeacherLogs: () => void;
}

const getTitle = (tab: ActiveTab) => {
    switch (tab) {
        case 'class':
            return '수업 활동';
        case 'review':
            return '자율학습';
        case 'progress':
            return '학습 진행률';
        case 'master':
            return '마스터 관리';
        case 'classes':
            return '클래스 관리';
        case 'materials':
            return '수업 자료';
        case 'students':
            return '학생 관리';
        case 'settings':
            return '설정';
        default:
            return 'READ:ENG';
    }
};

const getRoleInfo = (role: UserRole) => {
    switch (role) {
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
}

const Header: React.FC<HeaderProps> = ({ activeTab, currentUser, onNavigateToAdminPanel, onNavigateToTeacherLogs }) => {
    const roleInfo = getRoleInfo(currentUser.role);
    return (
        <header className="flex items-center justify-between p-4 pt-4 pb-2 bg-white flex-shrink-0 w-full border-b border-gray-200 h-[60px]">
            <div className="flex-1 flex justify-start">
                <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-md text-xs font-bold ${roleInfo.className}`}>
                        {roleInfo.label}
                    </span>
                    <span className="text-slate-700 text-xs truncate" style={{maxWidth: '120px'}}>{currentUser.name}</span>
                </div>
            </div>
            
            <div className="flex-none">
                <h1 className="text-lg font-bold text-slate-800 text-center px-2">
                    {getTitle(activeTab)}
                </h1>
            </div>

            <div className="flex-1 flex justify-end">
                {currentUser.role === 'teacher' && (
                    <button
                        onClick={onNavigateToTeacherLogs}
                        className="bg-slate-600 text-slate-100 font-bold text-xs px-3 py-1.5 rounded-lg hover:bg-slate-700 transition-colors"
                    >
                        로그
                    </button>
                )}
                {(currentUser.role === 'admin' || currentUser.role === 'master') && (
                    <button
                        onClick={onNavigateToAdminPanel}
                        className="bg-slate-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                    >
                        어드민
                    </button>
                )}
            </div>
        </header>
    );
};

export default Header;