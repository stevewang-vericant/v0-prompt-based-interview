-- Seed standard prompts for Phase 1
INSERT INTO prompts (category, prompt_text, preparation_time, response_time, difficulty_level) VALUES
-- Critical Thinking Prompts
('critical_thinking', 'Describe a time when you had to solve a complex problem. What approach did you take and what was the outcome?', 30, 90, 'medium'),
('critical_thinking', 'If you could change one thing about your educational system, what would it be and why?', 30, 90, 'medium'),
('critical_thinking', 'How would you explain the concept of artificial intelligence to someone who has never heard of it?', 30, 90, 'hard'),

-- Conversational Fluency Prompts
('conversational_fluency', 'Tell me about your favorite hobby and why you enjoy it.', 30, 90, 'easy'),
('conversational_fluency', 'Describe your ideal university experience. What would make it memorable?', 30, 90, 'medium'),
('conversational_fluency', 'If you could have dinner with any historical figure, who would it be and what would you discuss?', 30, 90, 'medium'),

-- General Knowledge Prompts
('general_knowledge', 'What do you think is the most important global challenge facing our generation?', 30, 90, 'medium'),
('general_knowledge', 'Explain the importance of cultural diversity in higher education.', 30, 90, 'medium'),
('general_knowledge', 'How has technology changed the way students learn compared to 20 years ago?', 30, 90, 'hard');
