-- 09_verification.sql
-- 데이터베이스 설정이 올바르게 완료되었는지 검증 (넘버링 시스템 포함)

-- 테이블 존재 확인
SELECT '🔍 데이터베이스 테이블 존재 확인 중...' as status;

DO $$
DECLARE
    table_count INTEGER;
    expected_tables TEXT[] := ARRAY[
        'users', 'classes', 'class_members', 'curriculums', 'curriculum_overrides', 'progress',
        'student_study_logs', 'user_action_logs', 'vocab_database',
        'listening_materials', 'reading_materials', 'grammar_materials', 'institution_domains', 'star_accumulation_logs', 'wordbook_logs'
    ];
    tbl_name TEXT;
BEGIN
    FOREACH tbl_name IN ARRAY expected_tables
    LOOP
        SELECT COUNT(*) INTO table_count
        FROM information_schema.tables 
        WHERE table_name = tbl_name AND table_schema = 'public';
        
        IF table_count = 0 THEN
            RAISE EXCEPTION '❌ 에러 [TABLE_MISSING]: 필수 테이블 "%"이(가) 없습니다. SQL 파일을 순서대로 실행했는지 확인하세요.', tbl_name;
        ELSE
            RAISE NOTICE '✅ 테이블 "%" 존재 확인', tbl_name;
        END IF;
    END LOOP;
    
    RAISE NOTICE '🎉 모든 필수 테이블이 존재합니다!';
END $$;

-- 기관 도메인 시스템 검증
SELECT '🏢 기관 도메인 넘버링 시스템 검증 중...' as status;

DO $$
DECLARE
    domain_count INTEGER;
    function_exists INTEGER;
    test_domain TEXT;
    test_email TEXT;
BEGIN
    -- institution_domains 테이블 데이터 확인
    SELECT COUNT(*) INTO domain_count FROM institution_domains;
    IF domain_count = 0 THEN
        RAISE EXCEPTION '❌ 에러 [DOMAIN_EMPTY]: institution_domains 테이블이 비어있습니다. 07_instance.sql을 실행했는지 확인하세요.';
    ELSE
        RAISE NOTICE '✅ 기관 도메인 테이블에 % 개의 기관이 등록됨', domain_count;
    END IF;
    
    -- 도메인 생성 함수 존재 확인
    SELECT COUNT(*) INTO function_exists 
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'get_or_create_institution_domain';
    
    IF function_exists = 0 THEN
        RAISE EXCEPTION '❌ 에러 [FUNCTION_MISSING]: get_or_create_institution_domain 함수가 없습니다. 01_fundamental.sql을 실행했는지 확인하세요.';
    ELSE
        RAISE NOTICE '✅ 기관 도메인 생성 함수 존재 확인';
    END IF;
    
    -- 학생 이메일 생성 함수 존재 확인
    SELECT COUNT(*) INTO function_exists 
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'create_student_email';
    
    IF function_exists = 0 THEN
        RAISE EXCEPTION '❌ 에러 [FUNCTION_MISSING]: create_student_email 함수가 없습니다. 01_fundamental.sql을 실행했는지 확인하세요.';
    ELSE
        RAISE NOTICE '✅ 학생 이메일 생성 함수 존재 확인';
    END IF;
    
    -- 함수 테스트
    BEGIN
        SELECT get_or_create_institution_domain('테스트학교') INTO test_domain;
        RAISE NOTICE '✅ 도메인 생성 함수 테스트 성공: %', test_domain;
        
        SELECT create_student_email('testuser', '테스트학교') INTO test_email;
        RAISE NOTICE '✅ 이메일 생성 함수 테스트 성공: %', test_email;
        
        -- 테스트 데이터 정리
        DELETE FROM institution_domains WHERE institution_name = '테스트학교';
        
    EXCEPTION WHEN OTHERS THEN
        RAISE EXCEPTION '❌ 에러 [FUNCTION_TEST_FAIL]: 함수 테스트 실패 - %', SQLERRM;
    END;
    
    RAISE NOTICE '🎉 기관 도메인 넘버링 시스템이 정상 작동합니다!';
END $$;

-- 샘플 데이터 확인
SELECT '📊 샘플 데이터 존재 확인 중...' as status;

-- 사용자 데이터 확인 (넘버링 이메일)
DO $$
DECLARE
    user_count INTEGER;
    student_email_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO user_count
    FROM users
    WHERE email IN ('master@readeeng.com', 'teacher1@school.edu', 'student1@institute1001');
    
    IF user_count < 3 THEN
        RAISE EXCEPTION '❌ 에러 [USER_DATA_MISSING]: 필수 사용자 데이터가 부족합니다. 현재: %개, 예상: 3개 이상', user_count;
    ELSE
        RAISE NOTICE '✅ 기본 사용자 데이터 존재 (%개)', user_count;
    END IF;
    
    -- 넘버링 이메일을 사용하는 학생 확인
    SELECT COUNT(*) INTO student_email_count
    FROM users
    WHERE role = 'student' AND email ~ '^[^@]+@institute\d{4}$';
    
    IF student_email_count = 0 THEN
        RAISE EXCEPTION '❌ 에러 [STUDENT_EMAIL_FORMAT]: 넘버링 이메일 형식을 사용하는 학생이 없습니다. 07_instance.sql 실행을 확인하세요.';
    ELSE
        RAISE NOTICE '✅ 넘버링 이메일 형식 학생 %명 확인', student_email_count;
    END IF;
