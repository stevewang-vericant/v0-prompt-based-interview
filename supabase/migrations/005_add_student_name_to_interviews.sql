-- Add student_name column to interviews table
-- This enables displaying student's name on dashboard and watch page

BEGIN;

ALTER TABLE public.interviews
ADD COLUMN IF NOT EXISTS student_name TEXT;

COMMENT ON COLUMN public.interviews.student_name IS 'Student full name (optional)';

COMMIT;


