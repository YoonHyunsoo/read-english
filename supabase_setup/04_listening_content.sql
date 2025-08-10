-- 04_listening_content.sql
-- 듣기 활동에 사용될 콘텐츠 테이블 생성

-- 듣기 자료 테이블
CREATE TABLE listening_materials (
    id TEXT PRIMARY KEY,
    level INTEGER NOT NULL,
    day INTEGER NOT NULL,
    title TEXT NOT NULL,
    script TEXT NOT NULL,
    mcqs JSONB NOT NULL DEFAULT '[]',
    vocab_items JSONB NOT NULL DEFAULT '[]',
    activity_type TEXT NOT NULL DEFAULT 'listening',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_listening_materials_level ON listening_materials(level);
CREATE INDEX idx_listening_materials_day ON listening_materials(day);
CREATE INDEX idx_listening_materials_level_day ON listening_materials(level, day);

-- 트리거 적용
CREATE TRIGGER update_listening_materials_updated_at BEFORE UPDATE ON listening_materials
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 샘플 듣기 자료 추가
INSERT INTO listening_materials (id, level, day, title, script, mcqs, vocab_items) VALUES
('listening_1_1', 1, 1, 'My Daily Routine', 
'Hello, my name is Sarah. I wake up at 7 AM every day. I brush my teeth and eat breakfast. Then I go to school by bus.',
'[{"question_text": "What time does Sarah wake up?", "options": ["6 AM", "7 AM", "8 AM", "9 AM"], "answer": "7 AM"}]',
'[{"vocab_id": "wake_1_1", "word": "wake up", "part_of_speech": "verb", "meaning_kor": "일어나다", "meaning_eng": "to stop sleeping"}]'),

('listening_2_1', 2, 1, 'Environmental Protection', 
'Our planet needs our help. We can protect the environment by recycling and using less electricity.',
'[{"question_text": "How can we protect the environment?", "options": ["by recycling", "by wasting water", "by using more electricity", "by throwing trash"], "answer": "by recycling"}]',
'[{"vocab_id": "environment_2_1", "word": "environment", "part_of_speech": "noun", "meaning_kor": "환경", "meaning_eng": "the natural world"}]');

SELECT 'Listening materials created successfully with sample data!' as status;
