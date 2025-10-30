-- 添加新的学校到数据库
-- 执行时间: 2024年

-- 1. Choate Rosemary Hall
INSERT INTO public.schools (code, name, settings)
VALUES (
  'choate', 
  'Choate Rosemary Hall', 
  '{"website": "https://www.choate.edu/?utm_source=findingschool.com&utm_medium=SMP+Partner", "contact_email": "admissions@choate.edu"}'::jsonb
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  settings = EXCLUDED.settings,
  updated_at = CURRENT_TIMESTAMP;

-- 2. Episcopal High School
INSERT INTO public.schools (code, name, settings)
VALUES (
  'episcopal', 
  'Episcopal High School', 
  '{"website": "https://www.episcopalhighschool.org/?utm_source=findingschool.com", "contact_email": "admissions@episcopalhighschool.org"}'::jsonb
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  settings = EXCLUDED.settings,
  updated_at = CURRENT_TIMESTAMP;

-- 3. Emma Willard School
INSERT INTO public.schools (code, name, settings)
VALUES (
  'emma-willard', 
  'Emma Willard School', 
  '{"website": "https://www.emmawillard.org/?utm_source=findingschool.com&utm_medium=SMP+Partner", "contact_email": "admissions@emmawillard.org"}'::jsonb
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  settings = EXCLUDED.settings,
  updated_at = CURRENT_TIMESTAMP;

-- 4. The Pennington School
INSERT INTO public.schools (code, name, settings)
VALUES (
  'pennington', 
  'The Pennington School', 
  '{"website": "https://www.pennington.org/?utm_source=findingschool.com&utm_medium=SMP+Partner", "contact_email": "admissions@pennington.org"}'::jsonb
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  settings = EXCLUDED.settings,
  updated_at = CURRENT_TIMESTAMP;

-- 5. The Webb School
INSERT INTO public.schools (code, name, settings)
VALUES (
  'webb', 
  'The Webb School', 
  '{"website": "https://www.thewebbschool.com/?utm_source=findingschool.com&utm_medium=SMP+Partner", "contact_email": "admissions@thewebbschool.com"}'::jsonb
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
WHERE code IN ('choate', 'episcopal', 'emma-willard', 'pennington', 'webb')
ORDER BY name;
