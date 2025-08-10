





import { Day, Quiz, User, UserRole, ActivityType, Curriculum, Activity, ClassInfo, LeveledQuestion, ProgressRecord, UserActionType, StudentStudyLog, UserActionLog, StudentStudyDetails, UserActionDetails, ReadingMaterial, VocabItem, ReadingMCQ, Level, DayActivityContentForTeacher, ListeningMaterial, Json } from '../types';
import { getWordbookEntries, getStudiedTodayWords, addStudiedTodayWords } from '../utils/wordbook';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Database types mirroring the lowercase SQL schema
export type Database = {
  public: {
    Tables: {
      users: {
        Row: { email: string; grade?: string | null; institution?: string | null; name: string; password?: string | null; role: 'master' | 'admin' | 'teacher' | 'student' | 'individual'; teacher_email?: string | null; vocab_level?: number | null; stars?: number | null; status: 'active' | 'ghost'; archived_at?: string | null; original_email?: string | null; };
        Insert: { email: string; grade?: string | null; institution?: string | null; name: string; password?: string | null; role: 'master' | 'admin' | 'teacher' | 'student' | 'individual'; teacher_email?: string | null; vocab_level?: number | null; stars?: number | null; status?: 'active' | 'ghost'; archived_at?: string | null; original_email?: string | null; };
        Update: { email?: string; grade?: string | null; institution?: string | null; name?: string; password?: string | null; role?: 'master' | 'admin' | 'teacher' | 'student' | 'individual'; teacher_email?: string | null; vocab_level?: number | null; stars?: number | null; status?: 'active' | 'ghost'; archived_at?: string | null; original_email?: string | null; };
      };
      classes: {
        Row: { description?: string | null; grade?: string[] | null; id: string; name: string; teacher_email: string; institution?: string | null; };
        Insert: { description?: string | null; grade: string[]; id: string; name: string; teacher_email: string; institution?: string | null; };
        Update: { description?: string | null; grade?: string[]; id?: string; name?: string; teacher_email?: string; institution?: string | null; };
      };
      class_members: {
        Row: { class_id: string; user_email: string; };
        Insert: { class_id: string; user_email: string; };
        Update: { class_id?: string; user_email?: string; };
      };
      curriculums: {
        Row: { classid: string; curriculumdata: Curriculum | null; };
        Insert: { classid: string; curriculumdata?: Curriculum | null; };
        Update: { classid?: string; curriculumdata?: Curriculum | null; };
      };
       curriculum_overrides: {
        Row: { activityid: string; classid: string; questionid: string; id: number; };
        Insert: { activityid: string; classid: string; questionid: string; id?: number; };
        Update: { activityid?: string; classid?: string; questionid?: string; id?: number; };
      };
      student_study_logs: {
        Row: { id: number; timestamp: string; user_email?: string | null; user_name?: string | null; institution?: string | null; class_id?: string | null; class_name?: string | null; activity_type?: string | null; activity_title?: string | null; level?: number | null; score?: number | null; total_questions?: number | null; details?: StudentStudyDetails | null; };
        Insert: { id?: number; timestamp?: string; user_email?: string | null; user_name?: string | null; institution?: string | null; class_id?: string | null; class_name?: string | null; activity_type?: string | null; activity_title?: string | null; level?: number | null; score?: number | null; total_questions?: number | null; details?: StudentStudyDetails | null; };
        Update: { id?: number; timestamp?: string; user_email?: string | null; user_name?: string | null; institution?: string | null; class_id?: string | null; class_name?: string | null; activity_type?: string | null; activity_title?: string | null; level?: number | null; score?: number | null; total_questions?: number | null; details?: StudentStudyDetails | null; };
      };
      user_action_logs: {
        Row: { id: number; timestamp: string; actor_email?: string | null; actor_name?: string | null; action_type: 'create_user' | 'update_user_role' | 'archive_user' | 'delete_user' | 'update_user_info' | 'delegate_admin'; target_email: string; target_name?: string | null; target_role?: string | null; institution?: string | null; details?: UserActionDetails | null; };
        Insert: { id?: number; timestamp?: string; actor_email?: string | null; actor_name?: string | null; action_type: 'create_user' | 'update_user_role' | 'archive_user' | 'delete_user' | 'update_user_info' | 'delegate_admin'; target_email: string; target_name?: string | null; target_role?: string | null; institution?: string | null; details?: UserActionDetails | null; };
        Update: { id?: number; timestamp?: string; actor_email?: string | null; actor_name?: string | null; action_type?: 'create_user' | 'update_user_role' | 'archive_user' | 'delete_user' | 'update_user_info' | 'delegate_admin'; target_email?: string; target_name?: string | null; target_role?: string | null; institution?: string | null; details?: UserActionDetails | null; };
      };
      vocab_database: {
        Row: { vocab_id: string; word: string; word_no: number; part_of_speech: string; meaning_eng: string; meaning_kor: string; sentence: string | null; level: number; };
        Insert: { vocab_id: string; word: string; word_no: number; part_of_speech: string; meaning_eng: string; meaning_kor: string; sentence?: string | null; level: number; };
        Update: { vocab_id?: string; word?: string; word_no?: number; part_of_speech?: string; meaning_eng?: string; meaning_kor?: string; sentence?: string | null; level?: number; };
      };
      listening_materials: {
        Row: { id: string; title: string; level: number; day: number; vocab_words: string[] | null; script: string | null; questions: ReadingMCQ[] | null; };
        Insert: { id: string; title: string; level: number; day: number; vocab_words?: string[] | null; script?: string | null; questions?: ReadingMCQ[] | null; };
        Update: { id?: string; title?: string; level?: number; day?: number; vocab_words?: string[] | null; script?: string | null; questions?: ReadingMCQ[] | null; };
      };
      reading_materials: {
        Row: { id: string; title: string; level: number; day: number; vocab_words: string[] | null; passage?: string | null; questions: ReadingMCQ[] | null; };
        Insert: { id: string; title: string; level: number; day: number; vocab_words?: string[] | null; passage?: string | null; questions?: ReadingMCQ[] | null; };
        Update: { id?: string; title?: string; level?: number; day?: number; vocab_words?: string[] | null; passage?: string | null; questions?: ReadingMCQ[] | null; };
      };
      grammar_materials: {
        Row: { id: string; level: number; day: number; title: string; questions: any[]; activity_type?: string | null };
        Insert: { id: string; level: number; day: number; title: string; questions?: any[]; activity_type?: string | null };
        Update: { id?: string; level?: number; day?: number; title?: string; questions?: any[]; activity_type?: string | null };
      };
    };
    Views: {};
    Functions: {};
    Enums: { user_role: "master" | "admin" | "teacher" | "student" | "individual"; user_status: 'active' | 'ghost' };
    CompositeTypes: {};
  };
};

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase: SupabaseClient<Database> | null = null;

export function getSupabaseClient(): SupabaseClient<Database> {
  if (supabase) return supabase;
  
  // Validate that environment variables are set
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase environment variables are not configured. Please check your .env file and ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.');
  }
  
  supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
  return supabase;
}

// --- Internal Logging ---
async function _logUserAction(actor: User, actionType: UserActionType, target: Partial<User>, details?: UserActionDetails): Promise<void> {
    const supabase = getSupabaseClient();
    if (!target.email) return;

    const logEntry: Database['public']['Tables']['user_action_logs']['Insert'] = {
        actor_email: actor.email,
        actor_name: actor.name,
        action_type: actionType,
        target_email: target.email,
        target_name: target.name ?? null,
        target_role: target.role ?? null,
        institution: target.institution ?? null,
        details: details ?? null
    };

    const { error } = await supabase.from('user_action_logs').insert([logEntry]);
    if (error) console.error("Failed to log user action:", JSON.stringify(error, null, 2));
}

