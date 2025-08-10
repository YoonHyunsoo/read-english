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

-- 샘플 어휘 데이터 추가
INSERT INTO vocab_database (vocab_id, word, level, word_no, part_of_speech, meaning_kor, meaning_eng, sentence) VALUES

-- Level 1 Vocabulary
('apple_1_1', 'apple', 1, 1, 'noun', '사과', 'a red or green fruit', 'I eat an apple every day.'),
('book_1_2', 'book', 1, 2, 'noun', '책', 'something you read', 'This is a good book.'),
('cat_1_3', 'cat', 1, 3, 'noun', '고양이', 'a small furry animal', 'My cat is very cute.'),
('dog_1_4', 'dog', 1, 4, 'noun', '개', 'a common pet animal', 'The dog is playing in the yard.'),
('egg_1_5', 'egg', 1, 5, 'noun', '달걀', 'something chickens lay', 'I had an egg for breakfast.'),
('fish_1_6', 'fish', 1, 6, 'noun', '물고기', 'an animal that lives in water', 'We saw many fish in the ocean.'),
('green_1_7', 'green', 1, 7, 'adjective', '초록색의', 'the color of grass', 'The grass is green.'),
('house_1_8', 'house', 1, 8, 'noun', '집', 'a place where people live', 'This is my house.'),
('ice_1_9', 'ice', 1, 9, 'noun', '얼음', 'frozen water', 'Please put ice in my drink.'),
('jump_1_10', 'jump', 1, 10, 'verb', '점프하다', 'to move up quickly', 'Can you jump high?'),

-- Level 2 Vocabulary
('beautiful_2_1', 'beautiful', 2, 1, 'adjective', '아름다운', 'very pretty', 'The sunset is beautiful.'),
('computer_2_2', 'computer', 2, 2, 'noun', '컴퓨터', 'a machine for work', 'I use my computer every day.'),
('difficult_2_3', 'difficult', 2, 3, 'adjective', '어려운', 'hard to do', 'This math problem is difficult.'),
('elephant_2_4', 'elephant', 2, 4, 'noun', '코끼리', 'a large gray animal', 'The elephant is very big.'),
('fantastic_2_5', 'fantastic', 2, 5, 'adjective', '환상적인', 'extremely good', 'The movie was fantastic.'),
('guitar_2_6', 'guitar', 2, 6, 'noun', '기타', 'a musical instrument', 'He plays the guitar well.'),
('hospital_2_7', 'hospital', 2, 7, 'noun', '병원', 'a place for sick people', 'She works at the hospital.'),
('important_2_8', 'important', 2, 8, 'adjective', '중요한', 'very necessary', 'Education is important.'),
('journey_2_9', 'journey', 2, 9, 'noun', '여행', 'a long trip', 'Our journey was amazing.'),
('kitchen_2_10', 'kitchen', 2, 10, 'noun', '부엌', 'a place to cook', 'Mom is cooking in the kitchen.'),

-- Level 3 Vocabulary
('adventure_3_1', 'adventure', 3, 1, 'noun', '모험', 'an exciting experience', 'The book tells an amazing adventure.'),
('business_3_2', 'business', 3, 2, 'noun', '사업', 'commercial activity', 'He started his own business.'),
('celebrate_3_3', 'celebrate', 3, 3, 'verb', '축하하다', 'to mark a special occasion', 'We celebrate birthdays with cake.'),
('democracy_3_4', 'democracy', 3, 4, 'noun', '민주주의', 'government by the people', 'Democracy gives people voting rights.'),
('environment_3_5', 'environment', 3, 5, 'noun', '환경', 'the natural world', 'We must protect the environment.'),
('furniture_3_6', 'furniture', 3, 6, 'noun', '가구', 'things like chairs and tables', 'The furniture in this room is modern.'),
('generation_3_7', 'generation', 3, 7, 'noun', '세대', 'people of similar age', 'The younger generation uses technology more.'),
('hurricane_3_8', 'hurricane', 3, 8, 'noun', '허리케인', 'a powerful storm', 'The hurricane caused much damage.'),
('imagination_3_9', 'imagination', 3, 9, 'noun', '상상력', 'ability to create mental images', 'Children have wonderful imagination.'),
('journalism_3_10', 'journalism', 3, 10, 'noun', '저널리즘', 'the profession of writing news', 'She studied journalism in college.');

SELECT 'Vocabulary database created successfully with sample data!' as status;
