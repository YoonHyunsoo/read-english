// Using `any` for the Json type to avoid "type instantiation is excessively deep" errors with Supabase.
export type Json = any;

export type UserRole = 'master' | 'admin' | 'teacher' | 'student' | 'individual';

export type ActivityType = 'vocab' | 'listening' | 'reading' | 'grammar' | 'empty';

export type ActiveTab = 'class' | 'review' | 'progress' | 'master' | 'classes' | 'students' | 'materials' | 'none' | 'settings' | 'listeningQuiz';

export interface ClassInfo {
  id: string;
  name: string;
  description?: string;
  grade: string[];
  teacherEmail: string;
  institution?: string;
}

// New type for the central vocab database
export interface VocabItem {
  vocabId: string; // e.g., 'apple_1'
  word: string; // e.g., 'apple'
  level: number;
  wordNo: number;
  partofspeech: string;
  meaningKor: string;
  meaningEng: string;
  sentence?: string;
}


// New types for curriculum
export interface ClassFormatActivity {
  id: string; // Unique ID for the slot in the format
  type: ActivityType;
  level: number;
}

export interface Curriculum {
  numberOfDays: number;
  classFormat: ClassFormatActivity[];
  startedDays?: number[];
}

// For displaying to the student, this is dynamically generated
export interface Activity {
  id: string; // Dynamically generated unique ID, e.g., "day-1-activity-0"
  type: ActivityType;
  level: number;
}
export interface Day {
  id: number;
  title: string;
  isLocked: boolean;
  activities: Activity[];
}


// Universal types that are still in use
export interface Question {
  word: string; // Korean word or Question text
  options: string[]; // English options
  correctAnswer: string; // Correct English translation
  explanation?: string;
}

export interface Quiz {
  activityId: string;
  title: string;
  activityType: 'vocab' | 'grammar' | 'listening';
  questions: Question[];
}

// New types for Reading & Listening Activities
export interface ReadingMCQ {
  question_text: string;
  options: string[];
  answer: string;
}

export interface ReadingMaterial {
  id: string; // The content ID from the DB (e.g., 'reading_1_1')
  level: number;
  day: number;
  title: string;
  passage: string;
  mcqs: ReadingMCQ[];
  vocabItems: VocabItem[];
  activityType: 'reading';
  activityId?: string; // The dynamic activity ID
}

export interface ListeningMaterial {
    id: string;
    level: number;
    day: number;
    title: string;
    script: string;
    mcqs: ReadingMCQ[];
    vocabItems: VocabItem[];
    activityType: 'listening';
    activityId?: string;
}

// For teacher curriculum preview
export interface DayActivityContentForTeacher {
  activity: Activity;
  content?: VocabItem | ReadingMaterial | ListeningMaterial | LeveledQuestion;
}

// Old LeveledQuestion - can be deprecated if all questions follow MCQ format
export interface LeveledQuestion {
  id: string;
  text: string;
  options: string[];
  answer: string;
}

export interface Level {
  level: number;
  questions: LeveledQuestion[];
}


export interface ProgressRecord {
    id: number;
    userEmail: string;
    title: string;
    score: number;
    total: number;
    date: string; // ISO string
}

export interface User {
  name: string;
  email: string;
  role: UserRole;
  password?: string;
  institution?: string;
  teacherEmail?: string; // For teachers, associates with an institution
  grade?: string;
  studentId?: string; // For student login
  vocabLevel?: number; // For student self-study
  stars?: number;
  status?: 'active' | 'ghost';
  archivedAt?: string;
  originalEmail?: string;
}


// New Log Types
export interface StudentStudyDetails {
    activityId?: string;
    contentId?: number; // from vocab_content, reading_content etc.
}

export interface StudentStudyLog {
  id: number;
  timestamp: string;
  user_email: string | null;
  user_name: string | null;
  institution: string | null;
  class_id: string | null;
  class_name: string | null;
  activity_type: string | null;
  activity_title: string | null;
  level: number | null;
  score: number | null;
  total_questions: number | null;
  details: StudentStudyDetails | null;
}

export type UserActionType = 'create_user' | 'update_user_role' | 'archive_user' | 'delete_user' | 'update_user_info' | 'delegate_admin';

export interface UserActionDetails {
    changes?: {
        field: string;
        from: Json;
        to: Json;
    }[];
    note?: string;
}

export interface UserActionLog {
    id: number;
    timestamp: string;
    actor_email: string | null;
    actor_name: string | null;
    action_type: UserActionType;
    target_email: string;
    target_name: string | null;
    target_role: string | null;
    institution: string | null;
    details: UserActionDetails | null;
}