-- 为现有的 interviews 表添加视频相关字段
-- 注意：这个表已经存在，我们只是添加新字段

-- 1. 添加面试唯一标识（客户端生成的 interview ID）
ALTER TABLE public.interviews 
ADD COLUMN IF NOT EXISTS interview_id TEXT UNIQUE;

-- 2. 添加视频文件信息
ALTER TABLE public.interviews 
ADD COLUMN IF NOT EXISTS video_url TEXT;

ALTER TABLE public.interviews 
ADD COLUMN IF NOT EXISTS subtitle_url TEXT;

ALTER TABLE public.interviews 
ADD COLUMN IF NOT EXISTS total_duration NUMERIC;

-- 3. 添加学生邮箱（作为备份，因为已经有 student_id 关联）
ALTER TABLE public.interviews 
ADD COLUMN IF NOT EXISTS student_email TEXT;

-- 4. 添加额外元数据字段
ALTER TABLE public.interviews 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS interviews_interview_id_idx ON public.interviews(interview_id);
CREATE INDEX IF NOT EXISTS interviews_student_email_idx ON public.interviews(student_email);
CREATE INDEX IF NOT EXISTS interviews_video_url_idx ON public.interviews(video_url);

-- 注释
COMMENT ON COLUMN public.interviews.interview_id IS '面试唯一标识，客户端生成，用于关联 B2 存储路径';
COMMENT ON COLUMN public.interviews.video_url IS 'B2 存储的完整面试视频 URL (MP4)';
COMMENT ON COLUMN public.interviews.subtitle_url IS 'B2 存储的字幕元数据 JSON URL';
COMMENT ON COLUMN public.interviews.total_duration IS '面试视频总时长（秒）';
COMMENT ON COLUMN public.interviews.student_email IS '学生邮箱地址（冗余字段，便于快速查询）';
COMMENT ON COLUMN public.interviews.metadata IS '额外的面试元数据（如问题列表、答案详情等）';

-- 注意：触发器和 RLS 策略已经在原表中配置，无需重复创建

