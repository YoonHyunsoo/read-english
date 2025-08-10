import React from 'react';
import { Quiz, User, ClassInfo } from '../types';
import QuizView from '../components/QuizView';
import PageIdentifier from '../components/DevTools/PageIdentifier';

interface VocabQuizViewProps {
  quiz: Quiz;
  onFinish: () => void;
  currentUser: User;
  classInfo?: ClassInfo;
}

const VocabQuizView: React.FC<VocabQuizViewProps> = ({ quiz, onFinish, currentUser, classInfo }) => {
  return (
    <div className="flex flex-col h-full bg-transparent">
      <PageIdentifier path="pages/VocabQuizView.tsx" />
      <QuizView 
        quiz={quiz} 
        classInfo={classInfo}
        onBack={onFinish} 
        currentUser={currentUser} 
      />
    </div>
  );
};

export default VocabQuizView;