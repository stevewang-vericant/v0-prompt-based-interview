import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { isMissingContainerDurationError } from '@/lib/media-duration'

const RETRY_METADATA_KEY = 'missingDurationRetryAt'
let sweepInFlight = false

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return { ...(value as Record<string, unknown>) }
  }
  return {}
}

/**
 * Find video tasks that failed only because the WebM container had no duration,
 * and run them again. Each task is claimed once so a still-broken file is not
 * retried on every health check. Safe to call often; overlapping calls no-op.
 */
export function kickMissingDurationRecovery(): void {
  if (process.env.NODE_ENV !== 'production') return
  if (sweepInFlight) return
  sweepInFlight = true
  void recoverMissingDurationFailures()
    .catch((error) => {
      console.error('[DurationRecovery] Sweep failed:', error)
    })
    .finally(() => {
      sweepInFlight = false
    })
}

export async function recoverMissingDurationFailures(): Promise<number> {
  const candidates = await prisma.videoProcessingTask.findMany({
    where: {
      status: 'failed',
      error_message: { contains: 'no valid media duration' },
    },
    select: {
      id: true,
      interview_id: true,
      metadata: true,
      error_message: true,
    },
    orderBy: { created_at: 'asc' },
    take: 3,
  })

  const pending = candidates.filter((task) => {
    const metadata = asRecord(task.metadata)
    return !metadata[RETRY_METADATA_KEY] && isMissingContainerDurationError(task.error_message || '')
  })
  if (pending.length === 0) return 0

  const { processVideoMergeTask } = await import('@/app/api/process-video-task/route')
  let started = 0

  for (const task of pending) {
    const metadata = asRecord(task.metadata)
    const interview = await prisma.interview.findUnique({
      where: { interview_id: task.interview_id },
      select: { id: true, status: true, video_url: true, metadata: true },
    })
    if (!interview || interview.video_url) {
      await prisma.videoProcessingTask.updateMany({
        where: { id: task.id, status: 'failed' },
        data: {
          metadata: {
            ...metadata,
            [RETRY_METADATA_KEY]: new Date().toISOString(),
          } as Prisma.InputJsonValue,
        },
      })
      console.log(
        `[DurationRecovery] Skip ${task.id}: ${
          interview?.video_url ? 'interview already has a merged video' : 'interview record is missing'
        }`,
      )
      continue
    }

    const claimed = await prisma.videoProcessingTask.updateMany({
      where: {
        id: task.id,
        status: 'failed',
        error_message: { contains: 'no valid media duration' },
      },
      data: {
        status: 'pending',
        error_message: null,
        started_at: null,
        completed_at: null,
        metadata: {
          ...metadata,
          [RETRY_METADATA_KEY]: new Date().toISOString(),
        } as Prisma.InputJsonValue,
      },
    })
    if (claimed.count !== 1) continue

    if (interview.status === 'failed') {
      const interviewMetadata = asRecord(interview.metadata)
      delete interviewMetadata.videoProcessingError
      delete interviewMetadata.videoProcessingFailedAt
      await prisma.interview.update({
        where: { id: interview.id },
        data: {
          status: 'processing',
          metadata: {
            ...interviewMetadata,
            status: 'processing',
          } as Prisma.InputJsonValue,
        },
      })
    }

    started += 1
    console.log(`[DurationRecovery] Retrying task ${task.id} for ${task.interview_id}`)
    try {
      await processVideoMergeTask(task.id)
    } catch (error) {
      console.error(`[DurationRecovery] Retry failed for ${task.id}:`, error)
    }
  }

  return started
}
