
import React from 'react';

interface ActivityButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
}

const ActivityButton: React.FC<ActivityButtonProps> = ({ icon, label, onClick, disabled = false }) => {
  return (
    <button onClick={onClick} disabled={disabled} className={`box-border flex flex-row items-center p-3 gap-2 h-[58px] bg-white hover:bg-gray-100 border border-gray-200 rounded-lg flex-1 transition-colors ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
      <div className="w-6 h-6 text-slate-800 flex-shrink-0">{icon}</div>
      <span className="font-bold text-sm leading-5 text-slate-800 text-left">{label}</span>
    </button>
  );
};

export default ActivityButton;