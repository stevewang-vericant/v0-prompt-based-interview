-- 006_fix_rls_policies.sql
-- 修复 RLS 策略，允许匿名用户插入和更新面试数据

BEGIN;

-- 1. 删除可能存在的旧策略（避免冲突）
DROP POLICY IF EXISTS "Allow anonymous insert on interview_responses" ON interview_responses;
DROP POLICY IF EXISTS "Allow anonymous upsert on interviews" ON interviews;
DROP POLICY IF EXISTS "Allow anonymous insert on interviews" ON interviews;
DROP POLICY IF EXISTS "Allow anonymous update on interviews" ON interviews;
DROP POLICY IF EXISTS "Enable insert for anon users" ON interviews;
DROP POLICY IF EXISTS "Enable update for anon users" ON interviews;

-- 2. 为 interviews 表创建新策略
-- 允许匿名用户插入
CREATE POLICY "Allow anonymous insert on interviews"
ON interviews
FOR INSERT
TO anon
WITH CHECK (true);

-- 允许匿名用户更新（用于 upsert）
CREATE POLICY "Allow anonymous update on interviews"
ON interviews
FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);

-- 允许匿名用户查询（用于检查是否存在）
CREATE POLICY "Allow anonymous select on interviews"
ON interviews
FOR SELECT
TO anon
USING (true);

-- 3. 为 interview_responses 表创建新策略
-- 允许匿名用户插入
CREATE POLICY "Allow anonymous insert on interview_responses"
ON interview_responses
FOR INSERT
TO anon
WITH CHECK (true);

-- 允许匿名用户查询
CREATE POLICY "Allow anonymous select on interview_responses"
ON interview_responses
FOR SELECT
TO anon
USING (true);

-- 4. 确保 RLS 已启用
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_responses ENABLE ROW LEVEL SECURITY;

COMMIT;

-- 验证策略是否创建成功
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd
FROM pg_policies 
WHERE tablename IN ('interviews', 'interview_responses')
ORDER BY tablename, policyname;