// --- Data Mapping ---
const mapUserFromDb = (dbUser: Database['public']['Tables']['users']['Row']): User => ({
    email: dbUser.email,
    name: dbUser.name,
    role: dbUser.role,
    institution: dbUser.institution || undefined,
    teacherEmail: dbUser.teacher_email || undefined,
    grade: dbUser.grade || undefined,
    studentId: dbUser.student_id || undefined,
    vocabLevel: dbUser.vocab_level ?? undefined,
    stars: dbUser.stars ?? 0,
    status: (dbUser as any).status,
    archivedAt: (dbUser as any).archived_at ?? undefined,
    originalEmail: (dbUser as any).original_email ?? undefined,
});

const mapClassFromDb = (dbClass: Database['public']['Tables']['classes']['Row']): ClassInfo => ({
    id: dbClass.id,
    name: dbClass.name,
    description: dbClass.description || undefined,
    grade: dbClass.grade || [],
    teacherEmail: dbClass.teacher_email,
    institution: dbClass.institution || undefined,
});

// Grammar materials are stored as units with questions JSON. We'll flatten to LeveledQuestion.
const parseGrammarQuestions = (questions: unknown, unitId: string): LeveledQuestion[] => {
  let result: LeveledQuestion[] = [];
  try {
    const raw = Array.isArray(questions) ? questions : typeof questions === 'string' ? JSON.parse(questions) : [];
    if (Array.isArray(raw)) {
      result = raw
        .filter((q) => q && typeof q.text === 'string' && Array.isArray(q.options) && typeof q.answer === 'string')
        .map((q, idx) => ({ id: `${unitId}#${idx}`, text: (q as any).text, options: (q as any).options, answer: (q as any).answer }));
    }
  } catch (e) {
    console.error(`Failed to parse grammar questions for unit ${unitId}`, questions);
  }
  return result;
};

const mapVocabItemFromDb = (v: Database['public']['Tables']['vocab_database']['Row']): VocabItem => ({
  vocabId: v.vocab_id,
  word: v.word,
  level: v.level,
  wordNo: v.word_no,
  partofspeech: v.part_of_speech,
  meaningKor: v.meaning_kor,
  meaningEng: v.meaning_eng,
  sentence: v.sentence || undefined,
});


const safelyParseMcqs = (questions: unknown, unitId: string): ReadingMCQ[] => {
  let mcqs: ReadingMCQ[] = [];
  if (Array.isArray(questions)) {
      mcqs = questions.filter(q => q && typeof q.question_text === 'string' && Array.isArray(q.options) && typeof q.answer === 'string') as ReadingMCQ[];
  } else if (typeof questions === 'string') {
      try {
          const parsed = JSON.parse(questions);
          if (Array.isArray(parsed)) {
              mcqs = parsed.filter(q => q && typeof q.question_text === 'string' && Array.isArray(q.options) && typeof q.answer === 'string') as ReadingMCQ[];
          }
      } catch (e) {
          console.error(`Failed to parse MCQs JSON string for unit ${unitId}`, questions);
      }
  }
  return mcqs;
}


const mapReadingMaterialFromDb = async (dbUnit: Database['public']['Tables']['reading_materials']['Row']): Promise<ReadingMaterial> => {
  let vocabItems: VocabItem[] = [];
  if (dbUnit.vocab_words && dbUnit.vocab_words.length > 0) {
    const { data: vocabData, error: vocabError } = await getSupabaseClient()
      .from('vocab_database')
      .select('*')
      .in('vocab_id', dbUnit.vocab_words);

    if (vocabError) {
      console.error(`Failed to fetch vocab for reading unit ${dbUnit.id}`, vocabError);
    } else {
      vocabItems = (vocabData || []).map(mapVocabItemFromDb);
    }
  }

  const mcqs = safelyParseMcqs(dbUnit.questions, dbUnit.id);
  
  return {
    id: dbUnit.id,
    title: dbUnit.title,
    level: dbUnit.level,
    day: dbUnit.day,
    activityType: 'reading',
    passage: dbUnit.passage || '',
    mcqs: mcqs,
    vocabItems: vocabItems,
    activityId: undefined,
  };
};

const mapListeningMaterialFromDb = async (dbUnit: Database['public']['Tables']['listening_materials']['Row']): Promise<ListeningMaterial> => {
  let vocabItems: VocabItem[] = [];
  if (dbUnit.vocab_words && dbUnit.vocab_words.length > 0) {
    const { data: vocabData, error: vocabError } = await getSupabaseClient()
      .from('vocab_database')
      .select('*')
      .in('vocab_id', dbUnit.vocab_words);

    if (vocabError) {
      console.error(`Failed to fetch vocab for listening unit ${dbUnit.id}`, vocabError);
    } else {
      vocabItems = (vocabData || []).map(mapVocabItemFromDb);
    }
  }

  const mcqs = safelyParseMcqs(dbUnit.questions, dbUnit.id);
  
  return {
    id: dbUnit.id,
    title: dbUnit.title,
    level: dbUnit.level,
    day: dbUnit.day,
    activityType: 'listening',
    script: dbUnit.script || '',
    mcqs: mcqs,
    vocabItems: vocabItems,
    activityId: undefined,
  };
};


// --- Institution Domain Management ---
export async function getOrCreateInstitutionDomain(institutionName: string): Promise<string> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.rpc('get_or_create_institution_domain', {
        institution_name: institutionName
    });
    
    if (error) {
        console.error('Error getting/creating institution domain:', error);
        throw error;
    }
    
    return data;
}

export async function createStudentEmailFromDB(studentId: string, institutionName: string): Promise<string> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.rpc('create_student_email', {
        student_id: studentId,
        institution_name: institutionName
    });
    
    if (error) {
        console.error('Error creating student email:', error);
        throw error;
    }
    
    return data;
}

// --- User Management ---
export async function authenticateUser(email: string, password?: string): Promise<User | null> {
    const supabase = getSupabaseClient();
    let query = supabase.from('users').select('*').eq('email', email);
    if (password !== undefined) query = query.eq('password', password);

    const { data, error } = await query.single();
    if (error && error.code !== 'PGRST116') console.error('Auth error:', error);
    return data ? mapUserFromDb(data) : null;
}

export async function fetchAllUsers(): Promise<{ success: boolean; data: User[]; error?: any; }> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.from('users').select('email, name, role, institution, teacher_email, grade, student_id, vocab_level, stars, status, archived_at, original_email');
    if (error) {
        console.error('Error fetching all users:', error);
        return { success: false, data: [], error };
    }
    return { success: true, data: data ? data.map(mapUserFromDb) : [] };
}

export async function createUser(newUser: User, actor?: User): Promise<{ success: boolean; error?: string }> {
    const supabase = getSupabaseClient();
    // Ensure institution domain exists for teacher/admin on create
    try {
        if (newUser.institution && (newUser.role === 'teacher' || newUser.role === 'admin')) {
            await getOrCreateInstitutionDomain(newUser.institution);
        }
    } catch (e) {
        console.error('Domain ensure failed during createUser:', e);
        // Non-blocking: proceed with user creation even if domain ensure fails
    }
    const { data: existingUser } = await supabase.from('users').select('email').eq('email', newUser.email).maybeSingle();
    if (existingUser) return { success: false, error: '이 이메일 주소는 이미 사용 중입니다.' };

    const userToInsert: Database['public']['Tables']['users']['Insert'] = {
        email: newUser.email,
        name: newUser.name,
        password: newUser.password ?? null,
        role: newUser.role,
        institution: newUser.institution ?? null,
        teacher_email: newUser.teacherEmail ?? null,
        grade: newUser.grade ?? null,
        vocab_level: newUser.vocabLevel ?? null,
        stars: newUser.stars ?? 0,
    };

    const { error } = await supabase.from('users').insert([userToInsert]);
    if (error) {
        console.error("Error creating user:", error.message, error);
        return { success: false, error: error.message };
    }

    if(actor) await _logUserAction(actor, 'create_user', newUser);
    return { success: true };
}

