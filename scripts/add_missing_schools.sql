-- 添加缺失的学校到数据库
-- 执行时间: 2024年

-- 1. Governors Academy
INSERT INTO public.schools (code, name, settings)
VALUES (
  'governors', 
  'Governors Academy', 
  '{"website": "https://www.governorsacademy.org", "contact_email": "admissions@governorsacademy.org"}'::jsonb
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  settings = EXCLUDED.settings,
  updated_at = CURRENT_TIMESTAMP;

-- 2. Pomfret School
INSERT INTO public.schools (code, name, settings)
VALUES (
  'pomfret', 
  'Pomfret School', 
  '{"website": "https://www.pomfretschool.org", "contact_email": "admissions@pomfretschool.org"}'::jsonb
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  settings = EXCLUDED.settings,
  updated_at = CURRENT_TIMESTAMP;

-- 3. Berkshire School
INSERT INTO public.schools (code, name, settings)
VALUES (
  'berkshire', 
  'Berkshire School', 
  '{"website": "https://www.berkshireschool.org", "contact_email": "admissions@berkshireschool.org"}'::jsonb
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
WHERE code IN ('governors', 'pomfret', 'berkshire')
ORDER BY name;
