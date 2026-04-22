import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { processVideoMergeTask } from '../process-video-task/route'

export async function POST(request: NextRequest) {
  try {
    const { interviewId, segments } = await request.json()

    console.log('[Merge] Creating async task for interview:', interviewId)
    console.log('[Merge] Segments count:', segments?.length)

    if (!segments || segments.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No segments provided'
      })
    }

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

    // 直接以函数调用方式启动处理，不等待它完成。
    // 不再走 HTTP 自调（之前用 requestUrl.origin + fetch 在反代下会
    // 拼出错误的 origin 触发 ERR_SSL_WRONG_VERSION_NUMBER，任务永久卡在 pending）。
    // processVideoMergeTask 内部已通过进程内队列串行化，安全。
    setImmediate(() => {
      void (async () => {
        try {
          console.log(`[Merge] Starting in-process processing for task ${task.id}`)
          await processVideoMergeTask(task.id)
          console.log(`[Merge] ✓ Processing finished for task ${task.id}`)
        } catch (error) {
          console.error(`[Merge] ❌ Processing failed for task ${task.id}:`, error)
        }
      })()
    })

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
