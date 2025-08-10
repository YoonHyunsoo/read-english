
import React, { useState, useEffect, useMemo } from 'react';
import { User } from '../types';
import { authenticateUser, fetchAllUsers } from '../services/api';
import { SearchIcon, EyeIcon, EyeOffIcon, StudentLoginIcon, TeacherLoginIcon, AppLogo } from '../components/icons';
import CustomerSupportModal from '../components/CustomerSupportModal';
import PageIdentifier from '../components/DevTools/PageIdentifier';
import { createStudentEmail } from '../utils/domainUtils';

interface LoginPageProps {
  onLoginSuccess: (user: User) => void;
  onNavigateToSignup: () => void;
  preferDesktop?: boolean;
}

type LoginType = 'student' | 'teacher';

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, onNavigateToSignup, preferDesktop = false }) => {
  const [loginType, setLoginType] = useState<LoginType>('student');
  const [email, setEmail] = useState('');
  const [studentId, setStudentId] = useState('');
  const [institution, setInstitution] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [error, setError] = useState('');
  const [institutions, setInstitutions] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  
  useEffect(() => {
    const getInstitutions = async () => {
        try {
            const result = await fetchAllUsers();
            if (result.success) {
                const teacherInstitutions = result.data
                    .filter(u => (u.role === 'teacher' || u.role === 'admin') && u.institution && u.status !== 'ghost')
                    .map(u => u.institution!);
                setInstitutions([...new Set(teacherInstitutions)]);
            } else {
                // Handle specific DB setup error
                if (result.error?.code === '42P01' || result.error?.message?.includes('does not exist')) {
                    setError("데이터베이스 연결에 실패했습니다. 관리자에게 문의하여 설정을 완료해주세요.");
                } else {
                    console.error("Error fetching all users:", result.error);
                    setError("사용자 정보를 불러오는 데 실패했습니다.");
                }
            }
        } catch (e) {
            console.error("An unexpected error occurred:", e);
            setError("앱을 시작하는 중 오류가 발생했습니다. 관리자에게 문의하세요.");
        }
    };
    getInstitutions();
  }, []);

  const resetFields = () => {
    setEmail('');
    setStudentId('');
    setInstitution('');
    setPassword('');
    setError('');
  };
  
  const handleTabChange = (type: LoginType) => {
    setLoginType(type);
    resetFields();
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoggingIn(true);

    try {
        let user: User | null = null;
        
        if (loginType === 'student') {
            if (!institution || !studentId || !password) {
                setError('기관명, 아이디, 비밀번호를 모두 입력해주세요.');
                return;
            }
            const constructedEmail = await createStudentEmail(studentId, institution);
            user = await authenticateUser(constructedEmail, password);
        } else {
            if (!email || !password) {
                setError('이메일과 비밀번호를 입력해주세요.');
                return;
            }
            user = await authenticateUser(email, password);
        }

        if (!user) {
            setError(loginType === 'student' ? '기관명, 아이디 또는 비밀번호가 올바르지 않습니다.' : '이메일 또는 비밀번호가 올바르지 않습니다.');
            return;
        }

        if (user.institution === 'ghost') {
            setError('삭제된 계정입니다. 관리자에게 문의하세요.');
            return;
        }

        if (loginType === 'student') {
            if (user.role === 'student' && user.institution === institution) {
                onLoginSuccess(user);
            } else {
                setError('기관명, 아이디 또는 비밀번호가 올바르지 않습니다.');
            }
        } else {
            if (user.role !== 'student') {
                onLoginSuccess(user);
            } else {
                setError('이메일 또는 비밀번호가 올바르지 않거나, 학생 계정으로 로그인을 시도했습니다.');
            }
        }
    } finally {
        setIsLoggingIn(false);
    }
  };

  const filteredInstitutions = useMemo(() => {
    if (!institution) return institutions;
    return institutions.filter(i => i.toLowerCase().includes(institution.toLowerCase()));
  }, [institution, institutions]);

  const renderStudentForm = (suffix: string) => (
    <>
      <div className="relative">
        <label htmlFor={`institution${suffix}`} className="block text-sm font-semibold text-slate-700 mb-2">기관명</label>
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
            <SearchIcon />
          </span>
          <input
            id={`institution${suffix}`} type="text" value={institution}
            onChange={(e) => { setInstitution(e.target.value); if(!showDropdown) setShowDropdown(true); }}
            onFocus={() => setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
            required
            className="w-full p-4 pl-12 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500"
            placeholder="학교/학원을 선택하세요."
          />
        </div>
        {showDropdown && filteredInstitutions.length > 0 && (
            <ul className="absolute z-10 w-full bg-white border border-gray-200 rounded-md mt-1 max-h-40 overflow-y-auto shadow-lg">
              {filteredInstitutions.map(inst => (
                <li key={inst} onMouseDown={() => { setInstitution(inst); setShowDropdown(false); }} className="px-4 py-2 cursor-pointer hover:bg-blue-50 text-sm">{inst}</li>
              ))}
            </ul>
          )}
      </div>
      <div>
        <label htmlFor={`studentId${suffix}`} className="block text-sm font-semibold text-slate-700 mb-2">아이디</label>
        <input 
          id={`studentId${suffix}`} 
          type="text" 
          value={studentId} 
          onChange={(e) => setStudentId(e.target.value)} 
          required 
          className="w-full p-4 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500" 
          placeholder="아이디를 입력해주세요"
        />
      </div>
    </>
  );

  const renderTeacherForm = (suffix: string) => (
    <div>
        <label htmlFor={`email${suffix}`} className="block text-sm font-semibold text-slate-700 mb-2">이메일</label>
        <input 
            id={`email${suffix}`} 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
            className="w-full p-4 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500" 
            placeholder="이메일을 입력해주세요"
        />
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-transparent">
      <PageIdentifier path="pages/LoginPage.tsx" />

      {/* Desktop layout */}
      <div className={`${preferDesktop ? 'flex' : 'hidden lg:flex'} min-h-screen items-center justify-center px-6 py-10`}>
        <div className="w-full max-w-6xl bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden">
          <div className="grid grid-cols-5">
            {/* Left side - brand panel (inside big card) */}
            <div className="col-span-2 flex flex-col justify-center items-center bg-white p-12">
              <AppLogo className="w-40 h-40 text-blue-600" />
              <h1 className="mt-6 text-5xl font-extrabold text-slate-800 tracking-tight">READ:ENG</h1>
              <div className="mt-16 flex flex-col items-center gap-4">
                <button onClick={onNavigateToSignup} className="text-blue-600 text-base underline">
                  계정이 없으신가요? 회원가입
                </button>
                <button onClick={() => setShowSupportModal(true)} className="text-gray-600 text-base underline">
                  로그인에 문제가 있으신가요? 고객센터
                </button>
              </div>
            </div>

            {/* Right side - auth form (keeps inner white card) */}
            <div className="col-span-3 flex flex-col justify-center items-center p-12 bg-sky-50">
              <div className="w-full max-w-md mx-auto bg-white border border-gray-200 rounded-xl shadow-sm p-8 flex flex-col min-h-[520px]">
                <h2 className="text-3xl font-bold text-slate-800 mb-8">로그인</h2>

                <div className="border-b border-gray-200 mb-6">
                  <div className="flex -mb-px overflow-x-auto no-scrollbar">
                    <button
                      onClick={() => handleTabChange('student')}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold border-b-2 transition-colors ${
                        loginType === 'student' ? 'text-blue-600 border-blue-600' : 'text-gray-500 border-transparent hover:text-gray-700'
                      }`}
                    >
                      <StudentLoginIcon />
                      <span>학생 로그인</span>
                    </button>
                    <button
                      onClick={() => handleTabChange('teacher')}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold border-b-2 transition-colors ${
                        loginType === 'teacher' ? 'text-blue-600 border-blue-600' : 'text-gray-500 border-transparent hover:text-gray-700'
                      }`}
                    >
                      <TeacherLoginIcon />
                      <span>선생님/개인사용자</span>
                    </button>
                  </div>
                </div>

                <form id="login-form-desktop" onSubmit={handleFormSubmit} className="flex-1 flex flex-col space-y-6">
                  {loginType === 'student' ? renderStudentForm('-desktop') : renderTeacherForm('-desktop')}

                  <div>
                    <label htmlFor="password-main-desktop" className="block text-sm font-semibold text-slate-700 mb-2">비밀번호</label>
                    <div className="relative">
                      <input
                        id="password-main-desktop"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                        className="w-full p-4 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500"
                        placeholder="비밀번호를 입력해주세요"
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400">
                        {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                      </button>
                    </div>
                  </div>

                  {error && <p className="text-red-500 text-sm text-center">{error}</p>}

                </form>
                <div className="mt-auto">
                  <button form="login-form-desktop" type="submit" className="w-full bg-blue-600 text-white font-bold py-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50" disabled={isLoggingIn}>
                    {isLoggingIn ? '로그인 중...' : '로그인'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile layout (existing) */}
      <div className={`${preferDesktop ? 'hidden' : 'lg:hidden'} p-8 flex-1 flex flex-col h-full`}>
        <div className="w-full max-w-sm mx-auto h-full flex flex-col">
          <h1 className="text-3xl font-bold text-slate-800 text-center mb-10">로그인</h1>
          <div className="border-b border-gray-200 mb-6">
            <div className="flex -mb-px">
              <button
                onClick={() => handleTabChange('student')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold border-b-2 transition-colors ${
                  loginType === 'student' ? 'text-blue-600 border-blue-600' : 'text-gray-500 border-transparent hover:text-gray-700'
                }`}
              >
                <StudentLoginIcon />
                <span>학생 로그인</span>
              </button>
              <button
                onClick={() => handleTabChange('teacher')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold border-b-2 transition-colors ${
                  loginType === 'teacher' ? 'text-blue-600 border-blue-600' : 'text-gray-500 border-transparent hover:text-gray-700'
                }`}
              >
                <TeacherLoginIcon />
                <span>선생님/개인사용자</span>
              </button>
            </div>
          </div>

          <form id="login-form-mobile" onSubmit={handleFormSubmit} className="min-h-[420px] flex-1 flex flex-col space-y-6 pb-2">
            {loginType === 'student' ? renderStudentForm('-mobile') : renderTeacherForm('-mobile')}

            <div>
              <label htmlFor="password-main-mobile" className="block text-sm font-semibold text-slate-700 mb-2">비밀번호</label>
              <div className="relative">
                <input
                  id="password-main-mobile"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="w-full p-4 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500"
                  placeholder="비밀번호를 입력해주세요"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400">
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            {error && <p className="text-red-500 text-sm text-center">{error}</p>}

            <div className="mt-auto pt-2">
              <button form="login-form-mobile" type="submit" className="w-full bg-blue-600 text-white font-bold py-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50" disabled={isLoggingIn}>
                {isLoggingIn ? '로그인 중...' : '로그인'}
              </button>
            </div>
          </form>

          <div className="text-center mt-8">
            <button onClick={onNavigateToSignup} className="text-sm text-blue-600 underline">
              계정이 없으신가요? 회원가입
            </button>
            <button onClick={() => setShowSupportModal(true)} className="block w-full text-center text-sm text-gray-500 underline mt-8">
              로그인에 문제가 있으신가요? 고객센터
            </button>
          </div>
        </div>
      </div>

      {showSupportModal && <CustomerSupportModal onClose={() => setShowSupportModal(false)} />}
    </div>
  );
};

export default LoginPage;
