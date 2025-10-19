"use client"

import { use, useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getInterviews, InterviewRecord } from "@/app/actions/interviews"
import { Video, Calendar, Clock, Mail, RefreshCw } from "lucide-react"
import { format } from "date-fns"

export default function SchoolDashboard() {
  const [interviews, setInterviews] = useState<InterviewRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const loadInterviews = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log("[School] Loading interviews...")
      
      const result = await getInterviews(100, 0)
      
      if (result.success && result.interviews) {
        console.log("[School] Loaded", result.interviews.length, "interviews")
        setInterviews(result.interviews)
      } else {
        setError(result.error || "Failed to load interviews")
      }
    } catch (err) {
      console.error("[School] Error loading interviews:", err)
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    loadInterviews()
  }, [])

  const handleRefresh = () => {
    setIsRefreshing(true)
    loadInterviews()
  }

  const handleWatchInterview = (interview: InterviewRecord) => {
    // 使用代理 URL 避免 CORS 问题
    const proxyVideoUrl = `/api/proxy-video?url=${encodeURIComponent(interview.video_url!)}`
    const proxySubtitleUrl = interview.subtitle_url 
      ? `/api/proxy-json?url=${encodeURIComponent(interview.subtitle_url)}` 
      : ''
    
    const watchUrl = `/school/watch?videoUrl=${encodeURIComponent(proxyVideoUrl)}${
      proxySubtitleUrl ? `&subtitleUrl=${encodeURIComponent(proxySubtitleUrl)}` : ''
    }&interviewId=${interview.interview_id}`
    
    window.location.href = watchUrl
  }

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'N/A'
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">School Dashboard</h1>
              <p className="text-slate-600 mt-1">View and manage student interview assessments</p>
            </div>
            <Button
              onClick={handleRefresh}
              disabled={isRefreshing}
              variant="outline"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Interviews</CardTitle>
              <Video className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{interviews.length}</div>
              <p className="text-xs text-muted-foreground">
                Completed assessments
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Week</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {interviews.filter(i => {
                  const interviewDate = new Date(i.created_at)
                  const weekAgo = new Date()
                  weekAgo.setDate(weekAgo.getDate() - 7)
                  return interviewDate > weekAgo
                }).length}
              </div>
              <p className="text-xs text-muted-foreground">
                Last 7 days
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {interviews.length > 0
                  ? formatDuration(
                      interviews.reduce((sum, i) => sum + (i.total_duration || 0), 0) / interviews.length
                    )
                  : 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground">
                Average video length
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Interview List */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Interviews</CardTitle>
            <CardDescription>
              View and review student interview assessments
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-slate-600">Loading interviews...</span>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-red-600 mb-4">{error}</p>
                <Button onClick={handleRefresh} variant="outline">
                  Try Again
                </Button>
              </div>
            ) : interviews.length === 0 ? (
              <div className="text-center py-12">
                <Video className="mx-auto h-12 w-12 text-slate-400" />
                <p className="mt-4 text-slate-600">No interviews found</p>
                <p className="text-sm text-slate-500 mt-2">
                  Completed interviews will appear here
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {interviews.map((interview) => (
                  <div
                    key={interview.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-slate-400" />
                          <span className="font-medium text-slate-900">
                            {interview.student_email || 'Unknown'}
                          </span>
                        </div>
                        {interview.status && (
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            interview.status === 'completed' 
                              ? 'bg-green-100 text-green-800' 
                              : interview.status === 'reviewing'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-slate-100 text-slate-800'
                          }`}>
                            {interview.status}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(interview.created_at), 'MMM dd, yyyy HH:mm')}
                        </div>
                        {interview.total_duration && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDuration(interview.total_duration)}
                          </div>
                        )}
                        <div className="text-xs text-slate-500">
                          ID: {interview.interview_id.slice(0, 20)}...
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleWatchInterview(interview)}
                      size="sm"
                    >
                      <Video className="h-4 w-4 mr-2" />
                      Watch
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
