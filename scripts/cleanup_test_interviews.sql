-- 清理测试面试数据脚本（精确版本）
-- 只删除测试数据，保留真实用户数据

-- 1. 先查看要删除的测试面试记录
SELECT 
    'Test interviews to be deleted:' as info,
    COUNT(*) as count
FROM public.interviews 
WHERE student_email LIKE '%test%' 
   OR student_email LIKE '%@test.com'
   OR student_email LIKE '%@example.com'
   OR student_name LIKE '%test%'
   OR interview_id LIKE '%test%';

-- 2. 删除转录任务记录（关联到测试面试）
DELETE FROM public.transcription_jobs 
WHERE interview_id IN (
    SELECT id FROM public.interviews 
    WHERE student_email LIKE '%test%' 
       OR student_email LIKE '%@test.com'
       OR student_email LIKE '%@example.com'
       OR student_name LIKE '%test%'
       OR interview_id LIKE '%test%'
);

-- 3. 删除面试回答记录（关联到测试面试）
DELETE FROM public.interview_responses 
WHERE interview_id IN (
    SELECT id FROM public.interviews 
    WHERE student_email LIKE '%test%' 
       OR student_email LIKE '%@test.com'
       OR student_email LIKE '%@example.com'
       OR student_name LIKE '%test%'
       OR interview_id LIKE '%test%'
);

-- 4. 删除测试面试记录
DELETE FROM public.interviews 
WHERE student_email LIKE '%test%' 
   OR student_email LIKE '%@test.com'
   OR student_email LIKE '%@example.com'
   OR student_name LIKE '%test%'
   OR interview_id LIKE '%test%';

-- 5. 显示清理后的结果
SELECT 'Cleanup completed. Remaining records:' as status;

SELECT 
    'interviews' as table_name,
    COUNT(*) as remaining_count
FROM public.interviews
UNION ALL
SELECT 
    'interview_responses' as table_name,
    COUNT(*) as remaining_count
FROM public.interview_responses
UNION ALL
SELECT 
    'transcription_jobs' as table_name,
    COUNT(*) as remaining_count
FROM public.transcription_jobs
UNION ALL
SELECT 
    'students' as table_name,
    COUNT(*) as remaining_count
FROM public.students
UNION ALL
SELECT 
    'schools' as table_name,
    COUNT(*) as remaining_count
FROM public.schools
UNION ALL
SELECT 
    'prompts' as table_name,
    COUNT(*) as remaining_count
FROM public.prompts;
