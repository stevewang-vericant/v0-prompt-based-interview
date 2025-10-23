-- Test script for bulk deletion feature
-- This script helps verify the database setup and test data

-- 1. Check if super admin exists
SELECT 
  sa.email,
  sa.name,
  sa.is_super_admin,
  s.name as school_name,
  s.code as school_code
FROM public.school_admins sa
JOIN public.schools s ON sa.school_id = s.id
WHERE sa.is_super_admin = true;

-- 2. Check if there are any interviews to test with
SELECT 
  COUNT(*) as total_interviews,
  COUNT(DISTINCT student_email) as unique_students
FROM public.interviews;

-- 3. Show sample interviews (if any exist)
SELECT 
  id,
  interview_id,
  student_email,
  student_name,
  school_code,
  status,
  created_at
FROM public.interviews 
ORDER BY created_at DESC 
LIMIT 5;

-- 4. Check if we need to create test interviews
-- (This will be empty if no interviews exist)
SELECT 
  'No interviews found - you may need to create test interviews' as message
WHERE NOT EXISTS (SELECT 1 FROM public.interviews);
