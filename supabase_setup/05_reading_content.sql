-- 05_reading_content.sql
-- 읽기 활동에 사용될 콘텐츠 테이블 생성

-- 읽기 자료 테이블
CREATE TABLE reading_materials (
    id TEXT PRIMARY KEY,
    level INTEGER NOT NULL,
    day INTEGER NOT NULL,
    title TEXT NOT NULL,
    passage TEXT NOT NULL,
    mcqs JSONB NOT NULL DEFAULT '[]',
    vocab_items JSONB NOT NULL DEFAULT '[]',
    activity_type TEXT NOT NULL DEFAULT 'reading',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_reading_materials_level ON reading_materials(level);
CREATE INDEX idx_reading_materials_day ON reading_materials(day);
CREATE INDEX idx_reading_materials_level_day ON reading_materials(level, day);

-- 트리거 적용
CREATE TRIGGER update_reading_materials_updated_at BEFORE UPDATE ON reading_materials
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 샘플 읽기 자료 추가
INSERT INTO reading_materials (id, level, day, title, passage, mcqs, vocab_items) VALUES
('reading_1_1', 1, 1, 'My Pet Cat', 
'I have a pet cat named Fluffy. Fluffy is orange and white. She likes to play with a ball of yarn. Every morning, Fluffy sits by the window and watches birds. She is very friendly and loves to be petted. I feed her twice a day with cat food.',
'[
    {"question_text": "What is the cat''s name?", "options": ["Fluffy", "Fuzzy", "Snowball", "Tiger"], "answer": "Fluffy"},
    {"question_text": "What color is Fluffy?", "options": ["black and white", "orange and white", "gray", "brown"], "answer": "orange and white"},
    {"question_text": "What does Fluffy like to play with?", "options": ["a mouse", "a ball of yarn", "a stick", "a toy car"], "answer": "a ball of yarn"}
]',
'[
    {"vocab_id": "pet_1_1", "word": "pet", "part_of_speech": "noun", "meaning_kor": "애완동물", "meaning_eng": "an animal kept for companionship"},
    {"vocab_id": "friendly_1_2", "word": "friendly", "part_of_speech": "adjective", "meaning_kor": "친근한", "meaning_eng": "kind and pleasant"}
]'),

('reading_2_1', 2, 1, 'The Importance of Reading', 
'Reading is one of the most important skills we can develop. When we read books, newspapers, or articles, we learn new information and expand our vocabulary. Reading also improves our writing skills and helps us think more clearly. Many successful people read for at least 30 minutes every day. Libraries are wonderful places where we can find thousands of books on different topics.',
'[
    {"question_text": "What happens when we read?", "options": ["we get tired", "we learn new information", "we become sleepy", "we waste time"], "answer": "we learn new information"},
    {"question_text": "How long do successful people read daily?", "options": ["10 minutes", "20 minutes", "at least 30 minutes", "2 hours"], "answer": "at least 30 minutes"},
    {"question_text": "Where can we find thousands of books?", "options": ["libraries", "restaurants", "parks", "schools only"], "answer": "libraries"}
]',
'[
    {"vocab_id": "develop_2_1", "word": "develop", "part_of_speech": "verb", "meaning_kor": "개발하다", "meaning_eng": "to grow or improve"},
    {"vocab_id": "expand_2_2", "word": "expand", "part_of_speech": "verb", "meaning_kor": "확장하다", "meaning_eng": "to make larger or more extensive"},
    {"vocab_id": "successful_2_3", "word": "successful", "part_of_speech": "adjective", "meaning_kor": "성공한", "meaning_eng": "achieving desired goals"}
]');

SELECT 'Reading materials created successfully with sample data!' as status;
