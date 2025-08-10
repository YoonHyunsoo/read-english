-- 07_instance.sql
-- 테스트에 필요한 샘플 인스턴스 데이터 생성

-- 기관/고스트 도메인 준비 (고스트 함수가 메인/고스트를 모두 보장)
SELECT get_or_create_institution_and_ghost('Seoul Elementary School');

-- 샘플 사용자 추가 (모든 테스트 계정 비밀번호: vc123456)
INSERT INTO users (email, name, role, password, institution, grade) VALUES
('master@readeeng.com', 'Master Admin', 'master', 'vc123456', 'Read English System', NULL),
('admin@school.edu', 'School Admin', 'admin', 'vc123456', 'Seoul Elementary School', NULL),
('teacher1@school.edu', '김영희', 'teacher', 'vc123456', 'Seoul Elementary School', NULL),
('student1@institute1001', '박지민', 'student', 'vc123456', 'Seoul Elementary School', '초등 3'),
('student2@institute1001', '이민수', 'student', 'vc123456', 'Seoul Elementary School', '초등 3'),
('individual@email.com', '개인학습자', 'individual', 'vc123456', NULL, NULL);


-- 샘플 클래스 추가
INSERT INTO classes (id, name, description, grade, teacher_email, institution) VALUES
('class_001', '3학년 1반 영어', '초등학교 3학년 영어 수업', '{"초등 3"}', 'teacher1@school.edu', 'Seoul Elementary School'),
('class_002', '3학년 2반 영어', '초등학교 3학년 영어 수업', '{"초등 3"}', 'teacher1@school.edu', 'Seoul Elementary School');

-- 클래스 멤버십 추가 (class_members 테이블)
INSERT INTO class_members (class_id, user_email) VALUES
('class_001', 'student1@institute1001'),
('class_001', 'student2@institute1001');

-- 학생을 클래스에 배정 (teacher_email을 통해)
UPDATE users SET teacher_email = 'teacher1@school.edu' WHERE email IN ('student1@institute1001', 'student2@institute1001');

-- 샘플 커리큘럼 추가
INSERT INTO curriculums (class_id, number_of_days, class_format, started_days) VALUES
('class_001', 30, 
'[
    {"id": "activity_1", "type": "vocab", "level": 1},
    {"id": "activity_2", "type": "reading", "level": 1},
    {"id": "activity_3", "type": "listening", "level": 1},
    {"id": "activity_4", "type": "grammar", "level": 1}
]', 
'{1, 2}'),
('class_002', 30,
'[
    {"id": "activity_1", "type": "vocab", "level": 2},
    {"id": "activity_2", "type": "reading", "level": 2},
    {"id": "activity_3", "type": "listening", "level": 2},
    {"id": "activity_4", "type": "grammar", "level": 2}
]',
'{1}');

-- 샘플 진행 상황 추가
INSERT INTO progress (user_email, title, score, total, date) VALUES
('student1@institute1001', 'Level 1 Vocabulary Quiz', 8, 10, '2024-01-15 10:30:00'),
('student1@institute1001', 'My Pet Cat Reading', 3, 3, '2024-01-15 11:00:00'),
('student2@institute1001', 'Level 1 Vocabulary Quiz', 7, 10, '2024-01-15 10:45:00'),
('individual@email.com', 'Level 2 Vocabulary Quiz', 9, 10, '2024-01-16 14:20:00');

-- 샘플 학습 로그 추가
INSERT INTO student_study_logs (user_email, user_name, institution, class_id, class_name, activity_type, activity_title, level, score, total_questions, details) VALUES
('student1@institute1001', '박지민', 'Seoul Elementary School', 'class_001', '3학년 1반 영어', 'vocab', 'Level 1 Vocabulary Quiz', 1, 8, 10, '{"activity_id": "day-1-activity-0"}'),
('student1@institute1001', '박지민', 'Seoul Elementary School', 'class_001', '3학년 1반 영어', 'reading', 'My Pet Cat', 1, 3, 3, '{"activity_id": "day-1-activity-1", "content_id": "reading_1_1"}'),
('student2@institute1001', '이민수', 'Seoul Elementary School', 'class_001', '3학년 1반 영어', 'vocab', 'Level 1 Vocabulary Quiz', 1, 7, 10, '{"activity_id": "day-1-activity-0"}'),
('individual@email.com', '개인학습자', NULL, NULL, NULL, 'vocab', 'Level 2 Vocabulary Quiz', 2, 9, 10, '{"activity_id": "self-study-vocab-2"}');

-- Wordbook/Stars 관련 샘플 로그 및 데이터
-- 단어장 로그 (학생들이 저장했다는 가정)
INSERT INTO wordbook_logs (student_email, word, meaning, source_activity, activity_id, class_id) VALUES
('student1@institute1001', 'apple', '사과', 'self-study', 'self-study-vocab-1', NULL),
('student1@institute1001', 'book', '책', 'reading', 'day-1-activity-1', 'class_001'),
('student2@institute1001', 'car', '자동차', 'listening', 'day-1-activity-2', 'class_001');

-- 별 적립 로그 (레벨업 결과 가정)
INSERT INTO star_accumulation_logs (student_email, stars_gained, reason, activity_id, class_id, score, total_questions) VALUES
('student1@institute1001', 3, 'self-study-quiz', 'self-study-vocab-1', NULL, 5, 5),
('student2@institute1001', 2, 'self-study-quiz', 'self-study-vocab-1', NULL, 4, 5);

-- 사용자 별 초기 stars 값 업데이트 (로그와 일관성 있게 일부 가산)
UPDATE users SET stars = 5 WHERE email = 'student1@institute1001';
UPDATE users SET stars = 2 WHERE email = 'student2@institute1001';

SELECT 'Sample instance data including curriculum, wordbook logs, and star logs created successfully!' as status;

SELECT 'Sample instance data created successfully!' as status;
