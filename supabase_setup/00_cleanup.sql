-- 00_cleanup.sql
-- 데이터베이스 완전 초기화 (주의: 모든 데이터가 삭제됩니다)
-- 모든 테이블을 자동으로 감지하고 삭제합니다.

DO $$
DECLARE
    table_record RECORD;
    function_record RECORD;
    type_record RECORD;
    extension_record RECORD;
BEGIN
    -- 1. 모든 사용자 정의 테이블 삭제 (시스템 테이블 제외)
    RAISE NOTICE '🗑️ 모든 테이블 삭제 중...';
    
    FOR table_record IN
        SELECT schemaname, tablename
        FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename NOT IN (
            'spatial_ref_sys', 'geography_columns', 'geometry_columns', 'raster_columns', 'raster_overviews'
        )
        ORDER BY tablename
    LOOP
        EXECUTE format('DROP TABLE IF EXISTS %I.%I CASCADE', table_record.schemaname, table_record.tablename);
        RAISE NOTICE '✅ 테이블 삭제됨: %', table_record.tablename;
    END LOOP;

    -- 2. 모든 시퀀스 삭제
    RAISE NOTICE '🗑️ 모든 시퀀스 삭제 중...';
    
    FOR table_record IN
        SELECT schemaname, sequencename
        FROM pg_sequences
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP SEQUENCE IF EXISTS %I.%I CASCADE', table_record.schemaname, table_record.sequencename);
        RAISE NOTICE '✅ 시퀀스 삭제됨: %', table_record.sequencename;
    END LOOP;

    -- 3. 설치된 확장 기능 정리 (확장 제공 함수 선제 제거 목적)
    RAISE NOTICE '🗑️ 확장 기능 정리 중...';
    
    FOR extension_record IN
        SELECT extname
        FROM pg_extension
        WHERE extname IN ('uuid-ossp', 'postgis', 'pg_stat_statements')
    LOOP
        EXECUTE format('DROP EXTENSION IF EXISTS %I CASCADE', extension_record.extname);
        RAISE NOTICE '✅ 확장 기능 삭제됨: %', extension_record.extname;
    END LOOP;

    -- 4. 모든 사용자 정의 함수 삭제 (확장 제거 이후 실행)
    RAISE NOTICE '🗑️ 모든 사용자 정의 함수 삭제 중...';
    
    FOR function_record IN
        SELECT n.nspname as schema_name, p.proname as function_name, 
               pg_get_function_identity_arguments(p.oid) as function_args
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
        AND p.proname NOT LIKE 'pg_%'
        AND p.proname NOT LIKE 'st_%'
        ORDER BY p.proname
    LOOP
        EXECUTE format('DROP FUNCTION IF EXISTS %I.%I(%s) CASCADE', 
                      function_record.schema_name, 
                      function_record.function_name, 
                      function_record.function_args);
        RAISE NOTICE '✅ 함수 삭제됨: %(%s)', function_record.function_name, function_record.function_args;
    END LOOP;

    -- 5. 모든 사용자 정의 타입 삭제
    RAISE NOTICE '🗑️ 모든 사용자 정의 타입 삭제 중...';
    
    FOR type_record IN
        SELECT n.nspname as schema_name, t.typname as type_name
        FROM pg_type t
        JOIN pg_namespace n ON t.typnamespace = n.oid
        WHERE n.nspname = 'public'
        AND t.typtype = 'e' -- enum types
        ORDER BY t.typname
    LOOP
        EXECUTE format('DROP TYPE IF EXISTS %I.%I CASCADE', type_record.schema_name, type_record.type_name);
        RAISE NOTICE '✅ 타입 삭제됨: %', type_record.type_name;
    END LOOP;
    
    RAISE NOTICE '🎉 데이터베이스 완전 정리 완료!';
    
END $$;

-- 최종 정리 상태 확인
DO $$
DECLARE
    table_count INTEGER;
    function_count INTEGER;
    type_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count 
    FROM pg_tables 
    WHERE schemaname = 'public'
    AND tablename NOT IN ('spatial_ref_sys', 'geography_columns', 'geometry_columns', 'raster_columns', 'raster_overviews');
    
    SELECT COUNT(*) INTO function_count
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.proname NOT LIKE 'pg_%'
    AND p.proname NOT LIKE 'st_%';
    
    SELECT COUNT(*) INTO type_count
    FROM pg_type t
    JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE n.nspname = 'public'
    AND t.typtype = 'e';
    
    RAISE NOTICE '📊 정리 결과:';
    RAISE NOTICE '   - 남은 테이블: % 개', table_count;
    RAISE NOTICE '   - 남은 함수: % 개', function_count;
    RAISE NOTICE '   - 남은 타입: % 개', type_count;
    
    IF table_count = 0 AND function_count = 0 AND type_count = 0 THEN
        RAISE NOTICE '✨ 완벽한 정리 완료!';
    ELSE
        RAISE NOTICE '⚠️ 일부 객체가 남아있을 수 있습니다.';
    END IF;
END $$;

SELECT 
    '🎉🗑️ 자동 데이터베이스 정리 완료! 🗑️🎉' as "정리 상태",
    '모든 테이블, 함수, 타입, 시퀀스가 자동으로 삭제되었습니다.' as "설명",
    '이제 01_fundamental.sql부터 다시 실행할 수 있습니다.' as "다음 단계";
