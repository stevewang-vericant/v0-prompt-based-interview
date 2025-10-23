-- Add Kimball Union Academy to the schools table
-- This script adds the school and optionally creates an admin account

-- Insert Kimball Union Academy into schools table
INSERT INTO public.schools (code, name, settings, active)
VALUES (
  'kimball-union', 
  'Kimball Union Academy', 
  '{"contact_email": "admissions@kua.org", "website": "https://www.kua.org"}'::jsonb,
  true
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  settings = EXCLUDED.settings,
  active = EXCLUDED.active,
  updated_at = CURRENT_TIMESTAMP;

-- Optional: Add a school admin for Kimball Union Academy
-- Uncomment and modify the email below to add an admin account
/*
INSERT INTO public.school_admins (school_id, email, name, role)
SELECT 
  s.id,
  'admin@kua.org',  -- Replace with actual admin email
  'Kimball Union Academy Admin',
  'admin'
FROM public.schools s
WHERE s.code = 'kimball-union'
ON CONFLICT (school_id, email) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role;

-- Verify the school was added
SELECT 
  id,
  code,
  name,
  settings,
  active,
  created_at
FROM public.schools 
WHERE code = 'kimball-union';
*/