export async function updateUser(userToUpdate: User, actor: User): Promise<{ success: boolean }> {
    const supabase = getSupabaseClient();
    const originalUser = await authenticateUser(userToUpdate.email);
    if (!originalUser) return { success: false };

    const updatePayload: Database['public']['Tables']['users']['Update'] = {};

    if (userToUpdate.name !== undefined) updatePayload.name = userToUpdate.name;
    if (userToUpdate.role !== undefined) updatePayload.role = userToUpdate.role;
    if (userToUpdate.institution !== undefined) updatePayload.institution = userToUpdate.institution;
    if (userToUpdate.teacherEmail !== undefined) updatePayload.teacher_email = userToUpdate.teacherEmail;
    if (userToUpdate.grade !== undefined) updatePayload.grade = userToUpdate.grade;
    if (userToUpdate.password !== undefined) updatePayload.password = userToUpdate.password;
    if (userToUpdate.vocabLevel !== undefined) updatePayload.vocab_level = userToUpdate.vocabLevel;
    if (userToUpdate.stars !== undefined) updatePayload.stars = userToUpdate.stars;
    
    if (Object.keys(updatePayload).length === 0) {
        return { success: true }; // Nothing to update
    }

    // Ensure institution domain exists if institution is being set/changed for teacher/admin
    try {
        const targetInstitution = userToUpdate.institution;
        const targetRole = userToUpdate.role ?? originalUser.role;
        if (targetInstitution && (targetRole === 'teacher' || targetRole === 'admin')) {
            await getOrCreateInstitutionDomain(targetInstitution);
        }
    } catch (e) {
        console.error('Domain ensure failed during updateUser:', e);
        // Continue even if this fails
    }

    const { error } = await supabase.from('users').update(updatePayload).eq('email', userToUpdate.email);
    if (error) {
        console.error("Update user failed:", error);
        return { success: false };
    }
    
    // Logging changes
    const changes: UserActionDetails['changes'] = [];
    if (updatePayload.name !== undefined && updatePayload.name !== originalUser.name) {
        changes.push({ field: 'name', from: originalUser.name, to: updatePayload.name });
    }
    if (updatePayload.role !== undefined && updatePayload.role !== originalUser.role) {
        changes.push({ field: 'role', from: originalUser.role, to: updatePayload.role });
    }
    if (updatePayload.institution !== undefined && updatePayload.institution !== originalUser.institution) {
        changes.push({ field: 'institution', from: originalUser.institution ?? null, to: updatePayload.institution });
    }
    if (updatePayload.teacher_email !== undefined && updatePayload.teacher_email !== originalUser.teacherEmail) {
        changes.push({ field: 'teacher_email', from: originalUser.teacherEmail ?? null, to: updatePayload.teacher_email });
    }
    if (updatePayload.grade !== undefined && updatePayload.grade !== originalUser.grade) {
        changes.push({ field: 'grade', from: originalUser.grade ?? null, to: updatePayload.grade });
    }
    if (updatePayload.password !== undefined && updatePayload.password !== originalUser.password) {
        changes.push({ field: 'password', from: originalUser.password ?? null, to: updatePayload.password });
    }
    if (updatePayload.vocab_level !== undefined && updatePayload.vocab_level !== originalUser.vocabLevel) {
        changes.push({ field: 'vocab_level', from: originalUser.vocabLevel ?? null, to: updatePayload.vocab_level });
    }

    if (changes.length > 0) {
        await _logUserAction(actor, 'update_user_info', userToUpdate, { changes });
    }
    
    return { success: true };
}

export async function deleteUserByEmail(email: string, actor: User): Promise<{ success: boolean; error?: string }> {
    const supabase = getSupabaseClient();
    const userToDelete = await authenticateUser(email);
    if (!userToDelete) return { success: false, error: "User not found." };
    
    const { error } = await supabase.from('users').delete().eq('email', email);
    if (error) return { success: false, error: error.message };
    
    await _logUserAction(actor, 'delete_user', userToDelete, { note: `User permanently deleted by ${actor.name}.` });
    return { success: true };
}

export async function deleteAllNonMasterUsers(): Promise<void> {
    await getSupabaseClient().from('users').delete().neq('role', 'master');
}

// --- Class Management ---
export async function getClassesForUser(user: User): Promise<ClassInfo[]> {
    const supabase = getSupabaseClient();
    let query;

    if (user.role === 'admin' && user.institution) {
        query = supabase.from('classes').select('*').eq('institution', user.institution);
    } else {
        query = supabase.from('classes').select('*').eq('teacher_email', user.email);
    }
    
    const { data, error } = await query;
    if (error) { console.error(error); return []; }
    return data.map(mapClassFromDb);
}

export async function getClassesForStudent(studentEmail: string): Promise<ClassInfo[]> {
    const supabase = getSupabaseClient();
    const { data: memberships, error: mError } = await supabase.from('class_members').select('class_id').eq('user_email', studentEmail);
    if (mError) { console.error(mError); return []; }
    if (!memberships || memberships.length === 0) return [];
    
    const classIds = memberships.map(m => m.class_id);
    const { data: classes, error: cError } = await supabase.from('classes').select('*').in('id', classIds);
    if (cError) { console.error(cError); return []; }
    return classes.map(mapClassFromDb);
}

export async function addClass(newClass: ClassInfo): Promise<void> {
    const dbClass: Database['public']['Tables']['classes']['Insert'] = {
        id: newClass.id,
        name: newClass.name,
        description: newClass.description ?? null,
        grade: newClass.grade,
        teacher_email: newClass.teacherEmail,
        institution: newClass.institution ?? null,
    };
    await getSupabaseClient().from('classes').insert([dbClass]);
}

export async function updateClass(classToUpdate: ClassInfo): Promise<void> {
    const updatePayload: Database['public']['Tables']['classes']['Update'] = {
        name: classToUpdate.name,
        description: classToUpdate.description ?? null,
        grade: classToUpdate.grade,
    };
    await getSupabaseClient().from('classes').update(updatePayload).eq('id', classToUpdate.id);
}

export async function deleteClass(classId: string): Promise<{ success: boolean }> {
    const { error } = await getSupabaseClient().from('classes').delete().eq('id', classId);
    if (error) { console.error(error); return { success: false }; }
    return { success: true };
}

// --- Student Management ---
export async function getStudentsForTeacher(institution: string): Promise<User[]> {
    const { data, error } = await getSupabaseClient().from('users').select('*').eq('role', 'student').eq('institution', institution).neq('status', 'ghost');
    if (error) { console.error(error); return []; }
    return data.map(mapUserFromDb);
}

export async function getStudentsForClass(classId: string): Promise<User[]> {
    const { data: memberships, error } = await getSupabaseClient().from('class_members').select('user_email').eq('class_id', classId);
    if (error || !memberships) { console.error(error); return []; }
    const studentEmails = memberships.map(m => m.user_email);
    if (studentEmails.length === 0) return [];
    
    const { data: students, error: sError } = await getSupabaseClient().from('users').select('*').in('email', studentEmails).neq('status', 'ghost');
    if (sError) { console.error(sError); return []; }
    return students.map(mapUserFromDb);
}

