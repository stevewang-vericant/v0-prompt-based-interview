-- 添加 The Governor's Academy 到数据库
-- 执行时间: 2025-10-30

-- The Governor's Academy
INSERT INTO public.schools (code, name, settings)
VALUES (
  'governors-academy', 
  'The Governor''s Academy', 
  '{"website": "https://www.thegovernorsacademy.org", "contact_email": "admissions@thegovernorsacademy.org"}'::jsonb
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
WHERE code = 'governors-academy';

