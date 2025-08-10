import React from 'react';
import { ActivityType } from '../types';
import { getActivityLevelStyles } from '../utils/colorUtils';

// ==================== 기본 버튼 컴포넌트 ====================
export const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  onClick, 
  disabled = false,
  className = ""
}: {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'activity';
  size?: 'sm' | 'md' | 'lg' | 'activity';
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) => {
  const baseClasses = "font-bold rounded-lg transition-colors focus:outline-none";
  
  const variantClasses = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white",
    secondary: "bg-gray-100 hover:bg-gray-200 text-slate-800", 
    outline: "border border-gray-200 text-slate-800 hover:bg-gray-50",
    activity: "bg-white hover:bg-gray-100 border border-gray-200"
  };
  
  const sizeClasses = {
    sm: "py-1 px-3 text-sm",
    md: "py-2 px-4 text-base",
    lg: "py-3 px-6 text-lg",
    activity: "p-3 h-[58px]"  // ActivityButton과 동일한 크기
  };
  
  return (
    <button 
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

// ==================== 활동 버튼 컴포넌트 ====================
export const ActivityButton = ({ 
  icon, 
  label, 
  onClick, 
  disabled = false,
  className = ""
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) => {
  return (
    <button 
      onClick={onClick} 
      disabled={disabled} 
      className={`box-border flex flex-row items-center p-3 gap-2 h-[58px] bg-white hover:bg-gray-100 border border-gray-200 rounded-lg flex-1 transition-colors ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      <div className="w-6 h-6 text-slate-800 flex-shrink-0">{icon}</div>
      <span className="font-bold text-sm leading-5 text-slate-800 text-left">{label}</span>
    </button>
  );
};

// ==================== 활동 레벨 배지 ====================
export const ActivityLevelBadge = ({ 
  type, 
  level, 
  children,
  className = ""
}: {
  type: ActivityType;
  level: number;
  children?: React.ReactNode;
  className?: string;
}) => {
  const styles = getActivityLevelStyles(type, level);
  
  return (
    <div 
      className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium ${className}`}
      style={styles}
    >
      {children || `Level ${level}`}
    </div>
  );
};

// ==================== 카드 컴포넌트 ====================
export const Card = ({ 
  children, 
  className = "",
  padding = "lg",
  shadow = true,
  rounded = "2xl"
}: {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  shadow?: boolean;
  rounded?: 'none' | 'lg' | 'xl' | '2xl';
}) => {
  const paddingClasses = {
    none: "",
    sm: "p-3",
    md: "p-4", 
    lg: "p-6",
    xl: "p-8"
  };
  
  const roundedClasses = {
    none: "",
    lg: "rounded-lg",
    xl: "rounded-xl",
    "2xl": "rounded-2xl"
  };
  
  const shadowClass = shadow ? "shadow-lg" : "";
  
  return (
    <div className={`bg-white ${roundedClasses[rounded]} ${shadowClass} border border-gray-200 ${paddingClasses[padding]} ${className}`}>
      {children}
    </div>
  );
};

// ==================== 모달 컴포넌트 ====================
export const Modal = ({ 
  children, 
  isOpen, 
  onClose,
  title,
  size = "md",
  showCloseButton = true
}: {
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showCloseButton?: boolean;
}) => {
  if (!isOpen) return null;
  
  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md", 
    lg: "max-w-lg",
    xl: "max-w-xl"
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4 animate-fade-in">
      <div className={`bg-white rounded-2xl w-full ${sizeClasses[size]} max-h-[90vh] flex flex-col shadow-xl animate-scale-up`}>
        {title && (
          <header className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-bold text-slate-800">{title}</h2>
            {showCloseButton && (
              <button 
                onClick={onClose} 
                className="p-1 rounded-full hover:bg-gray-200 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </header>
        )}
        <div className="p-5 overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </div>
  );
};

// ==================== 네비게이션 아이템 ====================
export const NavItem = ({ 
  icon, 
  label, 
  isActive = false, 
  onClick,
  className = ""
}: {
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  onClick: () => void;
  className?: string;
}) => {
  const textColor = isActive ? 'text-blue-600' : 'text-[#4D7099]';
  const iconColor = isActive ? 'text-blue-600' : 'text-[#4D7099]';

  return (
    <button 
      onClick={onClick} 
      className={`flex flex-col justify-end items-center gap-1 flex-1 h-[54px] focus:outline-none ${className}`}
    >
      <div className={`w-6 h-6 ${iconColor}`}>
        {icon}
      </div>
      <span className={`text-xs font-medium leading-[18px] ${textColor}`}>{label}</span>
    </button>
  );
};

// ==================== 입력 필드 ====================
export const Input = ({ 
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  disabled = false,
  error,
  className = ""
}: {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'email' | 'password' | 'number';
  disabled?: boolean;
  error?: string;
  className?: string;
}) => {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-slate-800 mb-2">
          {label}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
          error ? 'border-red-500' : ''
        } ${disabled ? 'bg-gray-50 cursor-not-allowed' : ''}`}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

// ==================== 로딩 스피너 ====================
export const LoadingSpinner = ({ 
  size = "md",
  className = ""
}: {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8"
  };
  
  return (
    <div className={`${sizeClasses[size]} ${className}`}>
      <svg className="animate-spin text-blue-600" fill="none" viewBox="0 0 24 24">
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </div>
  );
};
