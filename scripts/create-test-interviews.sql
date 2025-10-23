-- Create test interviews for bulk deletion testing
-- This script creates sample interview data for testing

-- Insert test interviews
INSERT INTO public.interviews (
  interview_id,
  student_email,
  student_name,
  school_code,
  video_url,
  subtitle_url,
  total_duration,
  status,
  metadata
) VALUES 
(
  'test-interview-001',
  'john.doe@example.com',
  'John Doe',
  'harvard',
  'https://example.com/video1.mp4',
  'https://example.com/subtitle1.json',
  120,
  'completed',
  '{"test": true}'::jsonb
),
(
  'test-interview-002',
  'jane.smith@example.com',
  'Jane Smith',
  'harvard',
  'https://example.com/video2.mp4',
  'https://example.com/subtitle2.json',
  95,
  'completed',
  '{"test": true}'::jsonb
),
(
  'test-interview-003',
  'bob.wilson@example.com',
  'Bob Wilson',
  'mit',
  'https://example.com/video3.mp4',
  'https://example.com/subtitle3.json',
  110,
  'completed',
  '{"test": true}'::jsonb
),
(
  'test-interview-004',
  'alice.brown@example.com',
  'Alice Brown',
  'kimball-union',
  'https://example.com/video4.mp4',
  'https://example.com/subtitle4.json',
  85,
  'completed',
  '{"test": true}'::jsonb
),
(
  'test-interview-005',
  'charlie.davis@example.com',
  'Charlie Davis',
  'harvard',
  'https://example.com/video5.mp4',
  'https://example.com/subtitle5.json',
  140,
  'completed',
  '{"test": true}'::jsonb
)
ON CONFLICT (interview_id) DO NOTHING;

-- Verify the test data was created
SELECT 
  COUNT(*) as test_interviews_created,
  COUNT(DISTINCT school_code) as schools_with_interviews
FROM public.interviews 
WHERE metadata->>'test' = 'true';
