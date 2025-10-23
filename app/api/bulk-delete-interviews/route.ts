import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
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

    const supabase = await createClient()
    
    // Get interview details before deletion for logging
    const { data: interviewsToDelete, error: fetchError } = await supabase
      .from('interviews')
      .select('id, interview_id, student_email, student_name, video_url')
      .in('id', interviewIds)
    
    if (fetchError) {
      console.error('[Bulk Delete] Error fetching interviews:', fetchError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch interview details' },
        { status: 500 }
      )
    }

    // Delete the interviews
    const { error: deleteError } = await supabase
      .from('interviews')
      .delete()
      .in('id', interviewIds)
    
    if (deleteError) {
      console.error('[Bulk Delete] Error deleting interviews:', deleteError)
      return NextResponse.json(
        { success: false, error: 'Failed to delete interviews' },
        { status: 500 }
      )
    }

    // Log the deletion for audit purposes
    console.log(`[Bulk Delete] Super admin ${userResult.user.email} deleted ${interviewIds.length} interviews:`, {
      deletedInterviews: interviewsToDelete?.map(i => ({
        id: i.id,
        interview_id: i.interview_id,
        student_email: i.student_email,
        student_name: i.student_name
      })),
      timestamp: new Date().toISOString()
    })

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${interviewIds.length} interview(s)`,
      deletedCount: interviewIds.length,
      deletedInterviews: interviewsToDelete?.map(i => ({
        id: i.id,
        student_email: i.student_email,
        student_name: i.student_name
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
