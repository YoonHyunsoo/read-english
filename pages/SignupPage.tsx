
import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { createUser, fetchAllUsers } from '../services/api';
import TermsModal from '../components/TermsModal';
import { BackIcon } from '../components/icons';
import PageIdentifier from '../components/DevTools/PageIdentifier';

interface SignupPageProps {
  onNavigateToLogin: () => void;
}

type SignupUserType = 'individual' | 'class';

const SignupPage: React.FC<SignupPageProps> = ({ onNavigateToLogin }) => {
  const [userType, setUserType] = useState<SignupUserType | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [institution, setInstitution] = useState('');
  const [newInstitution, setNewInstitution] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [availableInstitutions, setAvailableInstitutions] = useState<string[]>([]);
  
  // Agreement states
  const [agreeAll, setAgreeAll] = useState(false);
  const [agreeService, setAgreeService] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [agreeData, setAgreeData] = useState(false);
  const [agreeAccess, setAgreeAccess] = useState(false);
  const [agreeMarketing, setAgreeMarketing] = useState(false);
  
  // Modal state
  const [isViewingTerms, setIsViewingTerms] = useState(false);

  useEffect(() => {
    const getInstitutions = async () => {
      try {
        setError('');
        const result = await fetchAllUsers();
        if(result.success) {
          const teacherInstitutions = result.data
            .filter(u => (u.role === 'teacher' || u.role === 'admin') && u.institution && u.status !== 'ghost')
            .map(u => u.institution!);
          setAvailableInstitutions([...new Set(teacherInstitutions)]);
        } else {
          console.error("Failed to fetch institutions for signup:", result.error);
          setError("기관 목록을 불러오지 못했습니다. 네트워크 연결을 확인하세요.");
        }
      } catch (e) {
        console.error("Unexpected error fetching institutions for signup:", e);
        setError("기관 목록을 불러오는 중 오류가 발생했습니다.");
      }
    };
    if (userType === 'class') {
      getInstitutions();
    }
  }, [userType]);
  
  const isAllRequiredAgreed = agreeService && agreePrivacy && agreeData && agreeAccess;

  const handleAgreeAllChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { checked } = e.target;
    setAgreeAll(checked);
    setAgreeService(checked);
    setAgreePrivacy(checked);
    setAgreeData(checked);
    setAgreeAccess(checked);
    setAgreeMarketing(checked);
  };
  
  useEffect(() => {
    const allRequired = agreeService && agreePrivacy && agreeData && agreeAccess;
    setAgreeAll(allRequired && agreeMarketing);
  }, [agreeService, agreePrivacy, agreeData, agreeAccess, agreeMarketing]);


  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isAllRequiredAgreed) {
        setError('필수 약관에 모두 동의해야 합니다.');
        return;
    }
    if (password !== passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }
    if (userType === 'class' && institution === 'new' && !newInstitution) {
      setError('기관명을 입력해주세요.');
      return;
    }
    
    setIsSubmitting(true);
    
    let newUserRole: UserRole;
    let newUserInstitution: string | undefined;

    if (userType === 'class') {
      if (institution === 'new') {
        newUserRole = 'admin';
        newUserInstitution = newInstitution;
      } else {
        newUserRole = 'teacher';
        newUserInstitution = institution;
      }
    } else {
      newUserRole = 'individual';
      newUserInstitution = undefined;
    }

    const newUser: User = {
      name,
      email,
      password,
      role: newUserRole,
      institution: newUserInstitution,
    };

    const result = await createUser(newUser); // Actor is undefined for self-signup
    if (result.success) {
      setFormSubmitted(true);
    } else {
      setError(result.error || '가입 중 오류가 발생했습니다.');
    }
    setIsSubmitting(false);
  };
  
  const isNewInstitution = institution === 'new';

  const renderFormFields = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
        <input type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full form-input" placeholder="홍길동" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full form-input" placeholder="email@example.com" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full form-input" placeholder="********" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호 확인</label>
        <input type="password" value={passwordConfirm} onChange={e => setPasswordConfirm(e.target.value)} required className="w-full form-input" placeholder="********" />
      </div>

      {userType === 'class' && (
        <div className="pt-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">소속 기관</label>
          <select value={institution} onChange={e => setInstitution(e.target.value)} required className="w-full form-input">
            <option value="" disabled>기관을 선택하세요</option>
            {availableInstitutions.map(inst => (
              <option key={inst} value={inst}>{inst}</option>
            ))}
            <option value="new">새로운 기관 추가</option>
          </select>
          {isNewInstitution && (
            <input 
              type="text" 
              value={newInstitution}
              onChange={e => setNewInstitution(e.target.value)}
              required 
              className="w-full form-input mt-2" 
              placeholder="기관명을 입력하세요" 
            />
          )}
        </div>
      )}
      <style>{`.form-input { display: block; width: 100%; padding: 0.75rem; border: 1px solid #D1D5DB; border-radius: 0.5rem; background-color: #F9FAFB; }`}</style>
    </div>
  );

  const renderAgreements = () => (
    <div className="bg-white p-4 rounded-xl border border-gray-200">
      <div className="flex items-center justify-between pb-3 border-b border-gray-200">
        <label htmlFor="agree-all" className="flex items-center cursor-pointer">
          <input id="agree-all" type="checkbox" checked={agreeAll} onChange={handleAgreeAllChange} className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
          <span className="ml-3 text-sm font-bold text-slate-800">전체 동의</span>
        </label>
        <button type="button" onClick={() => setIsViewingTerms(true)} className="text-sm text-blue-600 underline hover:text-blue-800">약관 보기</button>
      </div>
      <div className="pt-2 space-y-1">
        <AgreementCheckbox id="agree-service" label="서비스 이용약관 동의" checked={agreeService} onChange={e => setAgreeService(e.target.checked)} />
        <AgreementCheckbox id="agree-privacy" label="개인정보 수집 및 이용 동의" checked={agreePrivacy} onChange={e => setAgreePrivacy(e.target.checked)} />
        <AgreementCheckbox id="agree-data" label="비식별 학습데이터 보관·활용 동의" checked={agreeData} onChange={e => setAgreeData(e.target.checked)} />
        <AgreementCheckbox id="agree-access" label="담당자 정보 접근 동의" checked={agreeAccess} onChange={e => setAgreeAccess(e.target.checked)} />
        <AgreementCheckbox id="agree-marketing" label="마케팅 정보 수신 동의" checked={agreeMarketing} onChange={e => setAgreeMarketing(e.target.checked)} isOptional />
      </div>
    </div>
  );
  
  const AgreementCheckbox: React.FC<{id: string, label: string, checked: boolean, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, isOptional?: boolean}> = ({id, label, checked, onChange, isOptional}) => (
    <div className="flex items-center justify-between py-1">
      <label htmlFor={id} className="flex items-center cursor-pointer">
        <input id={id} type="checkbox" checked={checked} onChange={onChange} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
        <span className="ml-3 text-sm text-gray-600">{label}</span>
        <span className={`ml-1.5 text-xs font-semibold ${isOptional ? 'text-gray-400' : 'text-blue-500'}`}>{isOptional ? '(선택)' : '(필수)'}</span>
      </label>
    </div>
  );


  if (formSubmitted) {
    return (
      <div className="p-6 flex flex-col h-full justify-center">
        <div className="w-full max-w-sm mx-auto text-center">
          <h2 className="text-xl font-bold text-slate-800">회원가입 완료!</h2>
          <p className="mt-2 text-gray-600">환영합니다! 이제 로그인하여 학습을 시작할 수 있습니다.</p>
          <button onClick={onNavigateToLogin} className="mt-6 w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors">
            로그인 하러 가기
          </button>
        </div>
      </div>
    );
  }

  if (!userType) {
    return (
      <div className="flex flex-col h-full bg-gray-50">
        <PageIdentifier path="pages/SignupPage.tsx" />
        <header className="flex items-center p-4 pt-4 pb-2 bg-white flex-shrink-0 relative border-b border-gray-200">
            <button onClick={onNavigateToLogin} className="absolute left-4 p-1 rounded-full hover:bg-gray-200" aria-label="로그인 화면으로 돌아가기">
                <div className="w-6 h-6 text-slate-700">
                    <BackIcon />
                </div>
            </button>
            <h1 className="text-lg font-bold text-slate-800 text-center w-full">
               회원가입
            </h1>
        </header>
        
        <main className="flex-grow flex flex-col justify-center items-center p-6 text-center">
          <div className="w-full max-w-sm">
            <p className="text-gray-600 mb-6">사용자 유형을 선택해주세요.</p>
            <div className="space-y-4">
                <button onClick={() => setUserType('individual')} className="w-full bg-white border border-gray-300 text-gray-800 font-bold py-4 rounded-lg hover:bg-gray-50 transition-colors">
                    개인 사용자
                </button>
                <button onClick={() => setUserType('class')} className="w-full bg-white border border-gray-300 text-gray-800 font-bold py-4 rounded-lg hover:bg-gray-50 transition-colors">
                    수업 사용자 (교사)
                </button>
            </div>
          </div>
        </main>

        <footer className="flex-shrink-0 text-center pb-8">
             <button onClick={onNavigateToLogin} className="text-sm text-blue-600 hover:underline">
              이미 계정이 있으신가요? 로그인
            </button>
        </footer>
      </div>
    );
  }

  return (
     <div className="flex flex-col h-full bg-gray-50">
      <PageIdentifier path="pages/SignupPage.tsx" />
      <TermsModal isOpen={isViewingTerms} onClose={() => setIsViewingTerms(false)} />
      <header className="flex items-center p-4 pt-4 pb-2 bg-white flex-shrink-0 relative border-b border-gray-200">
          <button onClick={() => setUserType(null)} className="absolute left-4 p-1 rounded-full hover:bg-gray-200" aria-label="Back">
              <div className="w-6 h-6 text-slate-700">
                  <BackIcon />
              </div>
          </button>
          <h1 className="text-lg font-bold text-slate-800 text-center w-full">
             {userType === 'individual' ? '개인 사용자 회원가입' : '수업 사용자 (교사) 회원가입'}
          </h1>
      </header>
      
      <main className="flex-grow p-4 overflow-y-auto">
        <form onSubmit={handleSignup} className="max-w-md mx-auto space-y-6">
            {renderFormFields()}
            {renderAgreements()}
            {error && <p className="text-red-500 text-sm text-center -mb-2">{error}</p>}
            <div className="pt-2 space-y-3">
              <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50" disabled={isSubmitting}>
                {isSubmitting ? '가입 중...' : '회원가입'}
              </button>
            </div>
        </form>
      </main>
    </div>
  );
};

export default SignupPage;
