import { NextRequest, NextResponse } from 'next/server'
import { processTranscriptionJob } from '@/app/actions/transcription'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { interviewId } = await request.json()
    
    if (!interviewId) {
      return NextResponse.json({
        success: false,
        error: 'Missing interviewId parameter'
      }, { status: 400 })
    }
    
    console.log('[Trigger] Manually triggering transcription for interview:', interviewId)
    
    // 获取interview的UUID
    const interview = await prisma.interview.findUnique({
      where: { interview_id: interviewId },
      select: { id: true }
    })
    
    if (!interview) {
      return NextResponse.json({
        success: false,
        error: 'Interview not found'
      }, { status: 404 })
    }
    
    // 手动触发转录处理，传递UUID
    // Note: processTranscriptionJob requires jobId, but here we just want to trigger logic based on interviewId?
    // Looking at previous code: processTranscriptionJob(interviewId, interview.id)
    // But processTranscriptionJob first arg is jobId. 
    // The previous implementation was confusing/wrong or I misunderstood.
    // Let's look at `app/actions/transcription.ts`: 
    // export async function processTranscriptionJob(jobId: string, interviewUUID?: string)
    
    // So we need a jobId.
    // We should probably find the pending job or create one?
    // Or we can use `startTranscription` which creates and processes.
    
    const { startTranscription } = await import('@/app/actions/transcription')
    // But startTranscription needs videoUrl.
    
    // Let's look at previous implementation of this file again.
    // It called processTranscriptionJob(interviewId, interview.id)
    // This implies interviewId was being passed as jobId? That seems wrong unless jobId == interviewId.
    // But createTranscriptionJob generates `transcription_${interviewId}_${Date.now()}`.
    
    // Let's assume we want to retry the last failed job or find the current job.
    const job = await prisma.transcriptionJob.findFirst({
        where: { interview_id: interview.id },
        orderBy: { created_at: 'desc' }
    })

    if (job) {
         const result = await processTranscriptionJob(job.job_id, interview.id)
         if (result.success) {
            return NextResponse.json({ success: true, message: 'Transcription processing triggered successfully' })
         } else {
            return NextResponse.json({ success: false, error: result.error }, { status: 500 })
         }
    } else {
        // No job exists. If we have video_url in interview, we can start a new one.
        const fullInterview = await prisma.interview.findUnique({ where: { id: interview.id } })
        if (fullInterview?.video_url) {
             const { startTranscription } = await import('@/app/actions/transcription')
             const result = await startTranscription(interviewId, fullInterview.video_url)
             if (result.success) {
                 return NextResponse.json({ success: true, message: 'New transcription job started' })
             } else {
                 return NextResponse.json({ success: false, error: result.error }, { status: 500 })
             }
        }
        return NextResponse.json({ success: false, error: 'No transcription job found and no video URL available' }, { status: 404 })
    }
    
  } catch (error) {
    console.error('[Trigger] Error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}
