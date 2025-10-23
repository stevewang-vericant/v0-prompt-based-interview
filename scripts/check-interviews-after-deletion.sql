-- Check interviews after bulk deletion
-- This script helps verify if interviews are actually deleted from the database

-- 1. Check total count of interviews
SELECT COUNT(*) as total_interviews FROM public.interviews;

-- 2. Show all remaining interviews
SELECT 
  id,
  interview_id,
  student_email,
  student_name,
  school_code,
  status,
  created_at
FROM public.interviews 
ORDER BY created_at DESC;

-- 3. Check if specific deleted interviews still exist
-- (Replace these IDs with the ones that were supposedly deleted)
SELECT 
  id,
  interview_id,
  student_email,
  student_name
FROM public.interviews 
WHERE id IN (
  'b4ed4637-79b1-4f77-b607-b070316fc850',
  '796f0c8a-882e-4b79-a93d-862777076e5a',
  '791f05aa-5ab8-44c9-a71a-c5c01074a998'
);

-- 4. Check for any database constraints or foreign key issues
SELECT 
  tc.table_name, 
  tc.constraint_name, 
  tc.constraint_type,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.table_name = 'interviews' 
  AND tc.constraint_type = 'FOREIGN KEY';
