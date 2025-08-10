


import React from 'react';
import { ClassIcon, ReviewIcon, ProgressIcon, MasterIcon, StudentsIcon, SettingsIcon, MaterialsIcon } from './icons';
import { ActiveTab, UserRole } from '../types';

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, isActive = false, onClick }) => {
  const textColor = isActive ? 'text-blue-600' : 'text-[#4D7099]';
  const iconColor = isActive ? 'text-blue-600' : 'text-[#4D7099]';

  return (
    <button onClick={onClick} className="flex flex-col justify-end items-center gap-1 flex-1 h-[54px] focus:outline-none">
      <div className={`w-6 h-6 ${iconColor} [&>svg]:w-6 [&>svg]:h-6 [&>svg]:block`}>
        {icon}
      </div>
      <span className={`text-xs font-medium leading-[18px] ${textColor}`}>{label}</span>
    </button>
  );
};

interface FooterNavProps {
    activeTab: ActiveTab;
    setActiveTab: (tab: ActiveTab) => void;
    role: UserRole;
}

const FooterNav: React.FC<FooterNavProps> = ({ activeTab, setActiveTab, role }) => {
  
  const renderNavItems = () => {
    switch (role) {
      case 'student':
        return (
          <>
            <NavItem icon={<ClassIcon />} label="수업 활동" isActive={activeTab === 'class'} onClick={() => setActiveTab('class')} />
            <NavItem icon={<ReviewIcon />} label="레벨업" isActive={activeTab === 'review'} onClick={() => setActiveTab('review')} />
            <NavItem icon={<ProgressIcon />} label="학습 진행률" isActive={activeTab === 'progress'} onClick={() => setActiveTab('progress')} />
            <NavItem icon={<SettingsIcon />} label="설정" isActive={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
          </>
        );
      case 'individual':
        return (
          <>
            <NavItem icon={<MaterialsIcon />} label="수업 자료" isActive={activeTab === 'materials'} onClick={() => setActiveTab('materials')} />
            <NavItem icon={<ReviewIcon />} label="레벨업" isActive={activeTab === 'review'} onClick={() => setActiveTab('review')} />
            <NavItem icon={<ProgressIcon />} label="학습 진행률" isActive={activeTab === 'progress'} onClick={() => setActiveTab('progress')} />
            <NavItem icon={<SettingsIcon />} label="설정" isActive={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
          </>
        );
      case 'admin':
      case 'teacher':
        return (
          <>
            <NavItem icon={<ClassIcon />} label="클래스 관리" isActive={activeTab === 'classes'} onClick={() => setActiveTab('classes')} />
            <NavItem icon={<MaterialsIcon />} label="수업 자료" isActive={activeTab === 'materials'} onClick={() => setActiveTab('materials')} />
            <NavItem icon={<StudentsIcon />} label="학생 관리" isActive={activeTab === 'students'} onClick={() => setActiveTab('students')} />
            <NavItem icon={<SettingsIcon />} label="설정" isActive={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
          </>
        );
      case 'master':
        return (
          <>
            <NavItem icon={<MasterIcon />} label="마스터 관리" isActive={activeTab === 'master'} onClick={() => setActiveTab('master')} />
            <NavItem icon={<SettingsIcon />} label="설정" isActive={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
          </>
        );
      default:
        return null;
    }
  };

  return (
    <footer className="w-full bg-white border-t border-gray-200">
        <div className="flex flex-row items-start px-4 pt-2 pb-3 gap-2 w-full">
            {renderNavItems()}
        </div>
    </footer>
  );
};

export default FooterNav;