export async function assignStudentToClass(studentEmail: string, classId: string): Promise<void> {
    await getSupabaseClient().from('class_members').insert([{ class_id: classId, user_email: studentEmail }]);
}

export async function removeStudentFromClass(studentEmail: string, classId: string): Promise<{ success: boolean }> {
    const { error } = await getSupabaseClient().from('class_members').delete().eq('class_id', classId).eq('user_email', studentEmail);
    return { success: !error };
}

export async function getClassMembershipsForTeacher(institution: string): Promise<{ class_id: string; user_email: string; }[]> {
    const { data, error } = await getSupabaseClient().from('class_members').select('class_id, user_email');
    if (error) { console.error(error); return []; }
    return data;
}

export async function getLeaderboardForInstitution(institution: string): Promise<User[]> {
  const { data, error } = await getSupabaseClient()
    .from('users')
    .select('*')
    .eq('institution', institution)
    .eq('role', 'student')
    .neq('status', 'ghost')
    .order('stars', { ascending: false, nullsFirst: false })
    .limit(100);

  if (error) {
    console.error("Failed to fetch leaderboard", error);
    return [];
  }
  return (data || []).map(mapUserFromDb);
}

// --- Curriculum & Materials ---
export async function startDayForClass(classId: string, dayNumber: number): Promise<void> {
    const curriculum = await getCurriculumForClass(classId);
    if (!curriculum) return;

    const startedDays = new Set(curriculum.startedDays || []);
    startedDays.add(dayNumber);

    const newCurriculum: Curriculum = {
        ...curriculum,
        startedDays: Array.from(startedDays),
    };
    await saveCurriculumForClass(classId, newCurriculum);
}

export async function cancelDayForClass(classId: string, dayNumber: number): Promise<void> {
    const curriculum = await getCurriculumForClass(classId);
    if (!curriculum) return;

    const startedDays = (curriculum.startedDays || []).filter(d => d !== dayNumber);

    const newCurriculum: Curriculum = {
        ...curriculum,
        startedDays,
    };
    await saveCurriculumForClass(classId, newCurriculum);
}

export async function getCurriculumForClass(classId: string): Promise<Curriculum | null> {
    const { data, error } = await getSupabaseClient()
      .from('curriculums')
      .select('number_of_days, class_format, started_days')
      .eq('class_id', classId)
      .single();
    if (error || !data) return null;
    return {
      numberOfDays: data.number_of_days,
      classFormat: (data.class_format as any[]) || [],
      startedDays: (data.started_days as number[]) || [],
    } as Curriculum;
}

export async function saveCurriculumForClass(classId: string, curriculum: Curriculum): Promise<void> {
    await getSupabaseClient().from('curriculums').upsert([
      {
        class_id: classId,
        number_of_days: curriculum.numberOfDays,
        class_format: curriculum.classFormat as unknown as Json,
        started_days: curriculum.startedDays || [],
      }
    ], { onConflict: 'class_id' });
    window.dispatchEvent(new Event('curriculum-updated'));
}

const generateOptions = (correctAnswer: string, allWordsInLevel: string[]): string[] => {
    const distractors = allWordsInLevel
        .filter(w => w !== correctAnswer)
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);
    const options = new Set([correctAnswer, ...distractors]);
    
    const dummyOptions = ['Apple', 'Book', 'Car', 'Desk', 'Run', 'Study'];
    let i = 0;
    while(options.size < 4) {
        const dummy = dummyOptions[i++ % dummyOptions.length];
        if (!options.has(dummy)) {
          options.add(dummy);
        }
    }
    
    return Array.from(options).sort(() => 0.5 - Math.random());
};


export async function getMaterialQuestions(type: ActivityType, level: number): Promise<LeveledQuestion[]> {
    const supabase = getSupabaseClient();
    
    if (type === 'vocab') {
        const { data: vocabWords, error: vocabError } = await supabase.from('vocab_database').select('*').eq('level', level);
        if (vocabError) { console.error(vocabError); return []; }
        
        const allWordsInLevel = (vocabWords || []).map(w => w.word);

        return (vocabWords || []).map(word => ({
            id: word.vocab_id,
            text: word.meaning_kor,
            options: generateOptions(word.word, allWordsInLevel),
            answer: word.word,
        }));
    }

    if (type === 'grammar') {
      const { data, error } = await supabase.from('grammar_materials').select('*').eq('level', level).order('day', { ascending: true });
      if (error) { console.error(error); return []; }
      const flattened: LeveledQuestion[] = [];
      (data || []).forEach((unit) => {
        flattened.push(...parseGrammarQuestions(unit.questions, unit.id));
      });
      return flattened;
    }
    
    // Listening is handled differently now
    return [];
}

export async function getAllMaterialsForType(type: Exclude<ActivityType, 'empty' | 'reading' | 'listening'>): Promise<Level[]> {
    const supabase = getSupabaseClient();
    
    if (type === 'vocab') {
        const { data, error } = await supabase.from('vocab_database').select('*').order('level');
        if (error) { console.error(error); return []; }

        const groupedByLevel = new Map<number, any[]>();
        (data || []).forEach(item => {
            if (!groupedByLevel.has(item.level)) {
                groupedByLevel.set(item.level, []);
            }
            groupedByLevel.get(item.level)!.push(item);
        });
        
        const result: Level[] = [];
        for (const [level, words] of groupedByLevel.entries()) {
            if (words.length < 1) continue;

            const allWordsInLevel = words.map(w => w.word);
            const questions = words.map(word => ({
                id: word.vocab_id,
                text: word.meaning_kor,
                options: generateOptions(word.word, allWordsInLevel),
                answer: word.word,
            }));
            result.push({ level, questions });
        }
        return result;
    }

    if (type === 'grammar') {
        const { data, error } = await supabase.from('grammar_materials').select('*').order('level').order('day');
        if (error) { console.error(error); return []; }

        const groupedByLevel = new Map<number, LeveledQuestion[]>();
        (data || []).forEach(item => {
            const questions = parseGrammarQuestions(item.questions, item.id);
            if (!groupedByLevel.has(item.level)) {
                groupedByLevel.set(item.level, []);
            }
            groupedByLevel.get(item.level)!.push(...questions);
        });

        return Array.from(groupedByLevel.entries()).map(([level, questions]) => ({ level, questions }));
    }

    return [];
}

export async function getAllReadingMaterials(): Promise<ReadingMaterial[]> {
    const { data, error } = await getSupabaseClient().from('reading_materials').select('*').order('level').order('day');
    if (error) { console.error(error); return []; }
    return Promise.all((data || []).map(dbUnit => mapReadingMaterialFromDb(dbUnit)));
}

export async function getAllListeningMaterials(): Promise<ListeningMaterial[]> {
    const { data, error } = await getSupabaseClient().from('listening_materials').select('*').order('level').order('day');
    if (error) { console.error(error); return []; }
    return Promise.all((data || []).map(dbUnit => mapListeningMaterialFromDb(dbUnit)));
}


