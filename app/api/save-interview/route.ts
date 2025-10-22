import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    console.log('[API] Saving interview to database:', data.interview_id)
    
    // 使用 admin client 绕过 RLS（服务器端操作）
    const supabase = createAdminClient()
    
    // 准备插入数据
    const insertData = {
      interview_id: data.interview_id,
      student_email: data.student_email,
      student_name: data.student_name,
      video_url: data.video_url,
      subtitle_url: data.subtitle_url,
      total_duration: data.total_duration,
      school_code: data.school_code,
      metadata: data.metadata || {},
      status: 'completed',
      completed_at: new Date().toISOString(),
      submitted_at: new Date().toISOString(),
    }
    
    // 使用 upsert 避免重复键错误
    const { data: interview, error } = await supabase
      .from('interviews')
      .upsert(insertData, {
        onConflict: 'interview_id',
        ignoreDuplicates: false
      })
      .select()
      .single()
    
    if (error) {
      console.error('[API] Error saving interview:', error)
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 })
    }
    
    console.log('[API] Interview saved/updated successfully:', interview.id)
    return NextResponse.json({
      success: true,
      interview
    })
    
  } catch (error) {
    console.error('[API] Unexpected error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
