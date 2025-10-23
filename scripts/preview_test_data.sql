-- 预览测试数据清理脚本
-- 先查看要删除的数据，确认后再执行清理

-- 1. 查看转录任务记录
SELECT 
    'transcription_jobs' as table_name,
    COUNT(*) as record_count,
    'These will be deleted' as action
FROM public.transcription_jobs;

-- 2. 查看面试回答记录
SELECT 
    'interview_responses' as table_name,
    COUNT(*) as record_count,
    'These will be deleted' as action
FROM public.interview_responses;

-- 3. 查看面试记录
SELECT 
    'interviews' as table_name,
    COUNT(*) as record_count,
    'These will be deleted' as action
FROM public.interviews;

-- 4. 查看要保留的数据
SELECT 
    'students' as table_name,
    COUNT(*) as record_count,
    'These will be KEPT' as action
FROM public.students
UNION ALL
SELECT 
    'schools' as table_name,
    COUNT(*) as record_count,
    'These will be KEPT' as action
FROM public.schools
UNION ALL
SELECT 
    'prompts' as table_name,
    COUNT(*) as record_count,
    'These will be KEPT' as action
FROM public.prompts
UNION ALL
SELECT 
    'invitations' as table_name,
    COUNT(*) as record_count,
    'These will be KEPT' as action
FROM public.invitations;

-- 5. 查看具体的面试记录详情（可选）
SELECT 
    i.id,
    i.interview_id,
    i.student_email,
    i.student_name,
    i.status,
    i.created_at,
    i.video_url
FROM public.interviews i
ORDER BY i.created_at DESC
LIMIT 10;
