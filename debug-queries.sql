-- 查询 1: 查看最新的 interview 记录及其所有字段
SELECT 
  interview_id, 
  student_email, 
  student_name,
  video_url, 
  subtitle_url,
  status,
  created_at,
  metadata
FROM interviews 
ORDER BY created_at DESC 
LIMIT 1;

-- 查询 2: 查看对应的所有 interview_responses 记录
SELECT 
  ir.sequence_number, 
  ir.prompt_id, 
  ir.video_url, 
  ir.created_at
FROM interview_responses ir
JOIN interviews i ON ir.interview_id = i.id
ORDER BY i.created_at DESC, ir.sequence_number ASC
LIMIT 10;

-- 查询 3: 统计每个 interview 有多少个 responses
SELECT 
  i.interview_id,
  i.student_email,
  COUNT(ir.id) as response_count,
  i.created_at
FROM interviews i
LEFT JOIN interview_responses ir ON ir.interview_id = i.id
GROUP BY i.id, i.interview_id, i.student_email, i.created_at
ORDER BY i.created_at DESC
LIMIT 5;