// --- Quiz & Progress ---
export async function getSelfStudyVocabSet(student: User): Promise<VocabItem[]> {
    if (typeof student.vocabLevel === 'undefined') return [];

    // 전체 레벨 단어
    const { data: allLevelData, error } = await getSupabaseClient()
      .from('vocab_database')
      .select('*')
      .eq('level', student.vocabLevel);
    if (error) { console.error('Error fetching self-study vocab:', error); return []; }

    const allLevel = (allLevelData || []).map(mapVocabItemFromDb);

    // 단어장 단어 & 오늘 학습한 단어
    const wb = getWordbookEntries(student.email).map(e => e.word.toLowerCase());
    const studiedToday = new Set(getStudiedTodayWords(student.email).map(w => w.toLowerCase()));

    // 1) 단어장에서 오늘 미학습 단어만 필터
    const wbCandidates = allLevel.filter(v => wb.includes(v.word.toLowerCase()) && !studiedToday.has(v.word.toLowerCase()));
    // 최대 3개 랜덤 선택
    const wbShuffled = [...wbCandidates].sort(() => 0.5 - Math.random()).slice(0, 3);

    // 2) 레벨 단어 중 단어장에 없는 단어에서 남은 수만큼 랜덤 선택
    const remainingNeeded = 5 - wbShuffled.length;
    const nonWordbookPool = allLevel.filter(v => !wb.includes(v.word.toLowerCase()));
    const nonWbShuffled = [...nonWordbookPool].sort(() => 0.5 - Math.random()).slice(0, Math.max(0, remainingNeeded));

    const selected = [...wbShuffled, ...nonWbShuffled].slice(0, 5);
    return selected;
}


export async function getSelfStudyQuizForStudent(student: User): Promise<Quiz | null> {
    if (typeof student.vocabLevel === 'undefined') {
        return null;
    }

    // Build from getSelfStudyVocabSet to honor wordbook/day rules
    const vocabItems = await getSelfStudyVocabSet(student);
    if (vocabItems.length === 0) return null;

    const levelWordsAll = (await getSupabaseClient().from('vocab_database').select('word').eq('level', student.vocabLevel)).data?.map(w => w.word) || [];
    const buildOptions = (answer: string) => generateOptions(answer, levelWordsAll);

    const selectedQuestions = vocabItems.map(item => ({
      id: item.vocabId,
      text: item.meaningKor,
      options: buildOptions(item.word),
      answer: item.word,
    }));

    return {
        activityId: `self-study-vocab-level-${student.vocabLevel}`,
        title: `레벨업 어휘 - Level ${student.vocabLevel}`,
        activityType: 'vocab',
        questions: selectedQuestions.map(q => ({ word: q.text, options: q.options, correctAnswer: q.answer }))
    };
}

export async function getQuizForActivity(activity: Activity, classId?: string): Promise<Quiz> {
    const allQuestions = await getMaterialQuestions(activity.type, activity.level);
    
    let questionsForQuiz: LeveledQuestion[] = [];
    if (classId) {
    const { data: overrides } = await getSupabaseClient().from('curriculum_overrides').select('*').eq('class_id', classId).eq('activity_id', activity.id);
        const override = overrides && overrides[0];

        if (override) {
            const questionToShow = allQuestions.find(q => q.id === (override as any).material_id);
            if (questionToShow) {
                // Make the overridden question the first one, then fill with others up to 10
                 questionsForQuiz = [questionToShow, ...allQuestions.filter(q => q.id !== (override as any).material_id)].slice(0, 10);
            }
        }
        
        if (questionsForQuiz.length === 0 && allQuestions.length > 0) { // If not overridden or override failed
            const dayNumber = parseInt(activity.id.split('-')[1]);
            const activitySlotIndex = parseInt(activity.id.split('-')[3]);

            const curriculum = await getCurriculumForClass(classId);
            const classFormatActivities = curriculum?.classFormat || [];

            const totalSameActivitiesInFormat = classFormatActivities.filter(
                (fa) => fa.type === activity.type && fa.level === activity.level
            ).length;

            let sameActivityOrdinal = 0;
            for (let i = 0; i < activitySlotIndex; i++) {
                if (classFormatActivities[i]?.type === activity.type && classFormatActivities[i]?.level === activity.level) {
                    sameActivityOrdinal++;
                }
            }
            
            const materialIndex = (dayNumber - 1) * totalSameActivitiesInFormat + sameActivityOrdinal;
            const startIndex = materialIndex % allQuestions.length;
            const reorderedQuestions = [...allQuestions.slice(startIndex), ...allQuestions.slice(0, startIndex)];
            questionsForQuiz = reorderedQuestions.slice(0, 10);
        }

    } else {
        questionsForQuiz = allQuestions.slice(0, 10);
    }

    return {
        activityId: activity.id,
        title: `${activity.type.charAt(0).toUpperCase() + activity.type.slice(1)} - Level ${activity.level}`,
        activityType: activity.type as 'vocab' | 'listening' | 'grammar',
        questions: questionsForQuiz.map(q => ({
            word: q.text,
            options: q.options,
            correctAnswer: q.answer
        }))
    };
}

export async function getReadingMaterialForActivity(activity: Activity, classId?: string): Promise<ReadingMaterial> {
    const { data, error } = await getSupabaseClient()
      .from('reading_materials')
      .select('*')
      .eq('level', activity.level)
      .order('id', { ascending: true });

    if (error || !data || data.length === 0) {
        throw new Error(`Reading material for level ${activity.level} not found.`);
    }
    
    let dbUnit;
    if (classId && activity.id.startsWith('day-')) {
        const dayNumber = parseInt(activity.id.split('-')[1]);
        const activitySlotIndex = parseInt(activity.id.split('-')[3]);

        const curriculum = await getCurriculumForClass(classId);
        const classFormatActivities = curriculum?.classFormat || [];

        const totalSameActivitiesInFormat = classFormatActivities.filter(
            (fa) => fa.type === activity.type && fa.level === activity.level
        ).length;

        let sameActivityOrdinal = 0;
        for (let i = 0; i < activitySlotIndex; i++) {
            if (classFormatActivities[i]?.type === activity.type && classFormatActivities[i]?.level === activity.level) {
                sameActivityOrdinal++;
            }
        }
        
        const materialIndex = (dayNumber - 1) * totalSameActivitiesInFormat + sameActivityOrdinal;
        dbUnit = data[materialIndex % data.length];

    } else {
        dbUnit = data[0];
    }

    if (!dbUnit) {
        throw new Error(`Reading material for level ${activity.level} could not be determined.`);
    }

    const unit = await mapReadingMaterialFromDb(dbUnit);
    return { ...unit, activityId: activity.id };
}

export async function getVocabForActivity(activity: Activity, classId: string): Promise<VocabItem[]> {
    const supabase = getSupabaseClient();
    if (activity.type === 'reading') {
        const material = await getReadingMaterialForActivity(activity, classId);
        return material.vocabItems;
    }
    if (activity.type === 'listening') {
        const material = await getListeningMaterial(activity, classId);
        return material.vocabItems;
    }
    if (activity.type === 'vocab') {
        const { data, error } = await supabase.from('vocab_database').select('*').eq('level', activity.level);
        if (error) return [];
        return (data || []).map(mapVocabItemFromDb);
    }
    return [];
}

export async function getVocabQuiz(activity: Activity, classId: string): Promise<Quiz> {
    return getQuizForActivity(activity, classId);
}

export async function getListeningMaterial(activity: Activity, classId?: string): Promise<ListeningMaterial> {
    const { data, error } = await getSupabaseClient()
      .from('listening_materials')
      .select('*')
      .eq('level', activity.level)
      .order('id', { ascending: true });

    if (error || !data || data.length === 0) {
        throw new Error(`Listening material for level ${activity.level} not found.`);
    }
    
    let dbUnit;
    if (classId && activity.id.startsWith('day-')) {
        const dayNumber = parseInt(activity.id.split('-')[1]);
        const activitySlotIndex = parseInt(activity.id.split('-')[3]);

        const curriculum = await getCurriculumForClass(classId);
        const classFormatActivities = curriculum?.classFormat || [];

        const totalSameActivitiesInFormat = classFormatActivities.filter(
            (fa) => fa.type === activity.type && fa.level === activity.level
        ).length;

        let sameActivityOrdinal = 0;
        for (let i = 0; i < activitySlotIndex; i++) {
            if (classFormatActivities[i]?.type === activity.type && classFormatActivities[i]?.level === activity.level) {
                sameActivityOrdinal++;
            }
        }
        
        const materialIndex = (dayNumber - 1) * totalSameActivitiesInFormat + sameActivityOrdinal;
        dbUnit = data[materialIndex % data.length];

    } else {
        dbUnit = data[0];
    }

     if (!dbUnit) {
        throw new Error(`Listening material for level ${activity.level} could not be determined.`);
    }

    const material = await mapListeningMaterialFromDb(dbUnit);
    return { ...material, activityId: activity.id };
}


