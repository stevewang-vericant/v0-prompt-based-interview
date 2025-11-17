-- 创建视频处理任务表，用于异步处理视频合并
CREATE TABLE IF NOT EXISTS public.video_processing_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  segments JSONB NOT NULL, -- 存储分段信息 [{url, sequenceNumber, duration}]
  error_message TEXT,
  merged_video_url TEXT,
  total_duration NUMERIC,
  segment_durations JSONB, -- 存储每个分段的实际时长
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- 创建索引
CREATE INDEX IF NOT EXISTS video_processing_tasks_interview_id_idx ON public.video_processing_tasks(interview_id);
CREATE INDEX IF NOT EXISTS video_processing_tasks_status_idx ON public.video_processing_tasks(status);
CREATE INDEX IF NOT EXISTS video_processing_tasks_created_at_idx ON public.video_processing_tasks(created_at);

-- 注释
COMMENT ON TABLE public.video_processing_tasks IS '视频处理任务表，用于异步处理视频合并和转码';
COMMENT ON COLUMN public.video_processing_tasks.interview_id IS '面试ID，关联 interviews 表';
COMMENT ON COLUMN public.video_processing_tasks.status IS '任务状态：pending（待处理）、processing（处理中）、completed（已完成）、failed（失败）';
COMMENT ON COLUMN public.video_processing_tasks.segments IS '视频分段信息 JSON 数组';
COMMENT ON COLUMN public.video_processing_tasks.error_message IS '错误信息（如果任务失败）';
COMMENT ON COLUMN public.video_processing_tasks.merged_video_url IS '合并后的视频 URL';
COMMENT ON COLUMN public.video_processing_tasks.total_duration IS '合并后的视频总时长（秒）';
COMMENT ON COLUMN public.video_processing_tasks.segment_durations IS '每个分段的实际时长数组';