END $$;

-- Wordbook/Stars 로그 검증
SELECT '⭐ Wordbook/Stars 로그 검증 중...' as status;

DO $$
DECLARE
    star_log_count INTEGER;
    wordbook_log_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO star_log_count FROM star_accumulation_logs;
    IF star_log_count = 0 THEN
        RAISE WARNING '⚠️ 경고 [STAR_LOG_EMPTY]: star_accumulation_logs가 비어있습니다.';
    ELSE
        RAISE NOTICE '✅ 별 적립 로그 %건 확인', star_log_count;
    END IF;

    SELECT COUNT(*) INTO wordbook_log_count FROM wordbook_logs;
    IF wordbook_log_count = 0 THEN
        RAISE WARNING '⚠️ 경고 [WORDBOOK_LOG_EMPTY]: wordbook_logs가 비어있습니다.';
    ELSE
        RAISE NOTICE '✅ 단어장 로그 %건 확인', wordbook_log_count;
    END IF;
END $$;

-- 학습 콘텐츠 데이터 검증
SELECT '📚 학습 콘텐츠 데이터 검증 중...' as status;

DO $$
DECLARE
    vocab_count INTEGER;
    reading_count INTEGER;
    listening_count INTEGER;
    grammar_count INTEGER;
    class_count INTEGER;
BEGIN
    -- 어휘 데이터 확인
    SELECT COUNT(*) INTO vocab_count FROM vocab_database WHERE level IN (1, 2, 3);
    IF vocab_count = 0 THEN
        RAISE EXCEPTION '❌ 에러 [VOCAB_DATA_MISSING]: 어휘 데이터가 없습니다. 02-03_vocab 파일들을 실행했는지 확인하세요.';
    ELSE
        RAISE NOTICE '✅ 어휘 데이터 % 개 확인', vocab_count;
    END IF;
    
    -- 읽기 자료 확인
    SELECT COUNT(*) INTO reading_count FROM reading_materials WHERE level IN (1, 2);
    IF reading_count = 0 THEN
        RAISE EXCEPTION '❌ 에러 [READING_DATA_MISSING]: 읽기 자료가 없습니다. 05_reading_content.sql을 실행했는지 확인하세요.';
    ELSE
        RAISE NOTICE '✅ 읽기 자료 % 개 확인', reading_count;
    END IF;
    
    -- 듣기 자료 확인
    SELECT COUNT(*) INTO listening_count FROM listening_materials WHERE level IN (1, 2);
    IF listening_count = 0 THEN
        RAISE EXCEPTION '❌ 에러 [LISTENING_DATA_MISSING]: 듣기 자료가 없습니다. 04_listening_content.sql을 실행했는지 확인하세요.';
    ELSE
        RAISE NOTICE '✅ 듣기 자료 % 개 확인', listening_count;
    END IF;
    
    -- 문법 자료 확인
    SELECT COUNT(*) INTO grammar_count FROM grammar_materials WHERE level IN (1, 2);
    IF grammar_count = 0 THEN
        RAISE EXCEPTION '❌ 에러 [GRAMMAR_DATA_MISSING]: 문법 자료가 없습니다. 06_grammar_content.sql을 실행했는지 확인하세요.';
    ELSE
        RAISE NOTICE '✅ 문법 자료 % 개 확인', grammar_count;
    END IF;
    
    -- 클래스 및 커리큘럼 확인
    SELECT COUNT(*) INTO class_count 
    FROM classes c
    JOIN curriculums cu ON c.id = cu.class_id
    WHERE c.id IN ('class_001', 'class_002');
    
    IF class_count = 0 THEN
        RAISE EXCEPTION '❌ 에러 [CLASS_CURRICULUM_MISSING]: 클래스와 커리큘럼 데이터가 연결되지 않았습니다. 07_instance.sql을 확인하세요.';
    ELSE
        RAISE NOTICE '✅ 클래스-커리큘럼 연결 % 개 확인', class_count;
    END IF;
    
    RAISE NOTICE '🎉 모든 학습 콘텐츠 데이터가 정상입니다!';
END $$;

-- 인덱스 및 시스템 구성 요소 확인
SELECT '🔧 시스템 구성 요소 검증 중...' as status;

DO $$
DECLARE
    index_count INTEGER;
    trigger_count INTEGER;
    required_indexes TEXT[] := ARRAY[
        'idx_users_role', 'idx_institution_domains_name', 'idx_institution_domains_number'
    ];
    idx_name TEXT;
