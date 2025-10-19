"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { 
  getInterviews, 
  getInterviewsBySchoolCode,
  getSchoolByAdminEmail,
  InterviewRecord 
} from "@/app/actions/interviews"
import { Video, Calendar, Clock, Mail, RefreshCw, AlertCircle, Shield, Building2 } from "lucide-react"
import { format } from "date-fns"

function SchoolDashboardContent() {
  const searchParams = useSearchParams()
  // 临时方案：从 URL 参数读取用户邮箱（实际项目中应该使用认证系统）
  // 例如：/school/dashboard?email=admin@harvard.edu
  const adminEmail = searchParams.get("email") || "admin@harvard.edu" // 默认为 harvard 管理员
  
  const [interviews, setInterviews] = useState<InterviewRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [schoolInfo, setSchoolInfo] = useState<{
    code: string
    name: string
    is_super_admin: boolean
  } | null>(null)
  const [authError, setAuthError] = useState<string | null>(null)

  const loadSchoolInfo = async () => {
    try {
      console.log("[School] Fetching school info for:", adminEmail)
      const result = await getSchoolByAdminEmail(adminEmail)
      
      if (result.success && result.school) {
        console.log("[School] School info loaded:", result.school)
        setSchoolInfo(result.school)
        return result.school
      } else {
        console.error("[School] Failed to load school info:", result.error)
        setAuthError(result.error || "Failed to load school information")
        return null
      }
    } catch (err) {
      console.error("[School] Error loading school info:", err)
      setAuthError(err instanceof Error ? err.message : "Unknown error")
      return null
    }
  }

  const loadInterviews = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // 先加载学校信息
      let school = schoolInfo
      if (!school) {
        school = await loadSchoolInfo()
        if (!school) {
          setLoading(false)
          return
        }
      }
      
      console.log("[School] Loading interviews for school:", school.code, "super admin:", school.is_super_admin)
      
      // 根据权限加载不同的面试列表
      let result
      if (school.is_super_admin) {
        // 超级管理员：查看所有面试
        console.log("[School] Loading ALL interviews (super admin)")
        result = await getInterviews(100, 0)
      } else {
        // 普通管理员：只查看本学校的面试
        console.log("[School] Loading interviews for school code:", school.code)
        result = await getInterviewsBySchoolCode(school.code, 100, 0)
      }
      
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
  }, [adminEmail])

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

  // 如果认证失败，显示错误
  if (authError) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Authentication Error</AlertTitle>
              <AlertDescription>
                {authError}
              </AlertDescription>
            </Alert>
            <p className="text-sm text-slate-600">
              The email <strong>{adminEmail}</strong> is not registered as a school administrator.
            </p>
            <div className="bg-slate-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-slate-900 mb-2">Test Accounts:</p>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>• <code>admin@harvard.edu</code> - Harvard Admin</li>
                <li>• <code>super@admin.com</code> - Super Administrator (all schools)</li>
              </ul>
            </div>
            <p className="text-xs text-slate-500">
              To switch accounts, add <code>?email=xxx@example.com</code> to the URL
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-slate-900">School Dashboard</h1>
                {schoolInfo?.is_super_admin && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
                    <Shield className="h-3 w-3" />
                    Super Admin
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 text-sm text-slate-600">
                {schoolInfo && (
                  <>
                    <div className="flex items-center gap-1">
                      <Building2 className="h-4 w-4" />
                      <span>{schoolInfo.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      <span>{adminEmail}</span>
                    </div>
                  </>
                )}
              </div>
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
        {/* Info Banner */}
        {schoolInfo?.is_super_admin ? (
          <Alert className="mb-6 bg-purple-50 border-purple-200">
            <Shield className="h-4 w-4 text-purple-600" />
            <AlertTitle className="text-purple-900">Super Administrator Mode</AlertTitle>
            <AlertDescription className="text-purple-700">
              You can view interviews from all schools. The "School" column shows which school each interview belongs to.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="mb-6 bg-blue-50 border-blue-200">
            <Building2 className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-blue-900">School Access</AlertTitle>
            <AlertDescription className="text-blue-700">
              You can only view interviews submitted to <strong>{schoolInfo?.name}</strong> (code: <code>{schoolInfo?.code}</code>)
            </AlertDescription>
          </Alert>
        )}

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
                {schoolInfo?.is_super_admin ? 'All schools' : 'Your school only'}
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
                  {schoolInfo?.is_super_admin 
                    ? 'No interviews have been submitted yet'
                    : `No interviews for ${schoolInfo?.name} yet`
                  }
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
                        {interview.school_code && (
                          <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                            {interview.school_code}
                          </span>
                        )}
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

export default function SchoolDashboard() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto"></div>
          <p className="mt-2 text-sm text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    }>
      <SchoolDashboardContent />
    </Suspense>
  )
}
