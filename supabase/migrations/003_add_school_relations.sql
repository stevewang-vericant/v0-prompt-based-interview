-- 为 interviews 表添加 school_code 字段
ALTER TABLE public.interviews 
ADD COLUMN IF NOT EXISTS school_code TEXT;

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS interviews_school_code_idx ON public.interviews(school_code);

COMMENT ON COLUMN public.interviews.school_code IS '学校代码，用于关联面试到特定学校（如 harvard, mit 等）';

-- 创建 schools 表
CREATE TABLE IF NOT EXISTS public.schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  settings JSONB DEFAULT '{}'::jsonb,
  active BOOLEAN DEFAULT true
);

-- 创建索引
CREATE INDEX IF NOT EXISTS schools_code_idx ON public.schools(code);
CREATE INDEX IF NOT EXISTS schools_active_idx ON public.schools(active);

COMMENT ON TABLE public.schools IS '学校信息表';
COMMENT ON COLUMN public.schools.code IS '学校唯一代码（如 harvard, mit），用于 URL 参数';
COMMENT ON COLUMN public.schools.name IS '学校全名';
COMMENT ON COLUMN public.schools.settings IS '学校特定设置（JSON 格式）';

-- 创建 school_admins 表（学校管理员权限）
CREATE TABLE IF NOT EXISTS public.school_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  role TEXT DEFAULT 'admin',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  is_super_admin BOOLEAN DEFAULT false,
  UNIQUE(school_id, email)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS school_admins_school_id_idx ON public.school_admins(school_id);
CREATE INDEX IF NOT EXISTS school_admins_email_idx ON public.school_admins(email);
CREATE INDEX IF NOT EXISTS school_admins_super_admin_idx ON public.school_admins(is_super_admin);

COMMENT ON TABLE public.school_admins IS '学校管理员权限表';
COMMENT ON COLUMN public.school_admins.email IS '管理员邮箱地址（用于登录识别）';
COMMENT ON COLUMN public.school_admins.role IS '角色类型：admin, viewer 等';
COMMENT ON COLUMN public.school_admins.is_super_admin IS '是否为超级管理员（可以查看所有学校的面试）';

-- 插入测试数据：Harvard 学校
INSERT INTO public.schools (code, name, settings)
VALUES ('harvard', 'Harvard University', '{"contact_email": "admissions@harvard.edu"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

-- 插入测试数据：Harvard 管理员
INSERT INTO public.school_admins (school_id, email, name, role)
SELECT 
  s.id,
  'admin@harvard.edu',
  'Harvard Admin',
  'admin'
FROM public.schools s
WHERE s.code = 'harvard'
ON CONFLICT (school_id, email) DO NOTHING;

-- 插入测试数据：超级管理员（你的账号）
-- 注意：超级管理员可以关联到任意学校，或者不关联学校
INSERT INTO public.schools (code, name, settings)
VALUES ('_system', 'System / Super Admin', '{"is_system": true}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.school_admins (school_id, email, name, role, is_super_admin)
SELECT 
  s.id,
  'super@admin.com',  -- 请替换为你的实际邮箱
  'Super Administrator',
  'super_admin',
  true
FROM public.schools s
WHERE s.code = '_system'
ON CONFLICT (school_id, email) DO NOTHING;

-- 为 interviews 表添加外键约束（可选，但不强制）
-- 注意：由于 school_code 可能为 NULL 或不存在的代码，我们不创建强制外键
-- 而是在应用层进行验证

-- 添加触发器自动更新 updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_schools_updated_at BEFORE UPDATE ON public.schools
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

