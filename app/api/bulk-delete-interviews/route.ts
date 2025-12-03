import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/app/actions/auth'

export async function POST(request: NextRequest) {
  try {
    // Get current user to check permissions
    const userResult = await getCurrentUser()
    
    if (!userResult.success || !userResult.user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Check if user is super admin
    if (!userResult.user.school.is_super_admin) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions. Super admin access required.' },
        { status: 403 }
      )
    }

    // Parse request body
    const { interviewIds } = await request.json()
    
    if (!interviewIds || !Array.isArray(interviewIds) || interviewIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No interview IDs provided' },
        { status: 400 }
      )
    }

    // Validate that all IDs are valid UUIDs
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    const invalidIds = interviewIds.filter(id => !uuidRegex.test(id))
    
    if (invalidIds.length > 0) {
      return NextResponse.json(
        { success: false, error: `Invalid interview IDs: ${invalidIds.join(', ')}` },
        { status: 400 }
      )
    }

    // Get interview details before deletion for logging
    const interviewsToDelete = await prisma.interview.findMany({
      where: { id: { in: interviewIds } },
      select: { id: true, interview_id: true, student: { select: { email: true, name: true } }, video_url: true }
    })

    // Delete the interviews
    console.log('[Bulk Delete] Attempting to delete interviews with IDs:', interviewIds)
    
    const deleteResult = await prisma.interview.deleteMany({
      where: { id: { in: interviewIds } }
    })
    
    console.log('[Bulk Delete] Successfully deleted interviews count:', deleteResult.count)

    // Log the deletion
    console.log(`[Bulk Delete] Super admin ${userResult.user.email} deleted ${deleteResult.count} interviews:`, {
      deletedInterviews: interviewsToDelete.map((i: { id: string; interview_id: string | null; student: { email: string; name: string } | null }) => ({
        id: i.id,
        interview_id: i.interview_id,
        student_email: i.student?.email,
        student_name: i.student?.name
      })),
      timestamp: new Date().toISOString()
    })

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${deleteResult.count} interview(s)`,
      deletedCount: deleteResult.count,
      deletedInterviews: interviewsToDelete.map((i: { id: string; interview_id: string | null; student: { email: string; name: string } | null }) => ({
        id: i.id,
        student_email: i.student?.email,
        student_name: i.student?.name
      }))
    })

  } catch (error) {
    console.error('[Bulk Delete] Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
