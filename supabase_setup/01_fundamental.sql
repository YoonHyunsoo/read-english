-- 01_fundamental.sql
-- 애플리케이션의 핵심 구조를 정의하는 테이블과 타입 생성

-- UUID 확장 기능 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 열거형 타입 정의
CREATE TYPE user_role AS ENUM ('master', 'admin', 'teacher', 'student', 'individual');
CREATE TYPE activity_type AS ENUM ('vocab', 'listening', 'reading', 'grammar', 'empty');
CREATE TYPE user_action_type AS ENUM (
    'create_user', 'update_user_role', 'archive_user', 'delete_user', 
    'update_user_info', 'delegate_admin'
);

-- 사용자 테이블
CREATE TABLE users (
    email TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'student',
    password TEXT,
    institution TEXT,
    teacher_email TEXT REFERENCES users(email),
    grade TEXT,
    student_id TEXT,
    vocab_level INTEGER DEFAULT 1,
    stars INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 기관 넘버링 테이블 (학생 이메일 도메인 생성용)
CREATE TABLE institution_domains (
    id SERIAL PRIMARY KEY,
    institution_name TEXT UNIQUE NOT NULL,
    domain_number INTEGER UNIQUE NOT NULL,
    domain_name TEXT UNIQUE NOT NULL, -- institute0001 형태
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 클래스 테이블
CREATE TABLE classes (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    name TEXT NOT NULL,
    description TEXT,
    grade TEXT[] NOT NULL DEFAULT '{}',
    teacher_email TEXT NOT NULL REFERENCES users(email),
    institution TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 클래스 멤버십 테이블 (학생-클래스 연결)
CREATE TABLE class_members (
    class_id TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    user_email TEXT NOT NULL REFERENCES users(email) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (class_id, user_email)
);

-- 커리큘럼 테이블
CREATE TABLE curriculums (
    class_id TEXT PRIMARY KEY REFERENCES classes(id) ON DELETE CASCADE,
    number_of_days INTEGER NOT NULL DEFAULT 30,
    class_format JSONB NOT NULL DEFAULT '[]',
    started_days INTEGER[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 커리큘럼 오버라이드 테이블
CREATE TABLE curriculum_overrides (
    id SERIAL PRIMARY KEY,
    class_id TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    day INTEGER NOT NULL,
    activity_id TEXT NOT NULL,
    material_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(class_id, day, activity_id)
);

-- 진행 상황 테이블
CREATE TABLE progress (
    id SERIAL PRIMARY KEY,
    user_email TEXT NOT NULL REFERENCES users(email),
    title TEXT NOT NULL,
    score INTEGER NOT NULL,
    total INTEGER NOT NULL,
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 학생 학습 로그 테이블
CREATE TABLE student_study_logs (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_email TEXT REFERENCES users(email),
    user_name TEXT,
    institution TEXT,
    class_id TEXT REFERENCES classes(id),
    class_name TEXT,
    activity_type TEXT,
    activity_title TEXT,
    level INTEGER,
    score INTEGER,
    total_questions INTEGER,
    details JSONB
);

-- 별(stars) 적립 로그
CREATE TABLE star_accumulation_logs (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    student_email TEXT NOT NULL REFERENCES users(email),
    stars_gained INTEGER NOT NULL,
    reason TEXT, -- e.g., 'self-study-quiz'
    activity_id TEXT,
    class_id TEXT REFERENCES classes(id),
    score INTEGER,
    total_questions INTEGER
);

-- 단어장(Wordbook) 저장 로그
CREATE TABLE wordbook_logs (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    student_email TEXT NOT NULL REFERENCES users(email),
    word TEXT NOT NULL,
    meaning TEXT,
    source_activity TEXT, -- 'self-study' | 'vocab' | 'reading' | 'listening'
    activity_id TEXT,
    class_id TEXT REFERENCES classes(id)
);

-- 사용자 액션 로그 테이블
CREATE TABLE user_action_logs (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    actor_email TEXT REFERENCES users(email),
    actor_name TEXT,
    action_type user_action_type NOT NULL,
    target_email TEXT NOT NULL,
    target_name TEXT,
    target_role TEXT,
    institution TEXT,
    details JSONB
);

-- 인덱스 생성
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_teacher_email ON users(teacher_email);
CREATE INDEX idx_institution_domains_name ON institution_domains(institution_name);
CREATE INDEX idx_institution_domains_number ON institution_domains(domain_number);
CREATE INDEX idx_classes_teacher_email ON classes(teacher_email);
CREATE INDEX idx_class_members_class_id ON class_members(class_id);
CREATE INDEX idx_class_members_user_email ON class_members(user_email);
CREATE INDEX idx_progress_user_email ON progress(user_email);
CREATE INDEX idx_student_study_logs_user_email ON student_study_logs(user_email);
CREATE INDEX idx_student_study_logs_class_id ON student_study_logs(class_id);
CREATE INDEX idx_user_action_logs_actor_email ON user_action_logs(actor_email);
CREATE INDEX idx_star_logs_email ON star_accumulation_logs(student_email);
CREATE INDEX idx_wordbook_logs_email ON wordbook_logs(student_email);

-- 트리거 함수: 업데이트 시간 자동 갱신
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 트리거 적용
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON classes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_curriculums_updated_at BEFORE UPDATE ON curriculums
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 기관 도메인 생성 함수
CREATE OR REPLACE FUNCTION get_or_create_institution_domain(institution_name TEXT)
RETURNS TEXT AS $$
DECLARE
    existing_domain TEXT;
    new_domain_number INTEGER;
    new_domain_name TEXT;
BEGIN
    -- 기존 도메인이 있는지 확인
    SELECT domain_name INTO existing_domain
    FROM institution_domains
    WHERE institution_domains.institution_name = get_or_create_institution_domain.institution_name;
    
    -- 기존 도메인이 있으면 반환
    IF existing_domain IS NOT NULL THEN
        RETURN existing_domain;
    END IF;
    
    -- 새로운 도메인 번호 생성 (1001부터 시작)
    SELECT COALESCE(MAX(domain_number), 1000) + 1 INTO new_domain_number
    FROM institution_domains;
    
    -- 도메인 이름 생성
    new_domain_name := 'institute' || LPAD(new_domain_number::TEXT, 4, '0');
    
    -- 새 도메인 삽입
    INSERT INTO institution_domains (institution_name, domain_number, domain_name)
    VALUES (institution_name, new_domain_number, new_domain_name);
    
    RETURN new_domain_name;
END;
$$ LANGUAGE plpgsql;

-- 학생 이메일 생성 함수
CREATE OR REPLACE FUNCTION create_student_email(student_id TEXT, institution_name TEXT)
RETURNS TEXT AS $$
DECLARE
    clean_student_id TEXT;
    domain_name TEXT;
BEGIN
    -- 학생 ID 정리
    clean_student_id := lower(regexp_replace(student_id, '\s+', '', 'g'));
    
    -- 도메인 이름 가져오기/생성
    domain_name := get_or_create_institution_domain(institution_name);
    
    RETURN clean_student_id || '@' || domain_name;
END;
$$ LANGUAGE plpgsql;

SELECT 'Fundamental tables and institution domain system created successfully!' as status;