export async function saveProgressAndLogActivity(currentUser: User, quiz: Quiz, score: number, classInfo?: ClassInfo): Promise<void> {
    const supabase = getSupabaseClient();
    
    const studyLog: Database['public']['Tables']['student_study_logs']['Insert'] = {
        user_email: currentUser.email,
        user_name: currentUser.name,
        institution: (classInfo?.institution ?? currentUser.institution) ?? null,
        class_id: classInfo?.id ?? null,
        class_name: classInfo?.name ?? null,
        activity_type: quiz.activityType,
        activity_title: quiz.title,
        level: parseInt(quiz.title.match(/Level (\d+)/)?.[1] || '0'),
        score: score,
        total_questions: quiz.questions.length,
        details: { activityId: quiz.activityId },
    };
    await supabase.from('student_study_logs').insert([studyLog]);

    // --- STAR CALCULATION AND UPDATE ---
    if (quiz.activityId.startsWith('self-study-vocab')) {
        let starsEarned = 0;
        if (quiz.questions.length === 5) { // Ensure it's the 5-question set
            if (score === 5) {
                starsEarned = 3;
            } else if (score === 4) {
                starsEarned = 2;
            } else {
                starsEarned = 1;
            }
        }

        if (starsEarned > 0) {
            const { data: userRow, error: userError } = await supabase
                .from('users')
                .select('stars')
                .eq('email', currentUser.email)
                .single();

            if (!userError && userRow) {
                const newTotalStars = (userRow.stars || 0) + starsEarned;
                await supabase
                    .from('users')
                    .update({ stars: newTotalStars })
                    .eq('email', currentUser.email);
            } else if (userError) {
                console.error("Error fetching user stars for update:", userError);
            }
        }

        // Mark studied-today words (KST) to avoid repetition within the same day
        try {
          const studiedWords = quiz.questions.map(q => q.correctAnswer);
          addStudiedTodayWords(currentUser.email, studiedWords);
        } catch {}
    }

    window.dispatchEvent(new Event('activity-completed'));
}

export async function saveReadingProgressAndLogActivity(currentUser: User, unit: ReadingMaterial, score: number, classInfo?: ClassInfo): Promise<void> {
    const supabase = getSupabaseClient();

    const studyLog: Database['public']['Tables']['student_study_logs']['Insert'] = {
        user_email: currentUser.email,
        user_name: currentUser.name,
        institution: (classInfo?.institution ?? currentUser.institution) ?? null,
        class_id: classInfo?.id ?? null,
        class_name: classInfo?.name ?? null,
        activity_type: 'reading',
        activity_title: unit.title,
        level: unit.level,
        score: score,
        total_questions: unit.mcqs.length,
        details: (unit.activityId ? { activityId: unit.activityId } : null),
    };
    await supabase.from('student_study_logs').insert([studyLog]);

    window.dispatchEvent(new Event('activity-completed'));
}

export async function saveListeningProgressAndLogActivity(currentUser: User, material: ListeningMaterial, score: number, classInfo?: ClassInfo): Promise<void> {
    const supabase = getSupabaseClient();

    const studyLog: Database['public']['Tables']['student_study_logs']['Insert'] = {
        user_email: currentUser.email,
        user_name: currentUser.name,
        institution: (classInfo?.institution ?? currentUser.institution) ?? null,
        class_id: classInfo?.id ?? null,
        class_name: classInfo?.name ?? null,
        activity_type: 'listening',
        activity_title: material.title,
        level: material.level,
        score: score,
        total_questions: material.mcqs.length,
        details: (material.activityId ? { activityId: material.activityId } : null),
    };
    await supabase.from('student_study_logs').insert([studyLog]);

    window.dispatchEvent(new Event('activity-completed'));
}

// --- Teacher/Admin Data Fetching ---
export async function getDays(userEmail: string, classId: string): Promise<Day[]> {
    const supabase = getSupabaseClient();
    const curriculum = await getCurriculumForClass(classId);
    if (!curriculum) return [];

    const startedDaysByTeacher = new Set(curriculum.startedDays || []);

    const { data: completedLogs } = await supabase
      .from('student_study_logs')
      .select('details')
      .eq('user_email', userEmail)
      .eq('class_id', classId);
    
    const completedSet = new Set(
      (completedLogs || [])
        .map(log => (log.details as StudentStudyDetails | null)?.activityId)
        .filter((id): id is string => !!id)
    );

    const days: Day[] = [];
    let isPreviousDayCompleted = true;

    for (let i = 1; i <= curriculum.numberOfDays; i++) {
        const activitiesForDay = curriculum.classFormat.map((format, index) => ({
            id: `day-${i}-activity-${index}`,
            type: format.type,
            level: format.level,
        }));
        
        const isCurrentDayCompleted = activitiesForDay.every(a => a.type === 'empty' || completedSet.has(a.id));
        const isDayStartedByTeacher = startedDaysByTeacher.has(i);
        
        days.push({
            id: i,
            title: `${i}일차`,
            isLocked: i > 1 && !isPreviousDayCompleted && !isDayStartedByTeacher,
            activities: activitiesForDay,
        });

        isPreviousDayCompleted = isCurrentDayCompleted;
    }
    return days;
}

export async function getStudentProgressSummary(studentEmail: string, classId: string): Promise<{ completedDays: number, totalDays: number }> {
    const days = await getDays(studentEmail, classId);
    if (days.length === 0) return { completedDays: 0, totalDays: 0 };
    
    const unlockedDays = days.filter(day => !day.isLocked);
    const completedDays = unlockedDays.length > 0 ? unlockedDays.length -1 : 0;
    
    return { completedDays: Math.max(0, completedDays), totalDays: days.length };
}

export async function getCurriculumDaysForTeacher(classId: string): Promise<Day[]> {
    const curriculum = await getCurriculumForClass(classId);
    if (!curriculum) return [];
    
    return Array.from({ length: curriculum.numberOfDays }, (_, i) => {
        const dayNumber = i + 1;
        return {
            id: dayNumber,
            title: `${dayNumber}일차`,
            isLocked: false,
            activities: curriculum.classFormat.map((format, index) => ({
                id: `day-${dayNumber}-activity-${index}`,
                type: format.type,
                level: format.level,
            }))
        };
    });
}

