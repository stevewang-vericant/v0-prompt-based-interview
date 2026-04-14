import Link from "next/link"
import type { ReactNode } from "react"
import { prisma } from "@/lib/prisma"

function renderJsonNode(value: unknown, depth = 0): ReactNode {
  if (value === null || value === undefined) {
    return <span className="text-[rgba(0,0,0,0.48)]">null</span>
  }

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return <span>{String(value)}</span>
  }

  if (Array.isArray(value)) {
    return (
      <div className="space-y-2">
        {value.map((item, index) => (
          <div key={`array-${depth}-${index}`} className="pl-4 border-l border-black/[0.08]">
            <div className="text-xs text-[rgba(0,0,0,0.48)] mb-1">[{index}]</div>
            {renderJsonNode(item, depth + 1)}
          </div>
        ))}
      </div>
    )
  }

  if (typeof value === "object") {
    return (
      <div className="space-y-2">
        {Object.entries(value as Record<string, unknown>).map(([key, child]) => (
          <div key={`${depth}-${key}`} className="pl-4 border-l border-black/[0.08]">
            <div className="text-xs font-medium text-[#1d1d1f] mb-1">{key}</div>
            {renderJsonNode(child, depth + 1)}
          </div>
        ))}
      </div>
    )
  }

  return <span>{String(value)}</span>
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

  const metadata = (interview?.metadata as Record<string, any> | null) || {}
  const cathoven = (metadata.cathoven as Record<string, any> | undefined) || {}
  const responseJson = cathoven.response || null
  const reportUrl = cathoven.reportUrl || null
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
            <h2 className="text-lg font-semibold mb-3">Final Score</h2>
            <div className="text-3xl font-bold text-[#1d1d1f]">
              {interview.total_score ? Number(interview.total_score).toFixed(2) : "N/A"}
            </div>
            <div className="mt-3 grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
              <div className="rounded bg-[#f5f5f7] p-2">Fluency: {interview.fluency_score ? Number(interview.fluency_score).toFixed(2) : "N/A"}</div>
              <div className="rounded bg-[#f5f5f7] p-2">Coherence: {interview.coherence_score ? Number(interview.coherence_score).toFixed(2) : "N/A"}</div>
              <div className="rounded bg-[#f5f5f7] p-2">Vocabulary: {interview.vocabulary_score ? Number(interview.vocabulary_score).toFixed(2) : "N/A"}</div>
              <div className="rounded bg-[#f5f5f7] p-2">Grammar: {interview.grammar_score ? Number(interview.grammar_score).toFixed(2) : "N/A"}</div>
              <div className="rounded bg-[#f5f5f7] p-2">Pronunciation: {interview.pronunciation_score ? Number(interview.pronunciation_score).toFixed(2) : "N/A"}</div>
            </div>
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
            <h2 className="text-lg font-semibold mb-3">Full Cathoven JSON</h2>
            {responseJson ? (
              <div className="text-sm">{renderJsonNode(responseJson)}</div>
            ) : (
              <div className="text-sm text-[rgba(0,0,0,0.56)]">No Cathoven response saved yet.</div>
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
