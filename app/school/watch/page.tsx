"use client"

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { VideoPlayerWithSubtitles } from '@/components/video-player-with-subtitles'
import { MultiSegmentVideoPlayer } from '@/components/multi-segment-video-player'
import { TranscriptionDisplay } from '@/components/transcription/transcription-display'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

function SchoolWatchPageContent() {
  const searchParams = useSearchParams()
  const videoUrl = searchParams.get('videoUrl')
  const subtitleUrl = searchParams.get('subtitleUrl')
  const interviewId = searchParams.get('interviewId')
  const studentEmail = searchParams.get('studentEmail')
  const studentName = searchParams.get('studentName')

  if (!videoUrl) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Video URL is missing.</p>
            <Button 
              className="mt-4"
              onClick={() => window.location.href = '/school/dashboard'}
            >
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.location.href = '/school/dashboard'}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Interview Review</h1>
              <div className="space-y-1 mt-1">
                {studentName && (
                  <p className="text-sm text-slate-700">
                    <span className="font-medium">Student:</span> {studentName}
                  </p>
                )}
                {studentEmail && (
                  <p className="text-sm text-slate-600">
                    <span className="font-medium">Email:</span> {studentEmail}
                  </p>
                )}
                {interviewId && (
                  <p className="text-xs text-slate-500 font-mono">
                    Interview ID: {interviewId}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

          {/* Video Player */}
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Video Player - 2/3 width */}
              <div className="lg:col-span-2">
                {subtitleUrl ? (
                  <MultiSegmentVideoPlayer 
                    subtitleUrl={subtitleUrl}
                    autoPlay={false}
                  />
                ) : (
                  <VideoPlayerWithSubtitles 
                    videoUrl={videoUrl} 
                  />
                )}
              </div>

              {/* Transcription Panel - 1/3 width */}
              <div className="lg:col-span-1">
                {interviewId && (
                  <TranscriptionDisplay 
                    interviewId={interviewId}
                    className="sticky top-8"
                  />
                )}
              </div>
            </div>

        {/* Additional Interview Info (Future Enhancement) */}
        {/* <Card className="mt-6">
          <CardHeader>
            <CardTitle>Interview Details</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Future: Display student info, scores, notes, etc.</p>
          </CardContent>
        </Card> */}
      </main>
    </div>
  )
}

export default function SchoolWatchPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto"></div>
          <p className="mt-2 text-sm text-slate-600">Loading video player...</p>
        </div>
      </div>
    }>
      <SchoolWatchPageContent />
    </Suspense>
  )
}

