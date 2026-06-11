"use client"

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { VideoPlayerWithSubtitles } from '@/components/video-player-with-subtitles'
import { TranscriptionDisplay } from '@/components/transcription/transcription-display'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, FileText, ExternalLink } from 'lucide-react'

function SchoolWatchPageContent() {
  const searchParams = useSearchParams()
  const videoUrl = searchParams.get('videoUrl')
  const subtitleUrl = searchParams.get('subtitleUrl')
  const b2VideoUrl = searchParams.get('b2VideoUrl')
  const interviewId = searchParams.get('interviewId')
  const studentEmail = searchParams.get('studentEmail')
  const studentName = searchParams.get('studentName')
  const studentGender = searchParams.get('studentGender')
  const studentGrade = searchParams.get('studentGrade')
  const studentCity = searchParams.get('studentCity')
  const studentFinancialAid = searchParams.get('studentFinancialAid')
  const studentUsesCbo = searchParams.get('studentUsesCbo')
  const studentCboOrganization = searchParams.get('studentCboOrganization')
  const finalScoreParam = searchParams.get('finalScore')
  const scoreDetailReady = searchParams.get('scoreDetailReady') === 'true'
  const schoolLevel = searchParams.get('schoolLevel')
  // K-12 interviews are not rated: hide score badge and detail report.
  const isK12 = schoolLevel === 'k12'
  const debugMode = searchParams.get('debug') === 'true'
  // 仅当本次面试用了"prep+response 连续录制"流程时存在；
  // 老面试不会带这个参数，下面的链接面板就不会渲染。
  const videoWithPrepUrl = searchParams.get('videoWithPrepUrl')
  const finalScore = finalScoreParam && !Number.isNaN(Number(finalScoreParam)) ? Number(finalScoreParam) : null

  if (!videoUrl) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f5f5f7]">
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
    <div className="min-h-screen bg-[#f5f5f7]">
      {/* Header */}
      <header className="bg-white border-b border-black/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.location.href = '/school/dashboard'}
              className="w-full sm:w-auto"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-[#1d1d1f] mb-2">Interview Review</h1>
              <div className="space-y-2">
                {/* Student basic info */}
              <div className="space-y-1">
                {studentName && (
                  <p className="text-xs sm:text-sm text-[#1d1d1f] truncate">
                    <span className="font-medium">Student:</span> {studentName}
                  </p>
                )}
                {studentEmail && (
                  <p className="text-xs sm:text-sm text-[rgba(0,0,0,0.56)] truncate">
                    <span className="font-medium">Email:</span> {studentEmail}
                  </p>
                )}
                </div>
                
                {/* Additional student info */}
                {(studentGender || studentGrade || studentCity || studentFinancialAid || studentUsesCbo || studentCboOrganization) && (
                  <div className="flex flex-wrap items-center gap-2">
                    {studentGender && (
                      <span className="px-2 py-0.5 text-xs rounded bg-[#f5f5f7] text-[#1d1d1f]">
                        {studentGender}
                      </span>
                    )}
                    {studentGrade && (
                      <span className="px-2 py-0.5 text-xs rounded bg-[#f5f5f7] text-[#1d1d1f]">
                        {studentGrade}
                      </span>
                    )}
                    {studentCity && (
                      <span className="px-2 py-0.5 text-xs rounded bg-[#f5f5f7] text-[#1d1d1f]">
                        📍 {studentCity}
                      </span>
                    )}
                    {studentFinancialAid === 'true' && (
                      <span className="px-2 py-0.5 text-xs rounded bg-purple-100 text-purple-700">
                        💰 Financial Aid
                      </span>
                    )}
                    {(studentCboOrganization || studentUsesCbo) && (
                      <span className="px-2 py-0.5 text-xs rounded bg-teal-100 text-teal-700">
                        CBO: {studentCboOrganization || (studentUsesCbo === 'false' ? 'No' : 'Yes')}
                      </span>
                    )}
                  </div>
                )}
                
                {interviewId && (
                  <p className="text-xs text-[rgba(0,0,0,0.48)] font-mono truncate">
                    Interview ID: {interviewId}
                  </p>
                )}
                {b2VideoUrl && (
                  <div className="space-y-2 pt-1">
                    <p className="text-xs text-[rgba(0,0,0,0.56)]">Merged Video (B2)</p>
                    <a
                      href={b2VideoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block rounded bg-[#f5f5f7] px-2 py-1 font-mono text-xs break-all text-[#1d1d1f] underline hover:text-[#0071e3]"
                    >
                      {b2VideoUrl}
                    </a>
                  </div>
                )}
                {!isK12 && (
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="px-2 py-0.5 text-xs rounded bg-emerald-100 text-emerald-800">
                      BASE score: {finalScore !== null ? finalScore.toFixed(2) : 'N/A'}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      disabled={!interviewId || !scoreDetailReady}
                      title={!scoreDetailReady ? 'Score detail not ready yet' : 'Open score detail report'}
                      onClick={() => {
                        if (!interviewId || !scoreDetailReady) return
                        window.open(`/school/interview-report?interviewId=${encodeURIComponent(interviewId)}`, '_blank', 'noopener,noreferrer')
                      }}
                    >
                      <FileText className="h-3 w-3 mr-1" />
                      Detail Report
                    </Button>
                  </div>
                )}
              </div>
              {debugMode && (
                <p className="text-xs text-amber-600 font-mono mt-2">
                  Debug mode active – use this to capture playback details.
                </p>
              )}
            </div>
          </div>
        </div>
      </header>

          {/* Video Player */}
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Video Player - 2/3 width */}
              <div className="lg:col-span-2 space-y-4">
                <VideoPlayerWithSubtitles 
                  videoUrl={videoUrl} 
                  subtitleUrl={subtitleUrl || undefined}
                  debug={debugMode}
                />

                {/* Optional: link to the version that includes preparation time.
                    Only rendered for interviews recorded with the new continuous flow. */}
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
      <div className="flex items-center justify-center min-h-screen bg-[#f5f5f7]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#0071e3] border-t-transparent mx-auto"></div>
          <p className="mt-2 text-sm text-[rgba(0,0,0,0.56)]">Loading video player...</p>
        </div>
      </div>
    }>
      <SchoolWatchPageContent />
    </Suspense>
  )
}
