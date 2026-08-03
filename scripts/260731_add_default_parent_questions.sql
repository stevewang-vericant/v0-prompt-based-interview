-- File: 260731_add_default_parent_questions.sql
-- Purpose: Seed system-default Parent Interview questions (separate from student prompts).
--          Parent interviews use their own question set. Schools default to the first
--          4 of these questions, and may add/select their own in Settings > Parent Questions.
-- Affected Tables: prompts (rows with school_id = NULL, prompt_type = 'parent')
-- Dependencies: prompts.prompt_type column must exist (added with the parent interview feature)
-- Date: 2026-07-31
--
-- Idempotent: each question is only inserted if an identical default parent prompt
-- (same prompt_text, prompt_type = 'parent', school_id IS NULL) does not already exist.
-- created_at is staggered so ORDER BY created_at ASC yields a deterministic order,
-- which is how the app picks the default first 4 questions.

INSERT INTO prompts (id, category, prompt_text, preparation_time, response_time, is_active, prompt_type, school_id, created_at)
SELECT gen_random_uuid(), v.category, v.prompt_text, 20, 90, true, 'parent', NULL,
       TIMESTAMPTZ '2026-07-31 00:00:00+00' + (v.ord * INTERVAL '1 second')
FROM (VALUES
  (1, 'Family Background',
      'Please introduce yourself and your family, and tell us a little about your child.'),
  (2, 'Motivation',
      'Why are you interested in our school for your child, and what do you hope they will gain here?'),
  (3, 'Your Child',
      'How would you describe your child''s personality, strengths, and the areas where they are still growing?'),
  (4, 'Parental Support',
      'How do you support your child''s learning and personal development at home?'),
  (5, 'Values & Expectations',
      'What values matter most in your family, and what are your expectations for your child''s education?'),
  (6, 'School Partnership',
      'How do you see parents and the school working together to support a child''s success?')
) AS v(ord, category, prompt_text)
WHERE NOT EXISTS (
  SELECT 1 FROM prompts p
  WHERE p.prompt_type = 'parent'
    AND p.school_id IS NULL
    AND p.prompt_text = v.prompt_text
);
