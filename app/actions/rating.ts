"use server"

import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "./auth"

export interface RatingInterviewRecord {
  id: string
  interview_id: string | null
  student_name: string | null
  student_email: string | null
  school_code: string | null
  school_name: string | null
  video_url: string | null
  created_at: string
  total_score: number | null
  score_approved: boolean
  score_approved_at: string | null
  rater_total_score: number | null
}

export interface RatingDetailRecord {
  id: string
  interview_id: string | null
  student_name: string | null
  student_email: string | null
  school_code: string | null
  school_name: string | null
  video_url: string | null
  video_with_prep_url: string | null
  subtitle_url: string | null
  created_at: string
  total_duration: number | null
  metadata: Record<string, any> | null
  // Cathoven scores
  total_score: number | null
  fluency_score: number | null
  coherence_score: number | null
  vocabulary_score: number | null
  grammar_score: number | null
  pronunciation_score: number | null
  // Approval
  score_approved: boolean
  score_approved_at: string | null
  score_approved_by: string | null
  // Rater overrides
  rater_total_score: number | null
  rater_fluency_score: number | null
  rater_coherence_score: number | null
  rater_vocabulary_score: number | null
  rater_grammar_score: number | null
  rater_pronunciation_score: number | null
}

async function ensureRater() {
  const { user, success } = await getCurrentUser()

  if (!success || !user) {
    throw new Error("Not authenticated")
  }

  if (!user.is_rater && !user.school.is_super_admin) {
    throw new Error("Not authorized: rater role required")
  }

  return user
}

/**
 * Get all interviews for rating list (rater-only)
 */
