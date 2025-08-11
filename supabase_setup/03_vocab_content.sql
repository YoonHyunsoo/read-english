-- 03_vocab_content.sql
-- Vocab 콘텐츠 스키마 및 샘플 데이터 생성

CREATE TABLE IF NOT EXISTS vocab_materials (
    id TEXT PRIMARY KEY,
    level INTEGER NOT NULL,
    day INTEGER NOT NULL,
    title TEXT NOT NULL,
    vocab1 TEXT NULL,
    type1 SMALLINT NULL CHECK (type1 BETWEEN 1 AND 4),
    vocab2 TEXT NULL,
    type2 SMALLINT NULL CHECK (type2 BETWEEN 1 AND 4),
    vocab3 TEXT NULL,
    type3 SMALLINT NULL CHECK (type3 BETWEEN 1 AND 4),
    vocab4 TEXT NULL,
    type4 SMALLINT NULL CHECK (type4 BETWEEN 1 AND 4),
    vocab5 TEXT NULL,
    type5 SMALLINT NULL CHECK (type5 BETWEEN 1 AND 4),
    vocab6 TEXT NULL,
    type6 SMALLINT NULL CHECK (type6 BETWEEN 1 AND 4),
    vocab7 TEXT NULL,
    type7 SMALLINT NULL CHECK (type7 BETWEEN 1 AND 4),
    vocab8 TEXT NULL,
    type8 SMALLINT NULL CHECK (type8 BETWEEN 1 AND 4),
    vocab9 TEXT NULL,
    type9 SMALLINT NULL CHECK (type9 BETWEEN 1 AND 4),
    vocab10 TEXT NULL,
    type10 SMALLINT NULL CHECK (type10 BETWEEN 1 AND 4),
    UNIQUE(level, day)
);

-- Seed data intentionally omitted. Populate this table via Supabase import/SQL after deployment.
SELECT 'vocab_materials schema created (no seed data)' as status;
