-- 为 interviews 表添加 AI 转录相关字段

-- 1. 添加转录状态字段
ALTER TABLE public.interviews 
ADD COLUMN IF NOT EXISTS transcription_status TEXT DEFAULT 'pending';

-- 2. 添加转录文本内容
ALTER TABLE public.interviews 
ADD COLUMN IF NOT EXISTS transcription_text TEXT;

-- 3. 添加转录文件 URL（如果存储为文件）
ALTER TABLE public.interviews 
ADD COLUMN IF NOT EXISTS transcription_url TEXT;

-- 4. 添加转录元数据（时间戳、置信度等）
ALTER TABLE public.interviews 
ADD COLUMN IF NOT EXISTS transcription_metadata JSONB DEFAULT '{}'::jsonb;

-- 5. 添加转录任务 ID（用于跟踪处理状态）
ALTER TABLE public.interviews 
ADD COLUMN IF NOT EXISTS transcription_job_id TEXT;

-- 创建索引
CREATE INDEX IF NOT EXISTS interviews_transcription_status_idx ON public.interviews(transcription_status);
CREATE INDEX IF NOT EXISTS interviews_transcription_job_id_idx ON public.interviews(transcription_job_id);

-- 添加注释
COMMENT ON COLUMN public.interviews.transcription_status IS '转录状态：pending, processing, completed, failed';
COMMENT ON COLUMN public.interviews.transcription_text IS 'AI 生成的完整转录文本';
COMMENT ON COLUMN public.interviews.transcription_url IS '转录文件存储 URL（如果存储为独立文件）';
COMMENT ON COLUMN public.interviews.transcription_metadata IS '转录元数据：时间戳、置信度、语言等';
COMMENT ON COLUMN public.interviews.transcription_job_id IS '转录任务唯一标识，用于跟踪处理状态';

-- 创建转录任务表（用于跟踪异步任务）
CREATE TABLE IF NOT EXISTS public.transcription_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  interview_id UUID REFERENCES public.interviews(id) ON DELETE CASCADE,
  job_id TEXT UNIQUE NOT NULL, -- OpenAI 任务 ID 或自定义任务 ID
  status TEXT DEFAULT 'pending', -- pending, processing, completed, failed
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3
);

-- 创建索引
CREATE INDEX IF NOT EXISTS transcription_jobs_interview_id_idx ON public.transcription_jobs(interview_id);
CREATE INDEX IF NOT EXISTS transcription_jobs_job_id_idx ON public.transcription_jobs(job_id);
CREATE INDEX IF NOT EXISTS transcription_jobs_status_idx ON public.transcription_jobs(status);

-- 添加注释
COMMENT ON TABLE public.transcription_jobs IS 'AI 转录任务跟踪表';
COMMENT ON COLUMN public.transcription_jobs.job_id IS '外部服务（如 OpenAI）的任务 ID';
COMMENT ON COLUMN public.transcription_jobs.status IS '任务状态：pending, processing, completed, failed';
COMMENT ON COLUMN public.transcription_jobs.retry_count IS '重试次数';
COMMENT ON COLUMN public.transcription_jobs.max_retries IS '最大重试次数';
