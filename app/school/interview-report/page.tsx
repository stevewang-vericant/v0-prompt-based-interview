import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/app/actions/auth"

function formatNumber(value: unknown): string {
  if (typeof value === "number" && Number.isFinite(value)) return String(value)
  return "N/A"
}

function toTitleCase(input: string): string {
  return input
    .replace(/_/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

export default async function InterviewReportPage({
  searchParams,
}: {
  searchParams: Promise<{ interviewId?: string }>
}) {
  const { interviewId } = await searchParams

  if (!interviewId) {
    return (
      <main className="max-w-5xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Interview Scoring Detail</h1>
        <p>Missing interview ID.</p>
      </main>
    )
  }

  const userResult = await getCurrentUser()
  const isRater = userResult.success && userResult.user?.is_rater
  const isSuperAdmin = userResult.success && userResult.user?.school.is_super_admin

  const interview = await prisma.interview.findUnique({
    where: { interview_id: interviewId },
    select: {
      interview_id: true,
      total_score: true,
      fluency_score: true,
      coherence_score: true,
      vocabulary_score: true,
      grammar_score: true,
      pronunciation_score: true,
      score_approved: true,
      metadata: true,
      student: {
        select: {
          name: true,
          email: true,
        },
      },
      created_at: true,
    },
  })

  if (interview && !interview.score_approved && !isRater && !isSuperAdmin) {
    return (
      <main className="max-w-5xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Interview Scoring Detail</h1>
        <div className="rounded border border-amber-200 bg-amber-50 p-4 text-amber-700">
          Score details are not yet available. The score is pending approval.
        </div>
        <Link href="/school/dashboard" className="text-sm text-blue-600 hover:text-blue-700 underline mt-4 inline-block">
          Back to dashboard
        </Link>
      </main>
    )
  }

  const metadata = (interview?.metadata as Record<string, any> | null) || {}
  const cathoven = (metadata.cathoven as Record<string, any> | undefined) || {}
  const responseJson = cathoven.response || null
  const reportUrl = cathoven.reportUrl || null
  const breakdown = (responseJson?.breakdown as Record<string, any> | undefined) || {}
  const breakdownItems = Object.entries(breakdown)
  const vericantLite = (responseJson?.vericant_lite as Record<string, any> | undefined) || {}
  const vericantLiteItems = Object.entries(vericantLite)
  const apiLogs = await prisma.externalApiLog.findMany({
    where: {
      provider: "cathoven",
      interview_id: interviewId,
    },
    orderBy: { created_at: "desc" },
    take: 10,
  })

  return (
    <main className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Interview Scoring Detail</h1>
        <Link
          href="/school/dashboard"
          className="text-sm text-blue-600 hover:text-blue-700 underline"
        >
          Back to dashboard
        </Link>
      </div>

      {!interview ? (
        <div className="rounded border border-red-200 bg-red-50 p-4 text-red-700">
          Interview not found.
        </div>
      ) : (
        <>
          <section className="rounded border border-black/[0.08] bg-white p-4 space-y-2">
            <div className="text-sm text-[rgba(0,0,0,0.56)]">Interview ID</div>
            <div className="font-mono text-sm">{interview.interview_id}</div>
            <div className="text-sm text-[rgba(0,0,0,0.56)]">
              Student: {interview.student?.name || "Unknown"} ({interview.student?.email || "N/A"})
            </div>
            <div className="text-sm text-[rgba(0,0,0,0.56)]">
              Created: {new Date(interview.created_at).toLocaleString()}
            </div>
          </section>

          <section className="rounded border border-black/[0.08] bg-white p-4">
            <h2 className="text-lg font-semibold mb-3">BASE score</h2>
            <div className="text-3xl font-bold text-[#1d1d1f]">
              {responseJson?.vericant_lite?.overall ??
                (interview.total_score ? Number(interview.total_score).toFixed(2) : "N/A")}
            </div>
            <div className="mt-2 text-sm text-[rgba(0,0,0,0.56)]">CEFR: {responseJson?.cefr || "N/A"}</div>
          </section>

          <section className="rounded border border-black/[0.08] bg-white p-4 space-y-2">
            <h2 className="text-lg font-semibold">Cathoven Metadata</h2>
            <div className="text-sm">Status: {cathoven.status || "N/A"}</div>
            <div className="text-sm">Rubric: {cathoven.rubric || "N/A"}</div>
            <div className="text-sm">Evaluated At: {cathoven.evaluatedAt || "N/A"}</div>
            <div className="text-sm">Report Link: {reportUrl || "N/A"}</div>
            {cathoven.error && (
              <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {String(cathoven.error)}
              </div>
            )}
          </section>

          <section className="rounded border border-black/[0.08] bg-white p-4">
            <div className="flex items-center justify-between gap-3 mb-3">
              <h2 className="text-lg font-semibold">Breakdown (from JSON)</h2>
              <Link
                href={`/school/interview-report/raw?interviewId=${encodeURIComponent(interviewId)}`}
                className="text-sm text-blue-600 hover:text-blue-700 underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                View raw JSON
              </Link>
            </div>
            {breakdownItems.length > 0 ? (
              <div className="space-y-3">
                {breakdownItems.map(([key, value]) => {
                  const item = value as Record<string, any>
                  const itemBreakdown = (item?.breakdown as Record<string, any> | undefined) || {}
                  return (
                    <div key={key} className="rounded border border-black/[0.08] p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-medium">{item?.name || toTitleCase(key)}</div>
                        <div className="text-sm">
                          Band: <span className="font-semibold">{formatNumber(item?.band)}</span>
                        </div>
                      </div>
                      {Object.keys(itemBreakdown).length > 0 && (
                        <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                          {Object.entries(itemBreakdown).map(([metricKey, metricValue]) => (
                            <div key={metricKey} className="rounded bg-[#f5f5f7] p-2">
                              {toTitleCase(metricKey)}: {formatNumber(metricValue)}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-sm text-[rgba(0,0,0,0.56)]">No breakdown data in Cathoven response.</div>
            )}
          </section>

          <section className="rounded border border-black/[0.08] bg-white p-4">
            <h2 className="text-lg font-semibold mb-3">BASE metrics</h2>
            {vericantLiteItems.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                {vericantLiteItems.map(([metricKey, metricValue]) => (
                  <div key={metricKey} className="rounded bg-[#f5f5f7] p-2">
                    {toTitleCase(metricKey)}: {formatNumber(metricValue)}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-[rgba(0,0,0,0.56)]">No BASE metrics found in API response.</div>
            )}
          </section>

          <section className="rounded border border-black/[0.08] bg-white p-4">
            <h2 className="text-lg font-semibold mb-3">API Call History (Latest 10)</h2>
            {apiLogs.length === 0 ? (
              <div className="text-sm text-[rgba(0,0,0,0.56)]">No API logs yet.</div>
            ) : (
              <div className="space-y-3">
                {apiLogs.map((log) => (
                  <div key={log.id} className="rounded border border-black/[0.08] p-3 text-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-xs ${log.success ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                        {log.success ? "SUCCESS" : "FAILED"}
                      </span>
                      <span>Status: {log.status_code ?? "N/A"}</span>
                      <span>Duration: {log.duration_ms ?? "N/A"} ms</span>
                      <span>{new Date(log.created_at).toLocaleString()}</span>
                    </div>
                    {log.error_message && (
                      <div className="mt-2 text-red-700">Error: {log.error_message}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </main>
  )
}
