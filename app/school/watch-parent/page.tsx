"use client"

import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import { VideoPlayerWithSubtitles } from "@/components/video-player-with-subtitles"
import { TranscriptionDisplay } from "@/components/transcription/transcription-display"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ExternalLink, UserCheck, Globe } from "lucide-react"

function WatchParentContent() {
  const searchParams = useSearchParams()
  const videoUrl = searchParams.get("videoUrl")
  const subtitleUrl = searchParams.get("subtitleUrl")
  const captionUrl = searchParams.get("captionUrl")
  const interviewId = searchParams.get("interviewId")
  const parentName = searchParams.get("parentName")
  const parentEmail = searchParams.get("parentEmail")
  const relationship = searchParams.get("relationship")
  const language = searchParams.get("language")
  const studentName = searchParams.get("studentName")
  const videoWithPrepUrl = searchParams.get("videoWithPrepUrl")

  const matchedInterviewId = searchParams.get("matchedInterviewId")
  const matchedVideoUrl = searchParams.get("matchedVideoUrl")
  const matchedSubtitleUrl = searchParams.get("matchedSubtitleUrl")
  const matchedStudentName = searchParams.get("matchedStudentName")

  const openMatchedStudentInterview = () => {
    if (!matchedVideoUrl) return
    const params = new URLSearchParams({
      videoUrl: `/api/proxy-video?url=${encodeURIComponent(matchedVideoUrl)}`,
      interviewId: matchedInterviewId || "",
      b2VideoUrl: matchedVideoUrl,
      schoolLevel: "k12", // hide score UI on the student watch page
    })
    if (matchedSubtitleUrl) {
      params.append("subtitleUrl", `/api/proxy-json?url=${encodeURIComponent(matchedSubtitleUrl)}`)
    }
    if (matchedStudentName) params.append("studentName", matchedStudentName)
    window.location.href = `/school/watch?${params.toString()}`
  }

  if (!videoUrl) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f5f5f7]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Video URL is missing.</p>
            <Button className="mt-4" onClick={() => (window.location.href = "/school/parent-interviews")}>
              Back to Parent Interviews
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <header className="bg-white border-b border-black/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => (window.location.href = "/school/parent-interviews")}
              className="w-full sm:w-auto"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Parent Interviews
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-[#1d1d1f] mb-2">Parent Interview Review</h1>
              <div className="space-y-1">
                {parentName && (
                  <p className="text-xs sm:text-sm text-[#1d1d1f] truncate">
                    <span className="font-medium">Parent:</span> {parentName}
                    {relationship ? ` (${relationship})` : ""}
                  </p>
                )}
                {parentEmail && (
                  <p className="text-xs sm:text-sm text-[rgba(0,0,0,0.56)] truncate">
                    <span className="font-medium">Email:</span> {parentEmail}
                  </p>
                )}
                {studentName && (
                  <p className="text-xs sm:text-sm text-[rgba(0,0,0,0.56)] truncate">
                    <span className="font-medium">Student:</span> {studentName}
                  </p>
                )}
                {language && (
                  <p className="text-xs sm:text-sm text-[rgba(0,0,0,0.56)] inline-flex items-center gap-1">
                    <Globe className="h-3.5 w-3.5" />
                    Response language: {language}
                  </p>
                )}
                {interviewId && (
                  <p className="text-xs text-[rgba(0,0,0,0.48)] font-mono truncate">Interview ID: {interviewId}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <VideoPlayerWithSubtitles
              videoUrl={videoUrl}
              subtitleUrl={subtitleUrl || undefined}
              captionUrl={captionUrl || undefined}
            />

            {/* Matched student interview */}
            {matchedInterviewId && matchedVideoUrl && (
              <Card className="border-emerald-200 bg-emerald-50">
                <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="text-sm flex items-start gap-2">
                    <UserCheck className="h-5 w-5 text-emerald-700 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-emerald-900">Matching student interview found</p>
                      <p className="text-xs text-emerald-900/80 mt-0.5">
                        {matchedStudentName ? `${matchedStudentName}'s ` : "The student's "}
                        interview video matches this parent's provided student information.
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={openMatchedStudentInterview}
                    className="inline-flex items-center justify-center rounded-md border border-emerald-300 bg-white px-3 py-2 text-sm font-medium text-emerald-900 shadow-sm hover:bg-emerald-100"
                  >
                    Open student interview
                    <ExternalLink className="ml-2 h-3.5 w-3.5" />
                  </Button>
                </CardContent>
              </Card>
            )}

            {videoWithPrepUrl && (
              <Card className="border-amber-200 bg-amber-50">
                <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="text-sm">
                    <p className="font-medium text-amber-900">Includes preparation time</p>
                    <p className="text-xs text-amber-900/80 mt-0.5">
                      Watch a separate video that shows each question's preparation segment in addition to the response.
                    </p>
                  </div>
                  <a
                    href={videoWithPrepUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center rounded-md border border-amber-300 bg-white px-3 py-2 text-sm font-medium text-amber-900 shadow-sm hover:bg-amber-100"
                  >
                    Open prep + response video
                    <ExternalLink className="ml-2 h-3.5 w-3.5" />
                  </a>
                </CardContent>
              </Card>
            )}
          </div>

          {/* English transcript panel */}
          <div className="lg:col-span-1">
            {interviewId && <TranscriptionDisplay interviewId={interviewId} className="sticky top-8" />}
          </div>
        </div>
      </main>
    </div>
  )
}

export default function WatchParentPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-[#f5f5f7]">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#0071e3] border-t-transparent"></div>
        </div>
      }
    >
      <WatchParentContent />
    </Suspense>
  )
}
