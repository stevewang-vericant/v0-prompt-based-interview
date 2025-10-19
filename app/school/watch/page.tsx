"use client"

import { useSearchParams } from 'next/navigation'
import { VideoPlayerWithSubtitles } from '@/components/video-player-with-subtitles'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default function SchoolWatchPage() {
  const searchParams = useSearchParams()
  const videoUrl = searchParams.get('videoUrl')
  const subtitleUrl = searchParams.get('subtitleUrl')
  const interviewId = searchParams.get('interviewId')

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
              {interviewId && (
                <p className="text-sm text-slate-600">
                  Interview ID: {interviewId.slice(0, 30)}...
                </p>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Video Player */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <VideoPlayerWithSubtitles 
          videoUrl={videoUrl} 
          subtitleUrl={subtitleUrl || undefined} 
        />

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

