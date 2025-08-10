import React, { useState } from 'react';
import { User } from '../types';
import { SettingsIcon } from '../components/icons';
import PageIdentifier from '../components/DevTools/PageIdentifier';

interface SettingsPageProps {
  currentUser: User;
  onLogout: () => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ currentUser, onLogout }) => {
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  const handleCopy = (text: string, identifier: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedItem(identifier);
      setTimeout(() => setCopiedItem(null), 2000); // Reset after 2 seconds
    });
  };

  const getRoleLabel = () => {
    switch (currentUser.role) {
      case 'student': return '학생';
      case 'individual': return '개인';
      case 'admin': return '기관 관리자';
      case 'teacher': return '선생님';
      case 'master': return '마스터';
      default: return '사용자';
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <PageIdentifier path="pages/SettingsPage.tsx" />
      {/* 헤더 완전 제거: 상단 바 숨김 */}
      <main className="flex-grow p-4 pt-4 overflow-y-auto">
        <div className="space-y-6">
          <section className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <h2 className="text-base font-bold text-slate-800 mb-4">계정 정보</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">이름</p>
                <p className="font-semibold text-slate-800">{currentUser.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">이메일</p>
                <p className="font-semibold text-slate-800">{currentUser.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">사용자 유형</p>
                <p className="font-semibold text-slate-800">{getRoleLabel()}</p>
              </div>
              {(currentUser.role === 'student' || currentUser.role === 'teacher' || currentUser.role === 'admin') && currentUser.institution && (
                <div>
                  <p className="text-sm text-gray-500">소속 기관</p>
                  <p className="font-semibold text-slate-800">{currentUser.institution}</p>
                </div>
              )}
            </div>
          </section>

          <section className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <h2 className="text-base font-bold text-slate-800 mb-4">고객센터</h2>
            <div className="space-y-3">
              <ContactRow label="Phone 1" value="02-573-7790 비주얼캠프" copyText="02-573-7790" isCopied={copiedItem === 'phone1'} onCopy={() => handleCopy('02-573-7790', 'phone1')} />
              <ContactRow label="Phone 2" value="010-4983-2687 윤현수 팀장" copyText="010-4983-2687" isCopied={copiedItem === 'phone2'} onCopy={() => handleCopy('010-4983-2687', 'phone2')} />
              <ContactRow label="Email" value="readforschool@visual.camp" copyText="readforschool@visual.camp" isCopied={copiedItem === 'email'} onCopy={() => handleCopy('readforschool@visual.camp', 'email')} />
            </div>
          </section>

          <section>
            <button onClick={onLogout} className="w-full bg-gray-200 text-gray-800 font-bold py-3 px-5 rounded-lg hover:bg-gray-300 transition-colors">로그아웃</button>
          </section>
        </div>
      </main>
    </div>
  );
};

const ContactRow: React.FC<{ label: string; value: string; copyText: string; isCopied: boolean; onCopy: () => void; }> = ({ label, value, copyText, isCopied, onCopy }) => (
  <div className="flex justify-between items-center">
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="font-semibold text-slate-800">{value}</p>
    </div>
    <button onClick={onCopy} className="text-sm text-blue-600 hover:underline font-semibold transition-colors">
      {isCopied ? '복사됨!' : '복사하기'}
    </button>
  </div>
);

export default SettingsPage;