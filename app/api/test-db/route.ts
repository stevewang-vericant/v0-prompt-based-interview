import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSuperAdminApi } from '@/lib/auth-guards'

export async function GET() {
  try {
    const auth = await requireSuperAdminApi()
    if (!auth.ok) return auth.response

    // 测试数据库连接
    const count = await prisma.interview.count()
    
    return NextResponse.json({
      status: 'success',
      message: 'Database connection successful (Prisma)',
      interviewCount: count,
      databaseUrlConfigured: !!process.env.DATABASE_URL
    })
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      databaseUrlConfigured: !!process.env.DATABASE_URL
    }, { status: 500 })
  }
}