BEGIN
    -- 필수 인덱스 확인
    FOREACH idx_name IN ARRAY required_indexes
    LOOP
        SELECT COUNT(*) INTO index_count
        FROM pg_indexes 
        WHERE schemaname = 'public' AND indexname = idx_name;
        
        IF index_count = 0 THEN
            RAISE WARNING '⚠️ 경고 [INDEX_MISSING]: 인덱스 "%"가 없습니다. 성능에 영향을 줄 수 있습니다.', idx_name;
        ELSE
            RAISE NOTICE '✅ 인덱스 "%" 존재 확인', idx_name;
        END IF;
    END LOOP;
    
    -- 트리거 확인
    SELECT COUNT(*) INTO trigger_count
    FROM information_schema.triggers
    WHERE trigger_schema = 'public' AND trigger_name LIKE '%updated_at%';
    
    IF trigger_count = 0 THEN
        RAISE WARNING '⚠️ 경고 [TRIGGER_MISSING]: updated_at 트리거가 없습니다.';
    ELSE
        RAISE NOTICE '✅ 업데이트 트리거 % 개 확인', trigger_count;
    END IF;
END $$;

-- 특수 에러 시나리오 테스트
SELECT '🧪 에러 시나리오 테스트 중...' as status;

DO $$
DECLARE
    error_caught BOOLEAN := FALSE;
BEGIN
    -- 중복 기관명 테스트
    BEGIN
        INSERT INTO institution_domains (institution_name, domain_number, domain_name) 
        VALUES ('Seoul Elementary School', 9999, 'institute9999');
        RAISE EXCEPTION '예상되지 않은 성공: 중복 기관명이 허용되었습니다.';
    EXCEPTION 
        WHEN unique_violation THEN
            error_caught := TRUE;
            RAISE NOTICE '✅ 중복 기관명 방지 테스트 통과';
        WHEN OTHERS THEN
            RAISE EXCEPTION '❌ 에러 [DUPLICATE_TEST_FAIL]: 중복 테스트 중 예상치 못한 에러 - %', SQLERRM;
    END;
    
    -- 중복 도메인 번호 테스트
    BEGIN
        INSERT INTO institution_domains (institution_name, domain_number, domain_name) 
        VALUES ('다른학교', 1001, 'institute1001');
        RAISE EXCEPTION '예상되지 않은 성공: 중복 도메인번호가 허용되었습니다.';
    EXCEPTION 
        WHEN unique_violation THEN
            error_caught := TRUE;
            RAISE NOTICE '✅ 중복 도메인번호 방지 테스트 통과';
        WHEN OTHERS THEN
            RAISE EXCEPTION '❌ 에러 [DOMAIN_NUMBER_TEST_FAIL]: 중복 도메인번호 테스트 중 예상치 못한 에러 - %', SQLERRM;
    END;
    
    IF NOT error_caught THEN
        RAISE EXCEPTION '❌ 에러 [CONSTRAINT_TEST_FAIL]: 제약조건 테스트가 제대로 작동하지 않습니다.';
    END IF;
    
    RAISE NOTICE '🎉 모든 에러 시나리오 테스트 통과!';
END $$;

-- 비밀번호 통일 확인
SELECT '🔐 테스트 계정 비밀번호 통일 확인 중...' as status;

DO $$
DECLARE
    wrong_password_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO wrong_password_count
    FROM users 
    WHERE password != 'vc123456' AND password IS NOT NULL;
    
    IF wrong_password_count > 0 THEN
        RAISE EXCEPTION '❌ 에러 [PASSWORD_MISMATCH]: % 개의 계정이 통일된 비밀번호(vc123456)를 사용하지 않습니다.', wrong_password_count;
    ELSE
        RAISE NOTICE '✅ 모든 테스트 계정이 통일된 비밀번호(vc123456) 사용 중';
    END IF;
END $$;

-- 최종 성공 메시지
SELECT 
    '🎉🎉🎉 넘버링 시스템 데이터베이스 설정 완료! 🎉🎉🎉' as "설정 상태",
    '모든 테이블, 함수, 인덱스, 제약조건이 올바르게 구성되었습니다.' as "확인 사항",
    '이제 Read English 애플리케이션을 사용할 수 있습니다!' as "다음 단계",
    '테스트 계정 비밀번호: vc123456' as "중요 정보";

-- 기관별 학생 현황 요약
SELECT 
    '📋 기관별 학생 현황 요약' as "보고서",
    i.institution_name as "기관명",
    i.domain_name as "도메인",
    COUNT(u.email) as "학생 수"
FROM institution_domains i
LEFT JOIN users u ON u.institution = i.institution_name AND u.role = 'student'
GROUP BY i.institution_name, i.domain_name, i.domain_number
ORDER BY i.domain_number;