export async function getRatingInterviews(
  limit: number = 200,
  offset: number = 0
): Promise<{
  success: boolean
  interviews?: RatingInterviewRecord[]
  count?: number
  error?: string
}> {
  try {
    await ensureRater()

    const [interviews, count] = await prisma.$transaction([
      prisma.interview.findMany({
        orderBy: { created_at: "desc" },
        skip: offset,
        take: limit,
        where: {
          video_url: { not: null },
        },
        select: {
          id: true,
          interview_id: true,
          video_url: true,
          created_at: true,
          total_score: true,
          metadata: true,
          score_approved: true,
          score_approved_at: true,
          rater_total_score: true,
          student: { select: { name: true, email: true } },
          school: { select: { code: true, name: true } },
        },
      }),
      prisma.interview.count({ where: { video_url: { not: null } } }),
    ])

    return {
      success: true,
      interviews: interviews.map((i) => {
        // Derive total score: DB field first, then from metadata.cathoven.response.vericant_lite.overall
        const meta = (i.metadata as Record<string, any> | null) || {}
        const vericantLiteOverall = meta?.cathoven?.response?.vericant_lite?.overall
        const derivedScore =
          i.total_score != null
            ? Number(i.total_score)
            : typeof vericantLiteOverall === "number"
            ? vericantLiteOverall
            : null

        return {
          id: i.id,
          interview_id: i.interview_id,
          student_name: i.student?.name || null,
          student_email: i.student?.email || null,
          school_code: i.school?.code || null,
          school_name: i.school?.name || null,
          video_url: i.video_url,
          created_at: i.created_at.toISOString(),
          total_score: derivedScore,
          score_approved: i.score_approved,
          score_approved_at: i.score_approved_at?.toISOString() || null,
          rater_total_score: i.rater_total_score ? Number(i.rater_total_score) : null,
        }
      }),
      count,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Get full interview detail for rating
 */
export async function getInterviewForRating(interviewId: string): Promise<{
  success: boolean
  interview?: RatingDetailRecord
  error?: string
}> {
  try {
    await ensureRater()

    const interview = await prisma.interview.findUnique({
      where: { interview_id: interviewId },
      select: {
        id: true,
        interview_id: true,
        video_url: true,
        video_with_prep_url: true,
        subtitle_url: true,
        created_at: true,
        total_duration: true,
        metadata: true,
        total_score: true,
        fluency_score: true,
        coherence_score: true,
        vocabulary_score: true,
        grammar_score: true,
        pronunciation_score: true,
        score_approved: true,
        score_approved_at: true,
        score_approved_by: true,
        rater_total_score: true,
        rater_fluency_score: true,
        rater_coherence_score: true,
        rater_vocabulary_score: true,
        rater_grammar_score: true,
        rater_pronunciation_score: true,
        student: { select: { name: true, email: true } },
        school: { select: { code: true, name: true } },
      },
    })

    if (!interview) {
      return { success: false, error: "Interview not found" }
    }

    return {
      success: true,
      interview: {
        id: interview.id,
        interview_id: interview.interview_id,
        student_name: interview.student?.name || null,
        student_email: interview.student?.email || null,
        school_code: interview.school?.code || null,
        school_name: interview.school?.name || null,
        video_url: interview.video_url,
        video_with_prep_url: interview.video_with_prep_url,
        subtitle_url: interview.subtitle_url,
        created_at: interview.created_at.toISOString(),
        total_duration: interview.total_duration,
        metadata: (interview.metadata as Record<string, any>) || null,
        total_score: interview.total_score ? Number(interview.total_score) : null,
        fluency_score: interview.fluency_score ? Number(interview.fluency_score) : null,
        coherence_score: interview.coherence_score ? Number(interview.coherence_score) : null,
        vocabulary_score: interview.vocabulary_score ? Number(interview.vocabulary_score) : null,
        grammar_score: interview.grammar_score ? Number(interview.grammar_score) : null,
        pronunciation_score: interview.pronunciation_score ? Number(interview.pronunciation_score) : null,
        score_approved: interview.score_approved,
        score_approved_at: interview.score_approved_at?.toISOString() || null,
        score_approved_by: interview.score_approved_by,
        rater_total_score: interview.rater_total_score ? Number(interview.rater_total_score) : null,
        rater_fluency_score: interview.rater_fluency_score ? Number(interview.rater_fluency_score) : null,
        rater_coherence_score: interview.rater_coherence_score ? Number(interview.rater_coherence_score) : null,
        rater_vocabulary_score: interview.rater_vocabulary_score ? Number(interview.rater_vocabulary_score) : null,
        rater_grammar_score: interview.rater_grammar_score ? Number(interview.rater_grammar_score) : null,
        rater_pronunciation_score: interview.rater_pronunciation_score ? Number(interview.rater_pronunciation_score) : null,
      },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Approve Cathoven score as-is
 */
export async function approveScore(interviewId: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const user = await ensureRater()

    const interview = await prisma.interview.findUnique({
      where: { interview_id: interviewId },
      select: { id: true },
    })

    if (!interview) {
      return { success: false, error: "Interview not found" }
    }

    await prisma.interview.update({
      where: { interview_id: interviewId },
      data: {
        score_approved: true,
        score_approved_at: new Date(),
        score_approved_by: user.email,
      },
    })

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

export interface OverrideScores {
  total_score: number
  fluency_score: number | null
  coherence_score: number | null
  vocabulary_score: number | null
  grammar_score: number | null
  pronunciation_score: number | null
  vericant_lite_scores?: Record<string, number>
}

/**
 * Approve with manual override scores
 */
export async function approveWithOverride(
  interviewId: string,
  scores: OverrideScores
): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const user = await ensureRater()

    const interview = await prisma.interview.findUnique({
      where: { interview_id: interviewId },
      select: { id: true, metadata: true },
    })

    if (!interview) {
      return { success: false, error: "Interview not found" }
    }

    const existingMetadata = (interview.metadata as Record<string, any> | null) || {}
    const existingCathoven = (existingMetadata.cathoven as Record<string, any> | undefined) || {}
    const mergedMetadata = {
      ...existingMetadata,
      cathoven: {
        ...existingCathoven,
        manual_override: {
          vericant_lite_scores: scores.vericant_lite_scores || {},
          updated_at: new Date().toISOString(),
          updated_by: user.email,
        },
      },
    }

    await prisma.interview.update({
      where: { interview_id: interviewId },
      data: {
        score_approved: true,
        score_approved_at: new Date(),
        score_approved_by: user.email,
        rater_total_score: scores.total_score,
        rater_fluency_score: scores.fluency_score,
        rater_coherence_score: scores.coherence_score,
        rater_vocabulary_score: scores.vocabulary_score,
        rater_grammar_score: scores.grammar_score,
        rater_pronunciation_score: scores.pronunciation_score,
        metadata: mergedMetadata,
      },
    })

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Revoke a previously approved score
 */
export async function revokeApproval(interviewId: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    await ensureRater()

    const interview = await prisma.interview.findUnique({
      where: { interview_id: interviewId },
      select: { id: true },
    })

    if (!interview) {
      return { success: false, error: "Interview not found" }
    }

    await prisma.interview.update({
      where: { interview_id: interviewId },
      data: {
        score_approved: false,
        score_approved_at: null,
        score_approved_by: null,
        rater_total_score: null,
        rater_fluency_score: null,
        rater_coherence_score: null,
        rater_vocabulary_score: null,
        rater_grammar_score: null,
        rater_pronunciation_score: null,
      },
    })

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}
