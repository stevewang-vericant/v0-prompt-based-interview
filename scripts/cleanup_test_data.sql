-- 清理测试面试数据脚本
-- 保留用户、学校、prompts 和邀请数据

-- 1. 删除转录任务记录（先删除，因为有外键约束）
DELETE FROM public.transcription_jobs;

-- 2. 删除面试回答记录（先删除，因为有外键约束）
DELETE FROM public.interview_responses;

-- 3. 删除面试记录
DELETE FROM public.interviews;

-- 4. 重置序列（如果需要的话）
-- 注意：PostgreSQL 的 UUID 不需要重置序列

-- 5. 显示清理结果
SELECT 'transcription_jobs' as table_name, COUNT(*) as remaining_count FROM public.transcription_jobs
UNION ALL
SELECT 'interview_responses' as table_name, COUNT(*) as remaining_count FROM public.interview_responses
UNION ALL
SELECT 'interviews' as table_name, COUNT(*) as remaining_count FROM public.interviews
UNION ALL
SELECT 'students' as table_name, COUNT(*) as remaining_count FROM public.students
UNION ALL
SELECT 'schools' as table_name, COUNT(*) as remaining_count FROM public.schools
UNION ALL
SELECT 'prompts' as table_name, COUNT(*) as remaining_count FROM public.prompts
UNION ALL
SELECT 'invitations' as table_name, COUNT(*) as remaining_count FROM public.invitations;

-- 6. 显示清理完成信息
SELECT 'Test interview data cleanup completed successfully!' as status;
