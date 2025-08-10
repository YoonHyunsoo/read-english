-- 10_ghost_archiving.sql
-- Ghost(보관) 처리 구조 및 유틸 함수 추가

-- 1) 사용자 상태 타입 및 컬럼 추가
DO $$ BEGIN
    CREATE TYPE user_status AS ENUM ('active', 'ghost');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE users ADD COLUMN IF NOT EXISTS status user_status NOT NULL DEFAULT 'active';
ALTER TABLE users ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS original_email TEXT NULL;

-- 2) 기관 도메인 테이블에 고스트 메타 정보 추가
ALTER TABLE institution_domains ADD COLUMN IF NOT EXISTS is_ghost BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE institution_domains ADD COLUMN IF NOT EXISTS origin_institution_name TEXT NULL; -- 정상 기관명(고스트인 경우만)

CREATE INDEX IF NOT EXISTS idx_institution_domains_is_ghost ON institution_domains(is_ghost);

-- 3) 사용자 액션 타입 확장
DO $$ BEGIN
    ALTER TYPE user_action_type ADD VALUE 'restore_user';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TYPE user_action_type ADD VALUE 'archive_institution';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TYPE user_action_type ADD VALUE 'restore_institution';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 4) 고스트 기관/도메인 보장 함수
CREATE OR REPLACE FUNCTION get_or_create_institution_and_ghost(institution_name TEXT)
RETURNS TEXT AS $$
DECLARE
    main_domain TEXT;
    ghost_institution_name TEXT;
    ghost_domain_name TEXT;
    new_domain_number INTEGER;
BEGIN
    -- 기존 로직으로 메인 도메인 확보
    main_domain := get_or_create_institution_domain(institution_name);

    ghost_institution_name := institution_name || '_ghost';
    ghost_domain_name := main_domain || '_ghost';

    -- 고스트 도메인이 없으면 생성 (domain_number는 새 번호 할당)
    IF NOT EXISTS (
        SELECT 1 FROM institution_domains idt
        WHERE idt.institution_name = ghost_institution_name
    ) THEN
        SELECT COALESCE(MAX(domain_number), 1000) + 1 INTO new_domain_number FROM institution_domains;

        INSERT INTO institution_domains (institution_name, domain_number, domain_name, is_ghost, origin_institution_name)
        VALUES (
            ghost_institution_name,
            new_domain_number,
            ghost_domain_name,
            TRUE,
            get_or_create_institution_and_ghost.institution_name
        );
    END IF;

    RETURN main_domain;
END;
$$ LANGUAGE plpgsql;

-- 5) 특정 기관의 고스트 도메인 반환
CREATE OR REPLACE FUNCTION get_ghost_domain_for_institution(institution_name TEXT)
RETURNS TEXT AS $$
DECLARE
    main_domain TEXT;
    ghost_domain TEXT;
BEGIN
    main_domain := get_or_create_institution_domain(institution_name);
    ghost_domain := main_domain || '_ghost';
    PERFORM get_or_create_institution_and_ghost(institution_name);
    RETURN ghost_domain;
END;
$$ LANGUAGE plpgsql;

-- 6) 고스트용 유니크 이메일 생성
CREATE OR REPLACE FUNCTION make_unique_email_for_ghost(orig_email TEXT, ghost_domain TEXT)
RETURNS TEXT AS $$
DECLARE
    local_part TEXT;
    at_pos INT;
    candidate TEXT;
    i INT := 0;
BEGIN
    at_pos := POSITION('@' IN orig_email);
    IF at_pos = 0 THEN
        -- '@'가 없으면 전체를 로컬로 보고 붙임
        local_part := orig_email;
    ELSE
        local_part := SUBSTRING(orig_email FROM 1 FOR at_pos - 1);
    END IF;

    candidate := local_part || '@' || ghost_domain;
    WHILE EXISTS(SELECT 1 FROM users WHERE email = candidate) LOOP
        i := i + 1;
        candidate := local_part || '-arch' || LPAD(i::TEXT, 2, '0') || '@' || ghost_domain;
    END LOOP;

    RETURN candidate;
END;
$$ LANGUAGE plpgsql;

