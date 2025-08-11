-- 02_vocab_database.sql
-- 어휘 학습의 기반이 되는 중앙 어휘 데이터베이스 생성

-- 어휘 데이터베이스 테이블
CREATE TABLE vocab_database (
    vocab_id TEXT PRIMARY KEY,
    word TEXT NOT NULL,
    level INTEGER NOT NULL,
    word_no INTEGER NOT NULL,
    part_of_speech TEXT NOT NULL,
    meaning_kor TEXT NOT NULL,
    meaning_eng TEXT NOT NULL,
    sentence TEXT,
    sentence_eng_highlight TEXT,
    sentence_kor TEXT,
    sentence_kor_highlight TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_vocab_database_level ON vocab_database(level);
CREATE INDEX idx_vocab_database_word ON vocab_database(word);
CREATE INDEX idx_vocab_database_level_word_no ON vocab_database(level, word_no);

-- 트리거 적용
CREATE TRIGGER update_vocab_database_updated_at BEFORE UPDATE ON vocab_database
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Seed data intentionally omitted. Populate this table via Supabase import/SQL after deployment.
SELECT 'vocab_database schema created (no seed data)' as status;
