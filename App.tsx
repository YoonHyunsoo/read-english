
import React, { useState, useEffect } from 'react';
import FooterNav from './components/FooterNav';
import DesktopLayout from './components/DesktopLayout';
import ClassPage from './pages/ClassPage';
import ReviewPage from './pages/ReviewPage';
import ProgressPage from './pages/ProgressPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import MasterPage from './pages/AdminPage';
import ClassesPage from './pages/ClassesPage';
import StudentsPage from './pages/StudentsPage';
import SettingsPage from './pages/SettingsPage';
import Header from './components/Header';
import { ActiveTab, Quiz, User, ClassInfo, ReadingMaterial, Activity, VocabItem, ListeningMaterial } from './types';
import SplashScreen from './components/SplashScreen';
import { AppLogo } from './components/icons';
import ListeningQuizView from './pages/ListeningQuizView';
import ReadingActivityView from './pages/ReadingActivityView';
import CurriculumSetupPage from './pages/CurriculumSetupPage';
import MaterialsPage from './pages/MaterialsPage';
import AdminPanelPage from './pages/AdminPanelPage';
import TeacherLogsPage from './pages/TeacherLogsPage';
import WordbookPage from './pages/WordbookPage';
import VocabPreviewModal from './components/VocabPreviewModal';
import { getVocabForActivity, getVocabQuiz, getListeningMaterial, getReadingMaterialForActivity } from './services/api';
import VocabQuizView from './pages/VocabQuizView';
import TeacherClassSessionPage from './pages/TeacherClassSessionPage';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authPage, setAuthPage] = useState<'login' | 'signup'>('login');
  const [activeTab, setActiveTab] = useState<ActiveTab>('class');
  const [showSplash, setShowSplash] = useState(true);
  
  // State for full-screen views
  const [vocabQuizContext, setVocabQuizContext] = useState<{ quiz: Quiz; classInfo?: ClassInfo } | null>(null);
  const [listeningActivityContext, setListeningActivityContext] = useState<{ material: ListeningMaterial, classInfo?: ClassInfo } | null>(null);
  const [readingActivityContext, setReadingActivityContext] = useState<{ material: ReadingMaterial, classInfo?: ClassInfo } | null>(null);
  const [editingCurriculumForClassId, setEditingCurriculumForClassId] = useState<string | null>(null);
  const [viewingStudentsForClassId, setViewingStudentsForClassId] = useState<string | null>(null);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showTeacherLogs, setShowTeacherLogs] = useState(false);
  const [showWordbook, setShowWordbook] = useState(false);
  const [isWide, setIsWide] = useState<boolean>(() => typeof window !== 'undefined' ? window.innerWidth >= 1024 : false);
  const [activeClassSession, setActiveClassSession] = useState<{ classId: string; dayId: number } | null>(null);

  // State for new unified vocab flow
  const [vocabToPreview, setVocabToPreview] = useState<VocabItem[] | null>(null);
  const [activityAfterPreview, setActivityAfterPreview] = useState<{ content: Quiz | ReadingMaterial | ListeningMaterial, classInfo?: ClassInfo } | null>(null);
  
  // Centralized tab navigation to close overlays like Admin Panel / Logs
  const navigateTab = (tab: ActiveTab) => {
    setActiveTab(tab);
    setShowAdminPanel(false);
    setShowTeacherLogs(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleResize = () => setIsWide(window.innerWidth >= 1024);
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize as EventListener);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize as EventListener);
    };
  }, []);

  const handleStartActivity = async (activity: Activity, classInfo: ClassInfo) => {
    try {
      const vocabItems = await getVocabForActivity(activity, classInfo.id);

      let mainContent: Quiz | ReadingMaterial | ListeningMaterial | null = null;
      if (activity.type === 'vocab') {
        mainContent = await getVocabQuiz(activity, classInfo.id);
      } else if (activity.type === 'listening') {
        mainContent = await getListeningMaterial(activity, classInfo.id);
      } else if (activity.type === 'reading') {
        mainContent = await getReadingMaterialForActivity(activity, classInfo.id);
      } else {
        alert(`${activity.type} 활동은 아직 구현되지 않았습니다.`);
        return;
      }

      if (!mainContent) {
        throw new Error("학습 콘텐츠를 불러올 수 없습니다.");
      }

      if (vocabItems && vocabItems.length > 0) {
        setActivityAfterPreview({ content: mainContent, classInfo });
        setVocabToPreview(vocabItems);
      } else {
        // No vocab to preview, start activity directly
        if (mainContent.activityType === 'vocab') setVocabQuizContext({ quiz: mainContent as Quiz, classInfo });
        else if (mainContent.activityType === 'listening') setListeningActivityContext({ material: mainContent as ListeningMaterial, classInfo });
        else if (mainContent.activityType === 'reading') setReadingActivityContext({ material: mainContent as ReadingMaterial, classInfo });
      }
    } catch (error) {
      console.error("Failed to start activity:", error);
      alert("활동을 시작하는 중 오류가 발생했습니다. 다시 시도해 주세요.");
    }
  };

  const handleFinishVocabPreview = () => {
    setVocabToPreview(null);
    if (activityAfterPreview) {
      const { content, classInfo } = activityAfterPreview;
      if (content.activityType === 'vocab') setVocabQuizContext({ quiz: content as Quiz, classInfo });
      else if (content.activityType === 'listening') setListeningActivityContext({ material: content as ListeningMaterial, classInfo });
      else if (content.activityType === 'reading') setReadingActivityContext({ material: content as ReadingMaterial, classInfo });
      setActivityAfterPreview(null);
    }
  };
  
  const handleStartMaterial = (content: Quiz | ReadingMaterial | ListeningMaterial) => {
    if (content.activityType === 'vocab') {
      setVocabQuizContext({ quiz: content as Quiz, classInfo: undefined });
    } else if (content.activityType === 'listening') {
      setListeningActivityContext({ material: content as ListeningMaterial, classInfo: undefined });
    } else if (content.activityType === 'reading') {
      setReadingActivityContext({ material: content as ReadingMaterial, classInfo: undefined });
    }
  };

  // Simple event-based nav for Wordbook page
  useEffect(() => {
    const handler = () => setShowWordbook(true);
    window.addEventListener('navigate-to-wordbook', handler as EventListener);
    return () => window.removeEventListener('navigate-to-wordbook', handler as EventListener);
  }, []);

  useEffect(() => {
    const closeHandler = () => setShowWordbook(false);
    window.addEventListener('close-wordbook', closeHandler as EventListener);
    return () => window.removeEventListener('close-wordbook', closeHandler as EventListener);
  }, []);

  const handleAdminPanelClose = (updatedUser?: User) => {
    if (updatedUser) setCurrentUser(updatedUser);
    setShowAdminPanel(false);
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    switch (user.role) {
      case 'master': setActiveTab('master'); break;
      case 'admin': case 'teacher': setActiveTab('classes'); break;
      case 'individual': setActiveTab('materials'); break;
      case 'student': default: setActiveTab('class'); break;
    }
  };
  
  const handleLogout = () => {
    setCurrentUser(null);
    setAuthPage('login');
    setActiveTab('none');
    setEditingCurriculumForClassId(null);
    setViewingStudentsForClassId(null);
    setShowAdminPanel(false);
    setShowTeacherLogs(false);
  };

  const renderContent = () => {
    if (!currentUser) return null;

    const { role } = currentUser;
    const isStudentOrIndividual = role === 'student' || role === 'individual';
    const isTeacherOrAdmin = role === 'teacher' || role === 'admin';

    switch (activeTab) {
      case 'class':
        return role === 'student' ? <ClassPage onStartActivity={handleStartActivity} currentUser={currentUser} /> : null;
      case 'review':
        return isStudentOrIndividual ? <ReviewPage currentUser={currentUser} /> : null;
      case 'progress':
        return isStudentOrIndividual ? <ProgressPage currentUser={currentUser} /> : null;
      case 'classes':
        return isTeacherOrAdmin ? (
          <ClassesPage
            teacher={currentUser}
            onManageCurriculum={setEditingCurriculumForClassId}
            onManageStudents={setViewingStudentsForClassId}
            onEnterClassSession={(classId, dayId) => setActiveClassSession({ classId, dayId })}
          />
        ) : null;
      case 'materials':
        if (isTeacherOrAdmin || role === 'individual') {
          return (
            <MaterialsPage
              currentUser={currentUser}
              onStartActivity={role === 'individual' ? (payload, _classInfo) => handleStartMaterial(payload) : undefined}
            />
          );
        }
        return null;
       case 'students':
        return isTeacherOrAdmin ? <StudentsPage teacher={currentUser} /> : null;
       case 'master':
        return role === 'master' ? <MasterPage currentUser={currentUser}/> : null;
      case 'settings':
        return <SettingsPage currentUser={currentUser} onLogout={handleLogout} />;
      default:
        if (role === 'student') return <ClassPage onStartActivity={handleStartActivity} currentUser={currentUser} />;
        if (role === 'individual') return <MaterialsPage currentUser={currentUser} onStartActivity={(payload, _classInfo) => handleStartMaterial(payload)} />;
        if (isTeacherOrAdmin) return <ClassesPage teacher={currentUser} onManageCurriculum={setEditingCurriculumForClassId} onManageStudents={setViewingStudentsForClassId} />;
        if (role === 'master') return <MasterPage currentUser={currentUser} />;
        return null;
    }
  };
  
  // Full-screen views
  if (currentUser) {
    const role = currentUser.role;

    if (showTeacherLogs && role === 'teacher') {
      if (isWide) {
        return (
          <DesktopLayout currentUser={currentUser} activeTab={activeTab} setActiveTab={navigateTab} onLogout={handleLogout} onOpenAdminPanel={() => setShowAdminPanel(true)} onOpenTeacherLogs={() => setShowTeacherLogs(true)}>
            <TeacherLogsPage currentUser={currentUser} onClose={() => setShowTeacherLogs(false)} />
          </DesktopLayout>
        );
      }
      return <div className="app-frame"><TeacherLogsPage currentUser={currentUser} onClose={() => setShowTeacherLogs(false)} /></div>;
    }
    if (showAdminPanel && (role === 'admin' || role === 'master')) {
      if (isWide) {
        return (
          <DesktopLayout currentUser={currentUser} activeTab={activeTab} setActiveTab={navigateTab} onLogout={handleLogout} onOpenAdminPanel={() => setShowAdminPanel(true)} onOpenTeacherLogs={() => setShowTeacherLogs(true)}>
            <AdminPanelPage currentUser={currentUser} onClose={handleAdminPanelClose} />
          </DesktopLayout>
        );
      }
      return <div className="app-frame"><AdminPanelPage currentUser={currentUser} onClose={handleAdminPanelClose} /></div>;
    }
    if (showWordbook) {
      if (isWide) {
        return (
          <DesktopLayout currentUser={currentUser} activeTab={activeTab} setActiveTab={navigateTab} onLogout={handleLogout} onOpenAdminPanel={() => setShowAdminPanel(true)} onOpenTeacherLogs={() => setShowTeacherLogs(true)}>
            <WordbookPage currentUser={currentUser} />
          </DesktopLayout>
        );
      }
      return <div className="app-frame"><WordbookPage currentUser={currentUser} /></div>;
    }
    if (activeClassSession) {
      if (isWide) {
        return (
          <DesktopLayout currentUser={currentUser} activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout}>
            <TeacherClassSessionPage currentUser={currentUser} classId={activeClassSession.classId} dayId={activeClassSession.dayId} onClose={() => setActiveClassSession(null)} />
          </DesktopLayout>
        );
      }
      return (
        <div className="app-frame">
          <TeacherClassSessionPage currentUser={currentUser} classId={activeClassSession.classId} dayId={activeClassSession.dayId} onClose={() => setActiveClassSession(null)} />
        </div>
      );
    }
    if (vocabQuizContext) {
      return <div className="app-frame"><VocabQuizView quiz={vocabQuizContext.quiz} classInfo={vocabQuizContext.classInfo} onFinish={() => setVocabQuizContext(null)} currentUser={currentUser} /></div>;
    }
    if (listeningActivityContext) {
      return <div className="app-frame"><ListeningQuizView material={listeningActivityContext.material} classInfo={listeningActivityContext.classInfo} onFinish={() => setListeningActivityContext(null)} currentUser={currentUser} /></div>;
    }
    if (readingActivityContext) {
      return <div className="app-frame"><ReadingActivityView material={readingActivityContext.material} classInfo={readingActivityContext.classInfo} onFinish={() => setReadingActivityContext(null)} currentUser={currentUser} /></div>;
    }
    if (editingCurriculumForClassId) {
      if (isWide) {
        return (
          <DesktopLayout currentUser={currentUser} activeTab={activeTab} setActiveTab={navigateTab} onLogout={handleLogout} onOpenAdminPanel={() => setShowAdminPanel(true)} onOpenTeacherLogs={() => setShowTeacherLogs(true)}>
            <CurriculumSetupPage classId={editingCurriculumForClassId} onClose={() => setEditingCurriculumForClassId(null)} />
          </DesktopLayout>
        );
      }
      return <div className="app-frame"><CurriculumSetupPage classId={editingCurriculumForClassId} onClose={() => setEditingCurriculumForClassId(null)} /></div>;
    }
    if (viewingStudentsForClassId) {
      if (isWide) {
        return (
          <DesktopLayout currentUser={currentUser} activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} onOpenAdminPanel={() => setShowAdminPanel(true)} onOpenTeacherLogs={() => setShowTeacherLogs(true)}>
            <StudentsPage classId={viewingStudentsForClassId} teacher={currentUser} onClose={() => setViewingStudentsForClassId(null)} />
          </DesktopLayout>
        );
      }
      return <div className="app-frame"><StudentsPage classId={viewingStudentsForClassId} teacher={currentUser} onClose={() => setViewingStudentsForClassId(null)} /></div>;
    }
  }

  // Desktop-shell for wide screens (all roles)
  if (currentUser && isWide) {
    return (
      <DesktopLayout currentUser={currentUser} activeTab={activeTab} setActiveTab={navigateTab} onLogout={handleLogout} onOpenAdminPanel={() => setShowAdminPanel(true)} onOpenTeacherLogs={() => setShowTeacherLogs(true)}>
        <>
          {vocabToPreview && (
            <VocabPreviewModal
              vocabItems={vocabToPreview}
              onClose={() => setVocabToPreview(null)}
              onStart={handleFinishVocabPreview}
            />
          )}
          {renderContent()}
        </>
      </DesktopLayout>
    );
  }

  // Auth screens: show desktop-friendly login/signup when wide
  if (!currentUser && isWide) {
    return (
      <div className="min-h-screen bg-sky-100">
        {authPage === 'login' ? (
          <LoginPage preferDesktop onLoginSuccess={handleLoginSuccess} onNavigateToSignup={() => setAuthPage('signup')} />
        ) : (
          <SignupPage onNavigateToLogin={() => setAuthPage('login')} />
        )}
      </div>
    );
  }

  // Mobile-shell for narrow screens and Auth screens
  return (
    <div className="flex justify-center items-start min-h-screen bg-sky-100">
      <div className="relative w-[390px] h-[844px] bg-white flex flex-col justify-between shadow-2xl overflow-hidden">
        {vocabToPreview && <VocabPreviewModal vocabItems={vocabToPreview} onClose={() => setVocabToPreview(null)} onStart={handleFinishVocabPreview} />}
        {showSplash ? <SplashScreen /> : (
          <>
            <div className="absolute inset-0 flex justify-center items-center z-0 pointer-events-none">
              <AppLogo className="w-2/3 h-2/3 text-blue-100" />
            </div>
            {currentUser ? (
                <>
                  <Header activeTab={activeTab} currentUser={currentUser} onNavigateToAdminPanel={() => setShowAdminPanel(true)} onNavigateToTeacherLogs={() => setShowTeacherLogs(true)} />
                  <div className="relative z-10 flex-grow overflow-y-auto bg-transparent">
                    {renderContent()}
                  </div>
                  <FooterNav activeTab={activeTab} setActiveTab={setActiveTab} role={currentUser.role} />
                </>
            ) : (
              <div className="relative z-10 h-full">
                {authPage === 'login' ? <LoginPage onLoginSuccess={handleLoginSuccess} onNavigateToSignup={() => setAuthPage('signup')} /> : <SignupPage onNavigateToLogin={() => setAuthPage('login')} />}
              </div>
            )}
          </>
        )}
      </div>
      <style>{`.app-frame { display: flex; justify-content: center; align-items: start; min-height: 100vh; background-color: #f0f9ff; } .app-frame > div { position: relative; width: 390px; height: 844px; background-color: white; display: flex; flex-direction: column; justify-content: space-between; box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1); overflow: hidden; }`}</style>
    </div>
  );
};

export default App;
