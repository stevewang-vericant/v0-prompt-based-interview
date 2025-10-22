-- 为 transcription_jobs 表添加 video_url 字段

-- 添加视频 URL 字段
ALTER TABLE public.transcription_jobs 
ADD COLUMN IF NOT EXISTS video_url TEXT;

-- 添加元数据字段（用于存储额外的任务信息）
ALTER TABLE public.transcription_jobs 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- 添加注释
COMMENT ON COLUMN public.transcription_jobs.video_url IS '要转录的视频文件 URL';
COMMENT ON COLUMN public.transcription_jobs.metadata IS '任务元数据：模型版本、参数等';
