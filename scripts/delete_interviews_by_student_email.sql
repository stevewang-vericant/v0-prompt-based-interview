-- Delete interviews from student with email: ryan.huang@vericant.com
-- This script will remove all interview records for this specific student

-- First, let's see what interviews exist for this student (for verification)
SELECT 
  id,
  interview_id,
  student_email,
  student_name,
  video_url,
  subtitle_url,
  total_duration,
  status,
  created_at
FROM public.interviews 
WHERE student_email = 'ryan.huang@vericant.com';

-- Delete all interviews for this student
-- Note: This will also delete related records due to CASCADE constraints
DELETE FROM public.interviews 
WHERE student_email = 'ryan.huang@vericant.com';

-- Verify the deletion
SELECT 
  COUNT(*) as remaining_interviews
FROM public.interviews 
WHERE student_email = 'ryan.huang@vericant.com';

-- Show total interviews remaining in the system
SELECT 
  COUNT(*) as total_interviews,
  COUNT(DISTINCT student_email) as unique_students
FROM public.interviews;
