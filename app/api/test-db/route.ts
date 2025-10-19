import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // 测试数据库连接
    const { data, error } = await supabase
      .from('interviews')
      .select('count')
      .limit(1)
    
    if (error) {
      return NextResponse.json({
        status: 'error',
        message: error.message,
        supabaseConfigured: !!process.env.NEXT_PUBLIC_SUPABASE_URL
      }, { status: 500 })
    }
    
    return NextResponse.json({
      status: 'success',
      message: 'Database connection successful',
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...',
      keyConfigured: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    })
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

