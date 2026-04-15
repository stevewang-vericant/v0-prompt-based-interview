import Link from "next/link"
import { prisma } from "@/lib/prisma"

export default async function InterviewReportRawPage({
  searchParams,
}: {
  searchParams: Promise<{ interviewId?: string }>
}) {
  const { interviewId } = await searchParams

  if (!interviewId) {
    return (
      <main className="max-w-5xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Cathoven Raw JSON</h1>
        <p>Missing interview ID.</p>
      </main>
    )
  }

  const interview = await prisma.interview.findUnique({
    where: { interview_id: interviewId },
    select: { metadata: true },
  })

  const metadata = (interview?.metadata as Record<string, any> | null) || {}
  const responseJson = metadata?.cathoven?.response || null

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Cathoven Raw JSON</h1>
        <Link
          href={`/school/interview-report?interviewId=${encodeURIComponent(interviewId)}`}
          className="text-sm text-blue-600 hover:text-blue-700 underline"
        >
          Back to score detail
        </Link>
      </div>

      {!responseJson ? (
        <div className="rounded border border-red-200 bg-red-50 p-4 text-red-700">
          No Cathoven response found for this interview.
        </div>
      ) : (
        <pre className="rounded border border-black/[0.08] bg-[#f5f5f7] p-4 text-xs overflow-x-auto whitespace-pre-wrap break-all">
          {JSON.stringify(responseJson, null, 2)}
        </pre>
      )}
    </main>
  )
}
