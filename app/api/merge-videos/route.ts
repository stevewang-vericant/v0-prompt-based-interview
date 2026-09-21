import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { processVideoMergeTask } from '../process-video-task/route'
import { authorizeMergeVideosApi } from '@/lib/auth-guards'
import { Prisma } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { interviewId, segments } = body

    const auth = await authorizeMergeVideosApi(request, interviewId, segments)
    if (!auth.ok) return auth.response

    // Build the merge manifest from persisted responses as well as this
    // request. A resumed upload only sends pending segments, while earlier
    // successful segments already live in the database.
    const interview = await prisma.interview.findUnique({
      where: { interview_id: interviewId },
      select: {
        responses: {
          orderBy: [{ sequence_number: 'asc' }, { created_at: 'asc' }],
          select: {
            sequence_number: true,
            video_url: true,
            video_duration: true,
            prep_duration: true,
            prompt_id: true,
            prompt: {
              select: { prompt_text: true, category: true },
            },
          },
        },
      },
    })
    if (!interview) {
      return NextResponse.json(
        { success: false, error: 'Interview not found' },
        { status: 404 }
      )
    }

    const manifestByOrder = new Map<number, Record<string, unknown>>()
    for (const response of interview.responses) {
      manifestByOrder.set(response.sequence_number, {
        url: response.video_url,
        sequenceNumber: response.sequence_number,
        duration: response.video_duration || 90,
        prepDuration: response.prep_duration || 0,
        promptId: response.prompt_id,
        questionText: response.prompt.prompt_text,
        category: response.prompt.category,
      })
    }
    for (const segment of segments) {
      manifestByOrder.set(segment.sequenceNumber, segment)
    }
    const completeSegments = Array.from(manifestByOrder.values()).sort(
      (a, b) => Number(a.sequenceNumber) - Number(b.sequenceNumber)
    )

    console.log('[Merge] Creating async task for interview:', interviewId)
    console.log('[Merge] Segments count:', completeSegments.length)

    const task = await prisma.videoProcessingTask.create({
      data: {
        interview_id: interviewId,
        status: 'pending',
        segments: completeSegments as unknown as Prisma.InputJsonValue,
        metadata: {
          createdAt: new Date().toISOString(),
          segmentCount: completeSegments.length
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
