-- 03_vocab_content.sql
-- 어휘 활동 정보 (테이블 생성 없음)

-- 이 파일은 정보 제공 목적입니다.
-- 어휘 활동은 vocab_database 테이블에서 동적으로 생성됩니다.
-- 
-- 어휘 활동의 작동 방식:
-- 1. 사용자가 특정 레벨의 어휘 활동을 선택
-- 2. 시스템이 vocab_database에서 해당 레벨의 단어들을 조회
-- 3. 무작위로 10개의 단어를 선택하여 퀴즈 생성
-- 4. 각 문제는 한국어 의미를 보고 영어 단어를 선택하는 형식
--
-- 예시 쿼리:
-- SELECT * FROM vocab_database WHERE level = 1 ORDER BY RANDOM() LIMIT 10;

SELECT 'Vocabulary content information provided - no tables created.' as status;
