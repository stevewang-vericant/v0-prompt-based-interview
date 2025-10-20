import { createClient } from '@supabase/supabase-js'

/**
 * Admin Supabase Client (使用 Service Role Key)
 * 
 * ⚠️ 警告：此 client 绕过所有 RLS 策略，仅用于服务器端操作
 * 不要在客户端代码中使用！
 * 
 * 用途：
 * - 服务器端数据库写操作（interviews, interview_responses）
 * - 后台任务（transcription jobs）
 * - 管理员操作
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      'Missing Supabase environment variables. Please check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY'
    )
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