export async function getDayContentForTeacher(day: Day, classId: string): Promise<DayActivityContentForTeacher[]> {
    const overridesData = await getCurriculumOverrides(classId);
    const overrides = new Map(overridesData.map(o => [o.activityId, o.questionId]));

    const curriculum = await getCurriculumForClass(classId);
    if (!curriculum) return [];
    const classFormatActivities = curriculum.classFormat;

    const contentPromises = day.activities
        .filter(act => act.type !== 'empty')
        .map(async (activity): Promise<DayActivityContentForTeacher> => {
            const activitySlotIndex = parseInt(activity.id.split('-')[3]);

            const totalSameActivitiesInFormat = classFormatActivities.filter(
                (fa) => fa.type === activity.type && fa.level === activity.level
            ).length;

            let sameActivityOrdinal = 0;
            for (let i = 0; i < activitySlotIndex; i++) {
                if (classFormatActivities[i]?.type === activity.type && classFormatActivities[i]?.level === activity.level) {
                    sameActivityOrdinal++;
                }
            }
            
            const materialIndex = (day.id - 1) * totalSameActivitiesInFormat + sameActivityOrdinal;

            if (activity.type === 'reading') {
                try {
                    const { data: units, error } = await getSupabaseClient().from('reading_materials').select('*').eq('level', activity.level).order('id', { ascending: true });
                    if (error || !units || units.length === 0) throw new Error("No units");
                    
                    const unitForDay = units[materialIndex % units.length];
                    const mappedUnit = await mapReadingMaterialFromDb(unitForDay);
                    return { activity, content: { ...mappedUnit, activityId: activity.id } };
                } catch (error) {
                    console.error(`Could not load reading material for activity ${activity.id}:`, error);
                    return { activity };
                }
            } else if (activity.type === 'listening') {
                try {
                    const { data: units, error } = await getSupabaseClient().from('listening_materials').select('*').eq('level', activity.level).order('id', { ascending: true });
                    if (error || !units || units.length === 0) throw new Error("No units");
                    
                    const unitForDay = units[materialIndex % units.length];
                    const mappedUnit = await mapListeningMaterialFromDb(unitForDay);
                    return { activity, content: { ...mappedUnit, activityId: activity.id } };
                } catch (error) {
                    console.error(`Could not load listening material for activity ${activity.id}:`, error);
                    return { activity };
                }
            } else {
                const allQuestions = await getMaterialQuestions(activity.type, activity.level);
                const overrideQuestionId = overrides.get(activity.id);
                
                let questionForDay;
                if (overrideQuestionId !== undefined) {
                    questionForDay = allQuestions.find(q => q.id === overrideQuestionId);
                } else if (allQuestions.length > 0) {
                    questionForDay = allQuestions[materialIndex % allQuestions.length];
                }

                return { activity, content: questionForDay };
            }
        });
    
    return Promise.all(contentPromises);
}

export async function getCompletionStatusForActivity(activityId: string, classId: string): Promise<{ student: User; completed: boolean; }[]> {
    const students = await getStudentsForClass(classId);
    const { data, error } = await getSupabaseClient()
        .from('student_study_logs')
        .select('user_email')
        .eq('class_id', classId)
        .eq('details->>activityId', activityId);
        
    if(error) { console.error(error); return []; }
    
    const completers = new Set((data || []).map(d => d.user_email));
    
    return students.map(student => ({ student, completed: completers.has(student.email) }));
}

export async function getMaxCompletedDaysForClass(classId: string): Promise<number> {
    const supabase = getSupabaseClient();
    
    // 1. Get curriculum and students in parallel
    const [curriculum, students] = await Promise.all([
        getCurriculumForClass(classId),
        getStudentsForClass(classId),
    ]);

    if (!curriculum || students.length === 0) return 0;

    // 2. Get all study logs for the entire class at once
    const { data: allLogsForClass, error: logsError } = await supabase
      .from('student_study_logs')
      .select('user_email, details')
      .eq('class_id', classId);

    if (logsError) {
        console.error("Error fetching logs for class progress:", logsError);
        return 0; // Return 0 if logs can't be fetched
    }
    
    const logsByStudent = new Map<string, Set<string>>();
    (allLogsForClass || []).forEach(log => {
        if (!log.user_email) return;
        if (!logsByStudent.has(log.user_email)) {
            logsByStudent.set(log.user_email, new Set());
        }
        const activityId = (log.details as StudentStudyDetails | null)?.activityId;
        if (activityId) {
            logsByStudent.get(log.user_email)!.add(activityId);
        }
    });

    // 3. Calculate completed days for each student in memory
    let maxCompletedDays = 0;
    const startedDaysByTeacher = new Set(curriculum.startedDays || []);

    for (const student of students) {
        const completedSet = logsByStudent.get(student.email) || new Set();
        let unlockedDaysCount = 0;
        let isPreviousDayCompleted = true;

        for (let i = 1; i <= curriculum.numberOfDays; i++) {
            const activitiesForDay = curriculum.classFormat.map((format, index) => ({
                id: `day-${i}-activity-${index}`,
                type: format.type,
                level: format.level,
            }));
            
            const isCurrentDayCompleted = activitiesForDay.every(a => a.type === 'empty' || completedSet.has(a.id));
            const isDayStartedByTeacher = startedDaysByTeacher.has(i);
            
            const isLocked = i > 1 && !isPreviousDayCompleted && !isDayStartedByTeacher;

            if (isLocked) {
                break; // Stop counting for this student
            }
            unlockedDaysCount = i;
            isPreviousDayCompleted = isCurrentDayCompleted;
        }

        const completedCount = unlockedDaysCount > 0 ? unlockedDaysCount - 1 : 0;
        
        if (completedCount > maxCompletedDays) {
            maxCompletedDays = completedCount;
        }
    }

    return maxCompletedDays;
}

export async function getCurriculumOverrides(classId: string): Promise<{activityId: string; questionId: string}[]> {
    const { data, error } = await getSupabaseClient().from('curriculum_overrides').select('activity_id, material_id').eq('class_id', classId);
    if(error) { console.error(error); return []; }
    return (data || []).map((item: any) => ({ activityId: item.activity_id, questionId: item.material_id }));
}

export async function updateCurriculumActivity(classId: string, dayId: number, activity: Activity, newQuestionId: string, scope: 'single' | 'sequential'): Promise<void> {
    const supabase = getSupabaseClient();
    if (scope === 'single') {
        await supabase.from('curriculum_overrides').upsert([{ class_id: classId, activity_id: activity.id, material_id: newQuestionId }], { onConflict: 'class_id,activity_id' });
    } else {
        const curriculum = await getCurriculumForClass(classId);
        if (!curriculum) return;
        
        const activityIndex = curriculum.classFormat.findIndex(f => f.type === activity.type && f.level === activity.level);
        if(activityIndex === -1) return;

        const allQuestions = await getMaterialQuestions(activity.type, activity.level);
        const newQuestionIndex = allQuestions.findIndex(q => q.id === newQuestionId);
        if (newQuestionIndex === -1) return;

        const upsertPromises = [];
        for (let d = dayId; d <= curriculum.numberOfDays; d++) {
            const currentActivityId = `day-${d}-activity-${activityIndex}`;
            const questionIndexForDay = (newQuestionIndex + (d - dayId)) % allQuestions.length;
            const questionIdForDay = allQuestions[questionIndexForDay].id;
            
            upsertPromises.push(
                supabase.from('curriculum_overrides').upsert([{ class_id: classId, activity_id: currentActivityId, material_id: questionIdForDay }], { onConflict: 'class_id,activity_id' })
            );
        }
        await Promise.all(upsertPromises);
    }
}

export async function getUsedQuestionIdsForClass(classId: string): Promise<Set<string>> {
    const overrides = await getCurriculumOverrides(classId);
    return new Set(overrides.map(o => o.questionId));
}

// --- Log Fetching ---
export async function getStudyLogs(): Promise<StudentStudyLog[]> {
    const { data, error } = await getSupabaseClient().from('student_study_logs').select('*').order('timestamp', { ascending: false });
    if(error) { console.error(error); return []; }
    return (data || []) as unknown as StudentStudyLog[];
}

export async function getUserActionLogs(): Promise<UserActionLog[]> {
    const { data, error } = await getSupabaseClient().from('user_action_logs').select('*').order('timestamp', { ascending: false });
    if(error) { console.error(error); return []; }
    return (data || []) as unknown as UserActionLog[];
}