-- 7) 사용자 보관 처리(고스트 이동 + 이메일 충돌 회피)
CREATE OR REPLACE FUNCTION archive_user_account(target_email TEXT, actor_email TEXT)
RETURNS TEXT AS $$
DECLARE
    u RECORD;
    ghost_domain TEXT;
    new_email TEXT;
    new_institution TEXT;
BEGIN
    SELECT * INTO u FROM users WHERE email = target_email;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'User % not found', target_email;
    END IF;

    IF u.status = 'ghost' THEN
        RETURN u.email; -- 이미 보관됨
    END IF;

    -- 고스트 도메인/기관명
    IF u.institution IS NULL THEN
        -- 기관 미지정 사용자는 기관명 없이 도메인만 전환
        ghost_domain := 'institute0000_ghost';
    ELSE
        ghost_domain := get_ghost_domain_for_institution(u.institution);
    END IF;
    new_institution := COALESCE(u.institution, '') || CASE WHEN u.institution IS NULL THEN '' ELSE '_ghost' END;

    -- original_email 설정(최초 1회만)
    IF u.original_email IS NULL THEN
        UPDATE users SET original_email = u.email WHERE email = u.email;
    END IF;

    -- 이메일을 고스트 도메인으로 옮기며 충돌 회피
    new_email := make_unique_email_for_ghost(u.email, ghost_domain);

    UPDATE users
    SET email = new_email,
        status = 'ghost',
        archived_at = NOW(),
        institution = CASE WHEN u.institution IS NULL THEN NULL ELSE new_institution END
    WHERE users.email = u.email;

    -- 로그 기록
    INSERT INTO user_action_logs(actor_email, actor_name, action_type, target_email, target_name, target_role, institution, details)
    VALUES (
        actor_email,
        NULL,
        'archive_user',
        new_email,
        u.name,
        u.role::TEXT,
        new_institution,
        jsonb_build_object('from_email', u.email, 'to_email', new_email)
    );

    RETURN new_email;
END;
$$ LANGUAGE plpgsql;

-- 8) 기관 보관 처리(소속 전원 보관)
CREATE OR REPLACE FUNCTION archive_institution_accounts(inst_name TEXT, actor_email TEXT)
RETURNS INTEGER AS $$
DECLARE
    u RECORD;
    cnt INT := 0;
BEGIN
    FOR u IN SELECT email FROM users WHERE institution = inst_name LOOP
        PERFORM archive_user_account(u.email, actor_email);
        cnt := cnt + 1;
    END LOOP;

    INSERT INTO user_action_logs(actor_email, actor_name, action_type, target_email, institution, details)
    VALUES (actor_email, NULL, 'archive_institution', 'institution:' || inst_name, inst_name, jsonb_build_object('note','archived all accounts'));
    RETURN cnt;
END;
$$ LANGUAGE plpgsql;

-- 9) 사용자 복원(새 기관/새 이메일 적용 가능)
CREATE OR REPLACE FUNCTION restore_user_account(target_email TEXT, new_institution TEXT, new_email TEXT, actor_email TEXT)
RETURNS TEXT AS $$
DECLARE
    u RECORD;
    final_email TEXT;
BEGIN
    SELECT * INTO u FROM users WHERE email = target_email;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'User % not found', target_email;
    END IF;

    final_email := COALESCE(new_email, u.original_email);
    IF final_email IS NULL THEN
        RAISE EXCEPTION 'No original_email to restore for %', target_email;
    END IF;

    IF EXISTS(SELECT 1 FROM users WHERE email = final_email AND email <> target_email) THEN
        RAISE EXCEPTION 'Email % already in use', final_email;
    END IF;

    UPDATE users
    SET email = final_email,
        status = 'active',
        institution = new_institution,
        archived_at = NULL
    WHERE email = target_email;

    INSERT INTO user_action_logs(actor_email, actor_name, action_type, target_email, target_name, target_role, institution, details)
    VALUES (
        actor_email,
        NULL,
        'restore_user',
        final_email,
        u.name,
        u.role::TEXT,
        new_institution,
        jsonb_build_object('from_email', target_email, 'to_email', final_email)
    );

    RETURN final_email;
END;
$$ LANGUAGE plpgsql;

SELECT 'Ghost archiving schema and functions applied' AS status;


