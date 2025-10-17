"use client"

import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import { Button } from "@/components/ui/button"
import { VideoPlayerWithSubtitles } from "@/components/video-player-with-subtitles"
import { ArrowLeft } from "lucide-react"

function WatchPageContent() {
  const searchParams = useSearchParams()
  const videoUrl = searchParams.get("videoUrl")
  const subtitleUrl = searchParams.get("subtitleUrl")

  if (!videoUrl) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-red-600">Error: No video URL provided</p>
          <Button onClick={() => window.location.href = "/student/dashboard"}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.href = "/student/dashboard"}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                Interview Playback
              </h1>
              <p className="text-sm text-slate-600">Watch your interview with subtitles</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <VideoPlayerWithSubtitles 
          videoUrl={videoUrl}
          subtitleUrl={subtitleUrl || undefined}
          autoPlay={false}
        />

        {/* Information */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900">
            <strong>Note:</strong> Subtitles show the questions you answered during the interview. 
            They automatically appear at the appropriate times based on your response timings.
          </p>
        </div>
      </main>
    </div>
  )
}

export default function WatchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto"></div>
          <p className="mt-2 text-sm text-slate-600">Loading video player...</p>
        </div>
      </div>
    }>
      <WatchPageContent />
    </Suspense>
  )
}