// Archived/Ghost helpers
export async function fetchGhostInstitutions(): Promise<{ institution_name: string; origin_institution_name: string | null; domain_name: string; }[]> {
  const { data, error } = await getSupabaseClient()
    .from('institution_domains')
    .select('institution_name, origin_institution_name, domain_name')
    .eq('is_ghost', true)
    .order('institution_name');
  if (error) { console.error('fetchGhostInstitutions failed', error); return []; }
  return (data || []) as any;
}

export async function fetchArchivedUsers(): Promise<User[]> {
  const { data, error } = await getSupabaseClient()
    .from('users')
    .select('email, name, role, institution, teacher_email, grade, student_id, vocab_level, stars, status, archived_at, original_email')
    .eq('status', 'ghost');
  if (error) { console.error('fetchArchivedUsers failed', error); return []; }
  return (data || []).map(mapUserFromDb);
}

export async function restoreUserAccount(targetEmail: string, newInstitution: string, newEmail: string | null, actor: User): Promise<{ success: boolean; error?: string }>{
  try {
    const { error } = await getSupabaseClient().rpc('restore_user_account', {
      target_email: targetEmail,
      new_institution: newInstitution,
      new_email: newEmail,
      actor_email: actor.email,
    });
    if (error) { console.error('restoreUserAccount failed', error); return { success: false, error: error.message }; }
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e?.message || 'unknown error' };
  }
}

export async function restoreInstitutionUsers(ghostInstitutionName: string, actor: User): Promise<{ success: boolean; restored: number; failed: number }>{
  try {
    const originalInstitution = ghostInstitutionName.endsWith('_ghost') ? ghostInstitutionName.slice(0, -6) : ghostInstitutionName;
    const { data, error } = await getSupabaseClient().from('users').select('email').eq('institution', ghostInstitutionName).eq('status','ghost');
    if (error) { console.error('restoreInstitutionUsers select failed', error); return { success: false, restored: 0, failed: 0 }; }
    const emails = (data || []).map((r:any)=> r.email as string);
    let restored = 0, failed = 0;
    for (const email of emails) {
      const res = await restoreUserAccount(email, originalInstitution, null, actor);
      if (res.success) restored++; else failed++;
    }
    return { success: true, restored, failed };
  } catch (e) {
    console.error('restoreInstitutionUsers failed', e);
    return { success: false, restored: 0, failed: 0 };
  }
}

// --- Master Usage Stats ---
export type DailyPoint = { date: string; count: number };
export type RoleDailyPoint = { date: string; role: 'admin'|'teacher'|'student'; count: number };

export async function getMasterUsageStats(): Promise<{
  totals: {
    institutions: number;
    admins: number;
    teachers: number;
    students: number;
    archivedUsers: number;
    classes: number;
    studyLogs: number;
  };
  studyLogsDaily: DailyPoint[];
  classesDaily: DailyPoint[];
  usersCreatedDaily: RoleDailyPoint[];
  usersArchivedDaily: RoleDailyPoint[];
}> {
  const supabase = getSupabaseClient();

  // Totals
  const [instRes, adminsRes, teachersRes, studentsRes, archivedRes, classesRes, logsRes] = await Promise.all([
    supabase.from('institution_domains').select('id', { count: 'exact', head: true }).eq('is_ghost', false),
    supabase.from('users').select('email', { count: 'exact', head: true }).eq('role','admin').neq('status','ghost'),
    supabase.from('users').select('email', { count: 'exact', head: true }).eq('role','teacher').neq('status','ghost'),
    supabase.from('users').select('email', { count: 'exact', head: true }).eq('role','student').neq('status','ghost'),
    supabase.from('users').select('email', { count: 'exact', head: true }).eq('status','ghost'),
    supabase.from('classes').select('id', { count: 'exact', head: true }),
    supabase.from('student_study_logs').select('id', { count: 'exact', head: true })
  ]);

  const totals = {
    institutions: instRes.count || 0,
    admins: adminsRes.count || 0,
    teachers: teachersRes.count || 0,
    students: studentsRes.count || 0,
    archivedUsers: archivedRes.count || 0,
    classes: classesRes.count || 0,
    studyLogs: logsRes.count || 0,
  };

  // Helpers
  const sinceDays = 14;
  const sinceIso = new Date(Date.now() - sinceDays*24*60*60*1000).toISOString();

  // Daily study logs
  const { data: logsDailyRaw } = await supabase
    .from('student_study_logs')
    .select('timestamp')
    .gte('timestamp', sinceIso)
    .order('timestamp');
  const studyLogsDaily: DailyPoint[] = (() => {
    const map = new Map<string, number>();
    (logsDailyRaw || []).forEach(r => {
      const d = new Date((r as any).timestamp);
      const key = d.toISOString().slice(0,10);
      map.set(key, (map.get(key)||0)+1);
    });
    return Array.from(map.entries()).sort((a,b)=>a[0].localeCompare(b[0])).map(([date,count])=>({date,count}));
  })();

  // Daily classes created
  const { data: classesDailyRaw } = await supabase
    .from('classes')
    .select('created_at')
    .gte('created_at', sinceIso)
    .order('created_at');
  const classesDaily: DailyPoint[] = (() => {
    const map = new Map<string, number>();
    (classesDailyRaw || []).forEach(r => {
      const d = new Date((r as any).created_at);
      const key = d.toISOString().slice(0,10);
      map.set(key, (map.get(key)||0)+1);
    });
    return Array.from(map.entries()).sort((a,b)=>a[0].localeCompare(b[0])).map(([date,count])=>({date,count}));
  })();

  // Users created per day by role
  const { data: usersCreatedRaw } = await supabase
    .from('users')
    .select('created_at, role')
    .gte('created_at', sinceIso)
    .order('created_at');
  const usersCreatedDaily: RoleDailyPoint[] = (() => {
    const map = new Map<string, number>();
    (usersCreatedRaw || []).forEach(r => {
      const d = new Date((r as any).created_at);
      const key = `${d.toISOString().slice(0,10)}|${(r as any).role}`;
      map.set(key, (map.get(key)||0)+1);
    });
    return Array.from(map.entries()).map(([k,count])=>{
      const [date, role] = k.split('|') as any;
      return { date, role, count } as RoleDailyPoint;
    }).sort((a,b)=>a.date.localeCompare(b.date));
  })();

  // Users archived per day by role
  const { data: usersArchivedRaw } = await supabase
    .from('users')
    .select('archived_at, role')
    .not('archived_at','is',null)
    .gte('archived_at', sinceIso)
    .order('archived_at');
  const usersArchivedDaily: RoleDailyPoint[] = (() => {
    const map = new Map<string, number>();
    (usersArchivedRaw || []).forEach(r => {
      const d = new Date((r as any).archived_at);
      const key = `${d.toISOString().slice(0,10)}|${(r as any).role}`;
      map.set(key, (map.get(key)||0)+1);
    });
    return Array.from(map.entries()).map(([k,count])=>{
      const [date, role] = k.split('|') as any;
      return { date, role, count } as RoleDailyPoint;
    }).sort((a,b)=>a.date.localeCompare(b.date));
  })();

  return { totals, studyLogsDaily, classesDaily, usersCreatedDaily, usersArchivedDaily };
}

// --- Institution Management (Master) ---
export async function archiveInstitution(institutionName: string, actor: User): Promise<{ success: boolean }>{
    try {
        const supabase = getSupabaseClient();
        // Use RPC to archive institution accounts with email de-duplication
        const { error } = await supabase.rpc('archive_institution_accounts', { inst_name: institutionName, actor_email: actor.email });
        if (error) { console.error('Archive institution failed:', error); return { success: false }; }
        return { success: true };
    } catch (e) {
        console.error('Archive institution exception:', e);
        return { success: false };
    }
}