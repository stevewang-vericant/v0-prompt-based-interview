import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { evaluateInterviewWithCathoven } from "@/lib/cathoven"
import { notifyRatersAfterScoring } from "@/lib/rater-notifications"
import { requireUserApi } from "@/lib/auth-guards"

function extractQuestionsFromMetadata(metadata: Record<string, any> | null): string[] {
  if (!metadata) return []

  const fromSubtitle = metadata?.subtitleMetadata?.questions
  if (Array.isArray(fromSubtitle)) {
    const questions = fromSubtitle
      .map((item) => (typeof item?.text === "string" ? item.text.trim() : ""))
      .filter((q) => q.length > 0)
    if (questions.length > 0) return questions
  }

  const fromCathoven = metadata?.cathoven?.request?.data?.[0]?.questions
  if (Array.isArray(fromCathoven)) {
    const questions = fromCathoven
      .map((item: unknown) => (typeof item === "string" ? item.trim() : ""))
      .filter((q: string) => q.length > 0)
    if (questions.length > 0) return questions
  }

  return []
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireUserApi()
    if (!auth.ok) return auth.response

    const body = await request.json()
    const interviewId = body?.interviewId as string | undefined

    if (!interviewId) {
      return NextResponse.json(
        { success: false, error: "interviewId is required" },
        { status: 400 }
      )
    }

    const interview = await prisma.interview.findUnique({
      where: { interview_id: interviewId },
      include: {
        school: { select: { level: true } },
        responses: {
          orderBy: { sequence_number: "asc" },
          include: { prompt: { select: { prompt_text: true } } },
        },
      },
    })

    if (!interview) {
      return NextResponse.json(
        { success: false, error: "Interview not found" },
        { status: 404 }
      )
    }

    // Rating gate: K-12 schools never get AI scoring, so block manual retries too.
    if (interview.school?.level !== "undergraduate") {
      return NextResponse.json(
        {
          success: false,
          error: "Scoring is not available for K-12 schools",
        },
        { status: 400 }
      )
    }

    if (!interview.video_url) {
      return NextResponse.json(
        { success: false, error: "Interview video is not ready yet" },
        { status: 400 }
      )
    }

    const existingMetadata =
      interview.metadata && typeof interview.metadata === "object"
        ? (interview.metadata as Record<string, any>)
        : null

    let questions = extractQuestionsFromMetadata(existingMetadata)
    if (questions.length === 0) {
      questions = interview.responses
        .map((response) => response.prompt?.prompt_text?.trim() || "")
        .filter((q) => q.length > 0)
    }

    if (questions.length === 0) {
      return NextResponse.json(
        { success: false, error: "No questions found for this interview" },
        { status: 400 }
      )
    }

    const videoResponse = await fetch(interview.video_url)
    if (!videoResponse.ok) {
      return NextResponse.json(
        {
          success: false,
          error: `Failed to fetch merged video: HTTP ${videoResponse.status}`,
        },
        { status: 500 }
      )
    }

    const videoBuffer = Buffer.from(await videoResponse.arrayBuffer())
    const cathovenResult = await evaluateInterviewWithCathoven({
      interviewId,
      questions,
      mergedVideoBuffer: videoBuffer,
    })

    const reportUrl = `/school/interview-report?interviewId=${encodeURIComponent(interviewId)}`
    const nextMetadata = {
      ...(existingMetadata || {}),
      cathoven: {
        status: cathovenResult.success ? "completed" : "failed",
        evaluatedAt: new Date().toISOString(),
        reportUrl,
        rubric: "vericant_lite",
        response: cathovenResult.response || null,
        error: cathovenResult.error || null,
        manuallyRetried: true,
      },
    }

    await prisma.interview.update({
      where: { id: interview.id },
      data: {
        metadata: nextMetadata,
        total_score:
          cathovenResult.success && cathovenResult.finalScore !== null
            ? cathovenResult.finalScore
            : undefined,
        status:
          cathovenResult.success && cathovenResult.finalScore !== null
            ? "scored"
            : undefined,
      },
    })

    if (cathovenResult.success && cathovenResult.finalScore !== null) {
      await notifyRatersAfterScoring({
        interviewDbId: interview.id,
        interviewId,
        finalScore: cathovenResult.finalScore,
        logPrefix: `[CathovenRetry ${interviewId}]`,
      })
    }

    return NextResponse.json({
      success: cathovenResult.success,
      interviewId,
      finalScore: cathovenResult.finalScore,
      error: cathovenResult.error,
      reportUrl,
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
