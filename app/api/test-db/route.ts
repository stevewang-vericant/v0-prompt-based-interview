import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
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
