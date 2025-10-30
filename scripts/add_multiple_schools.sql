-- 添加多个学校到数据库
-- 执行时间: 2024年

-- 1. Oregon Episcopal School
INSERT INTO public.schools (code, name, settings)
VALUES (
  'oregon-episcopal', 
  'Oregon Episcopal School', 
  '{"website": "https://www.oes.edu", "contact_email": "admissions@oes.edu"}'::jsonb
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  settings = EXCLUDED.settings,
  updated_at = CURRENT_TIMESTAMP;

-- 2. Westover School
INSERT INTO public.schools (code, name, settings)
VALUES (
  'westover', 
  'Westover School', 
  '{"website": "https://www.westoverschool.org", "contact_email": "admissions@westoverschool.org"}'::jsonb
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  settings = EXCLUDED.settings,
  updated_at = CURRENT_TIMESTAMP;

-- 3. Annie Wright Schools
INSERT INTO public.schools (code, name, settings)
VALUES (
  'annie-wright', 
  'Annie Wright Schools', 
  '{"website": "https://www.aw.org", "contact_email": "admissions@aw.org"}'::jsonb
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  settings = EXCLUDED.settings,
  updated_at = CURRENT_TIMESTAMP;

-- 4. The Webb School (已在数据库中，更新信息)
INSERT INTO public.schools (code, name, settings)
VALUES (
  'webb', 
  'The Webb School', 
  '{"website": "https://www.thewebbschool.com", "contact_email": "admissions@thewebbschool.com"}'::jsonb
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  settings = EXCLUDED.settings,
  updated_at = CURRENT_TIMESTAMP;

-- 5. Cheshire Academy
INSERT INTO public.schools (code, name, settings)
VALUES (
  'cheshire', 
  'Cheshire Academy', 
  '{"website": "https://www.cheshireacademy.org", "contact_email": "admissions@cheshireacademy.org"}'::jsonb
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  settings = EXCLUDED.settings,
  updated_at = CURRENT_TIMESTAMP;

-- 6. Christ School
INSERT INTO public.schools (code, name, settings)
VALUES (
  'christ-school', 
  'Christ School', 
  '{"website": "https://www.christschool.org", "contact_email": "admissions@christschool.org"}'::jsonb
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  settings = EXCLUDED.settings,
  updated_at = CURRENT_TIMESTAMP;

-- 7. Chatham Hall
INSERT INTO public.schools (code, name, settings)
VALUES (
  'chatham-hall', 
  'Chatham Hall', 
  '{"website": "https://www.chathamhall.org", "contact_email": "admissions@chathamhall.org"}'::jsonb
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  settings = EXCLUDED.settings,
  updated_at = CURRENT_TIMESTAMP;

-- 验证插入结果
SELECT 
  code,
  name,
  settings->>'website' as website,
  created_at,
  updated_at
FROM public.schools 
WHERE code IN ('oregon-episcopal', 'westover', 'annie-wright', 'webb', 'cheshire', 'christ-school', 'chatham-hall')
ORDER BY name;
