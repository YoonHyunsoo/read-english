-- 08_rls_policies.sql
-- 모든 테이블에 Row Level Security (RLS)를 활성화하고 기본 정책을 설정합니다.

-- RLS 활성화
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.institution_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curriculums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curriculum_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_study_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_action_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.star_accumulation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wordbook_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vocab_database ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listening_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grammar_materials ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 모든 테이블에 대해 모든 작업(CRUD)을 할 수 있도록 허용하는 정책 생성
-- 주의: 이 정책은 개발 및 테스트 단계에서 편의를 위해 사용되며,
-- 실제 프로덕션 환경에서는 더 엄격한 규칙으로 변경해야 합니다.

-- Users 테이블 정책
CREATE POLICY "Allow all operations on users" ON public.users FOR ALL USING (true) WITH CHECK (true);

-- Classes 테이블 정책  
CREATE POLICY "Allow all operations on classes" ON public.classes FOR ALL USING (true) WITH CHECK (true);

-- Class Members 테이블 정책
CREATE POLICY "Allow all operations on class_members" ON public.class_members FOR ALL USING (true) WITH CHECK (true);

-- Institution Domains 테이블 정책
CREATE POLICY "Allow all operations on institution_domains" ON public.institution_domains FOR ALL USING (true) WITH CHECK (true);

-- Curriculums 테이블 정책
CREATE POLICY "Allow all operations on curriculums" ON public.curriculums FOR ALL USING (true) WITH CHECK (true);

-- Curriculum Overrides 테이블 정책
CREATE POLICY "Allow all operations on curriculum_overrides" ON public.curriculum_overrides FOR ALL USING (true) WITH CHECK (true);

-- Progress 테이블 정책
CREATE POLICY "Allow all operations on progress" ON public.progress FOR ALL USING (true) WITH CHECK (true);

-- Student Study Logs 테이블 정책
CREATE POLICY "Allow all operations on student_study_logs" ON public.student_study_logs FOR ALL USING (true) WITH CHECK (true);

-- User Action Logs 테이블 정책
CREATE POLICY "Allow all operations on user_action_logs" ON public.user_action_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on star_accumulation_logs" ON public.star_accumulation_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on wordbook_logs" ON public.wordbook_logs FOR ALL USING (true) WITH CHECK (true);

-- Vocab Database 테이블 정책
CREATE POLICY "Allow all operations on vocab_database" ON public.vocab_database FOR ALL USING (true) WITH CHECK (true);

-- Listening Materials 테이블 정책
CREATE POLICY "Allow all operations on listening_materials" ON public.listening_materials FOR ALL USING (true) WITH CHECK (true);

-- Reading Materials 테이블 정책
CREATE POLICY "Allow all operations on reading_materials" ON public.reading_materials FOR ALL USING (true) WITH CHECK (true);

-- Grammar Materials 테이블 정책
CREATE POLICY "Allow all operations on grammar_materials" ON public.grammar_materials FOR ALL USING (true) WITH CHECK (true);

SELECT 'RLS policies created and enabled successfully for all tables!' as status;
