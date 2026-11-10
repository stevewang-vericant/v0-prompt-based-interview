import { NextResponse } from "next/server"
import { kickMissingDurationRecovery } from "@/lib/recover-missing-duration-tasks"

export const dynamic = "force-dynamic"

export async function GET() {
  // Production health checks pick up interviews that failed only because a
  // WebM container had no duration, and rerun the merge once.
  kickMissingDurationRecovery()
  return NextResponse.json({
    success: true,
    status: "ok",
    timestamp: new Date().toISOString(),
  })
}
