import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { processVideoMergeTask } from '../process-video-task/route'

export async function POST(request: NextRequest) {
  try {
    const { interviewId, segments } = await request.json()
    
    console.log('[Merge] Creating async task for interview:', interviewId)
    console.log('[Merge] Segments count:', segments.length)
    
    if (!segments || segments.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'No segments provided' 
      })
    }
    
    // 创建任务记录
    const task = await prisma.videoProcessingTask.create({
      data: {
        interview_id: interviewId,
        status: 'pending',
        segments: segments,
        metadata: {
          createdAt: new Date().toISOString(),
          segmentCount: segments.length
        }
      }
    })
    
    console.log('[Merge] Task created:', task.id)
    
    // 异步触发处理（不等待完成）
    setTimeout(async () => {
      try {
        console.log(`[Merge] Starting async processing for task ${task.id}`)
        await processVideoMergeTask(task.id)
        console.log(`[Merge] Async processing completed for task ${task.id}`)
      } catch (error) {
        console.error(`[Merge] Async processing failed for task ${task.id}:`, error)
      }
    }, 100) 
    
    return NextResponse.json({
      success: true,
      taskId: task.id,
      interviewId,
      status: 'pending',
      message: 'Video merge task created. Processing will start shortly.'
    })
    
  } catch (error) {
    console.error('[Merge] ❌ Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
