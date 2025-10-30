-- 添加 The Northwest School 到数据库
-- 执行时间: 2024年

-- The Northwest School
INSERT INTO public.schools (code, name, settings)
VALUES (
  'northwest', 
  'The Northwest School', 
  '{"website": "https://www.northwestschool.org", "contact_email": "admissions@northwestschool.org"}'::jsonb
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
WHERE code = 'northwest';

