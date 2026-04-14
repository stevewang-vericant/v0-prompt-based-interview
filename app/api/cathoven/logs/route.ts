import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const interviewId = searchParams.get("interviewId")
    const limitRaw = searchParams.get("limit")
    const limit = Math.min(Math.max(Number(limitRaw || 50), 1), 200)

    const logs = await prisma.externalApiLog.findMany({
      where: {
        provider: "cathoven",
        ...(interviewId ? { interview_id: interviewId } : {}),
      },
      orderBy: { created_at: "desc" },
      take: limit,
    })

    return NextResponse.json({
      success: true,
      logs,
      count: logs.length,
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
