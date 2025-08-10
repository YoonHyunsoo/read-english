-- 06_grammar_content.sql
-- 문법 활동에 사용될 콘텐츠 테이블 생성

-- 문법 자료 테이블
CREATE TABLE grammar_materials (
    id TEXT PRIMARY KEY,
    level INTEGER NOT NULL,
    day INTEGER NOT NULL,
    title TEXT NOT NULL,
    questions JSONB NOT NULL DEFAULT '[]',
    activity_type TEXT NOT NULL DEFAULT 'grammar',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_grammar_materials_level ON grammar_materials(level);
CREATE INDEX idx_grammar_materials_day ON grammar_materials(day);
CREATE INDEX idx_grammar_materials_level_day ON grammar_materials(level, day);

-- 트리거 적용
CREATE TRIGGER update_grammar_materials_updated_at BEFORE UPDATE ON grammar_materials
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 샘플 문법 자료 추가
INSERT INTO grammar_materials (id, level, day, title, questions) VALUES
('grammar_1_1', 1, 1, 'Present Tense - Be Verbs', 
'[
    {"text": "I ___ a student.", "options": ["am", "is", "are", "be"], "answer": "am"},
    {"text": "She ___ my friend.", "options": ["am", "is", "are", "be"], "answer": "is"},
    {"text": "They ___ happy.", "options": ["am", "is", "are", "be"], "answer": "are"},
    {"text": "We ___ in the classroom.", "options": ["am", "is", "are", "be"], "answer": "are"},
    {"text": "He ___ tall.", "options": ["am", "is", "are", "be"], "answer": "is"}
]'),

('grammar_1_2', 1, 2, 'Articles - A, An, The', 
'[
    {"text": "I have ___ apple.", "options": ["a", "an", "the", ""], "answer": "an"},
    {"text": "___ sun is bright.", "options": ["A", "An", "The", ""], "answer": "The"},
    {"text": "She is ___ teacher.", "options": ["a", "an", "the", ""], "answer": "a"},
    {"text": "This is ___ umbrella.", "options": ["a", "an", "the", ""], "answer": "an"},
    {"text": "___ dog is sleeping.", "options": ["A", "An", "The", ""], "answer": "The"}
]'),

('grammar_2_1', 2, 1, 'Past Tense - Regular Verbs', 
'[
    {"text": "I ___ my homework yesterday.", "options": ["finish", "finished", "finishing", "will finish"], "answer": "finished"},
    {"text": "She ___ to the store last week.", "options": ["walk", "walked", "walking", "will walk"], "answer": "walked"},
    {"text": "They ___ a movie last night.", "options": ["watch", "watched", "watching", "will watch"], "answer": "watched"},
    {"text": "We ___ our friends yesterday.", "options": ["visit", "visited", "visiting", "will visit"], "answer": "visited"},
    {"text": "He ___ the door this morning.", "options": ["open", "opened", "opening", "will open"], "answer": "opened"}
]'),

('grammar_2_2', 2, 2, 'Future Tense - Will', 
'[
    {"text": "I ___ go to school tomorrow.", "options": ["will", "would", "should", "could"], "answer": "will"},
    {"text": "She ___ call you later.", "options": ["will", "would", "should", "could"], "answer": "will"},
    {"text": "They ___ arrive at 3 PM.", "options": ["will", "would", "should", "could"], "answer": "will"},
    {"text": "We ___ have dinner together.", "options": ["will", "would", "should", "could"], "answer": "will"},
    {"text": "The weather ___ be sunny tomorrow.", "options": ["will", "would", "should", "could"], "answer": "will"}
]');

SELECT 'Grammar materials created successfully with sample data!' as status;
