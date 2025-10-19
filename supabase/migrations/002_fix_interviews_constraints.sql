-- 修复 interviews 表约束：允许 student_id 和 school_id 为 NULL
-- 因为当前阶段我们使用 student_email，还没有学生/学校表关联

-- 1. 删除外键约束
ALTER TABLE public.interviews 
DROP CONSTRAINT IF EXISTS interviews_student_id_fkey;

ALTER TABLE public.interviews 
DROP CONSTRAINT IF EXISTS interviews_school_id_fkey;

-- 2. 修改列为可空
ALTER TABLE public.interviews 
ALTER COLUMN student_id DROP NOT NULL;

ALTER TABLE public.interviews 
ALTER COLUMN school_id DROP NOT NULL;

-- 3. 重新添加外键约束（但允许 NULL）
ALTER TABLE public.interviews 
ADD CONSTRAINT interviews_student_id_fkey 
FOREIGN KEY (student_id) 
REFERENCES students (id) 
ON DELETE CASCADE;

ALTER TABLE public.interviews 
ADD CONSTRAINT interviews_school_id_fkey 
FOREIGN KEY (school_id) 
REFERENCES schools (id) 
ON DELETE CASCADE;

-- 注释
COMMENT ON COLUMN public.interviews.student_id IS '学生 ID（可选，如果没有则使用 student_email）';
COMMENT ON COLUMN public.interviews.school_id IS '学校 ID（可选，当前阶段可为空）';

