"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { 
  getInterviews, 
  getInterviewsBySchoolCode,
  getSchoolByAdminEmail,
  InterviewRecord 
} from "@/app/actions/interviews"
import { getCurrentUser, signOut } from "@/app/actions/auth"
import { Video, Calendar, Clock, Mail, RefreshCw, AlertCircle, Shield, Building2, Copy, Search, Link as LinkIcon, CheckCircle, LogOut, Trash2, X } from "lucide-react"
import { format } from "date-fns"

function SchoolDashboardContent() {
  const [interviews, setInterviews] = useState<InterviewRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [schoolInfo, setSchoolInfo] = useState<{
    code: string
    name: string
    is_super_admin: boolean
  } | null>(null)
  const [currentUser, setCurrentUser] = useState<{
    email: string
  } | null>(null)
  const [authError, setAuthError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [linkCopied, setLinkCopied] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  
  // Bulk selection state
  const [selectedInterviews, setSelectedInterviews] = useState<Set<string>>(new Set())
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const loadUserAndSchool = async () => {
    try {
      console.log("[School] Fetching current user...")
      const result = await getCurrentUser()
      
      if (result.success && result.user) {
        console.log("[School] User loaded:", result.user.email)
        setCurrentUser({ email: result.user.email })
        setSchoolInfo(result.user.school)
        return result.user.school
      } else {
        console.error("[School] Failed to load user:", result.error)
        setAuthError(result.error || "Not authenticated")
        // 跳转到登录页面
        setTimeout(() => {
          window.location.href = "/school/login"
        }, 2000)
        return null
      }
    } catch (err) {
      console.error("[School] Error loading user:", err)
      setAuthError(err instanceof Error ? err.message : "Unknown error")
      return null
    }
  }

  const loadInterviews = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // 先加载用户和学校信息
      let school = schoolInfo
      if (!school) {
        school = await loadUserAndSchool()
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
  }, [])

  const handleRefresh = () => {
    setIsRefreshing(true)
    loadInterviews()
  }

  const handleLogout = async () => {
    if (loggingOut) return
    setLoggingOut(true)
    await signOut()
  }

  // Bulk selection handlers
  const handleSelectInterview = (interviewId: string) => {
    const newSelected = new Set(selectedInterviews)
    if (newSelected.has(interviewId)) {
      newSelected.delete(interviewId)
    } else {
      newSelected.add(interviewId)
    }
    setSelectedInterviews(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedInterviews.size === filteredInterviews.length) {
      setSelectedInterviews(new Set())
    } else {
      setSelectedInterviews(new Set(filteredInterviews.map(i => i.id)))
    }
  }

  const handleBulkDelete = async () => {
    if (selectedInterviews.size === 0) return
    
    setIsDeleting(true)
    try {
      console.log("[Bulk Delete] Deleting interviews:", Array.from(selectedInterviews))
      
      const response = await fetch('/api/bulk-delete-interviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ interviewIds: Array.from(selectedInterviews) }),
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        console.error("[Bulk Delete] API error:", result)
        setError(result.error || "Failed to delete interviews")
        return
      }
      
      if (result.success) {
        // Remove deleted interviews from state
        setInterviews(prev => prev.filter(i => !selectedInterviews.has(i.id)))
        setSelectedInterviews(new Set())
        setShowDeleteConfirm(false)
        console.log(`Successfully deleted ${result.deletedCount} interviews`)
      } else {
        console.error("Bulk delete failed:", result.error)
        setError(result.error || "Failed to delete interviews")
      }
    } catch (error) {
      console.error("Bulk delete error:", error)
      setError("Failed to delete interviews")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleWatchInterview = (interview: InterviewRecord) => {
    // 使用代理 URL 避免 CORS 问题
    const proxyVideoUrl = `/api/proxy-video?url=${encodeURIComponent(interview.video_url!)}`
    const proxySubtitleUrl = interview.subtitle_url 
      ? `/api/proxy-json?url=${encodeURIComponent(interview.subtitle_url)}` 
      : ''
    
    const params = new URLSearchParams({
      videoUrl: proxyVideoUrl,
      interviewId: interview.interview_id
    })
    
    if (proxySubtitleUrl) {
      params.append('subtitleUrl', proxySubtitleUrl)
    }
    
    if (interview.student_email) {
      params.append('studentEmail', interview.student_email)
    }
    
    if (interview.student_name) {
      params.append('studentName', interview.student_name)
    }
    
    const watchUrl = `/school/watch?${params.toString()}`
    
    window.location.href = watchUrl
  }

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'N/A'
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  // 复制面试链接到剪贴板
  const handleCopyLink = async () => {
    if (!schoolInfo) return
    
    const interviewUrl = `${window.location.origin}/student/interview?school=${schoolInfo.code}`
    
    try {
      await navigator.clipboard.writeText(interviewUrl)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy link:', err)
      alert('Failed to copy link to clipboard')
    }
  }

  // 过滤面试列表
  const filteredInterviews = interviews.filter(interview => {
    if (!searchQuery.trim()) return true
    
    const query = searchQuery.toLowerCase()
    const email = (interview.student_email || '').toLowerCase()
    const interviewId = (interview.interview_id || '').toLowerCase()
    const schoolCode = (interview.school_code || '').toLowerCase()
    
    return email.includes(query) || 
           interviewId.includes(query) || 
           schoolCode.includes(query)
  })

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
              You need to be logged in to access the school dashboard.
            </p>
            <p className="text-sm text-slate-600">
              Redirecting to login page...
            </p>
            <Button onClick={() => window.location.href = "/school/login"}>
              Go to Login
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 sm:gap-3 mb-2">
                <h1 className="text-xl sm:text-3xl font-bold text-slate-900">School Dashboard</h1>
                {schoolInfo?.is_super_admin && (
                  <span className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full whitespace-nowrap">
                    <Shield className="h-3 w-3" />
                    Super Admin
                  </span>
                )}
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 gap-2 text-xs sm:text-sm text-slate-600">
                {schoolInfo && (
                  <div className="flex items-center gap-1 truncate">
                    <Building2 className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                    <span className="truncate">{schoolInfo.name}</span>
                  </div>
                )}
                {currentUser && (
                  <div className="flex items-center gap-1 truncate">
                    <Mail className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                    <span className="truncate">{currentUser.email}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                onClick={handleRefresh}
                disabled={isRefreshing}
                variant="outline"
                size="sm"
                className="flex-1 sm:flex-none"
              >
                <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 sm:mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
              <Button
                onClick={handleLogout}
                disabled={loggingOut}
                variant="ghost"
                size="sm"
                className="flex-1 sm:flex-none"
              >
                <LogOut className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                <span className="hidden sm:inline">{loggingOut ? "Logging out..." : "Logout"}</span>
              </Button>
            </div>
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
          <Card className="mb-6 bg-blue-50 border-blue-200">
            <CardHeader>
              <div className="flex items-center gap-2">
                <LinkIcon className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-blue-900 text-sm sm:text-base">Student Interview Link</CardTitle>
              </div>
              <CardDescription className="text-blue-700 text-xs sm:text-sm">
                <strong>{schoolInfo?.name}</strong> students can start their video interview at: {" "}
                <button
                  onClick={handleCopyLink}
                  className="underline text-blue-800 hover:text-blue-900 font-medium"
                >
                  {typeof window !== 'undefined' && `${window.location.origin}/student/interview?school=${schoolInfo?.code}`}
                </button>
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <Button
                  onClick={handleCopyLink}
                  variant={linkCopied ? "default" : "outline"}
                  className={`${linkCopied ? "bg-green-600 hover:bg-green-700" : ""} w-full sm:w-auto`}
                >
                  {linkCopied ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Link Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Interview Link
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards - Compressed for mobile */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6">
          <Card className="py-3">
            <CardContent className="p-0 text-center">
              <div className="text-lg sm:text-2xl font-bold">{interviews.length}</div>
              <p className="text-xs text-muted-foreground">Total</p>
            </CardContent>
          </Card>
          <Card className="py-3">
            <CardContent className="p-0 text-center">
              <div className="text-lg sm:text-2xl font-bold">
                {interviews.filter(i => {
                  const interviewDate = new Date(i.created_at)
                  const weekAgo = new Date()
                  weekAgo.setDate(weekAgo.getDate() - 7)
                  return interviewDate > weekAgo
                }).length}
              </div>
              <p className="text-xs text-muted-foreground">This Week</p>
            </CardContent>
          </Card>
          <Card className="py-3">
            <CardContent className="p-0 text-center">
              <div className="text-lg sm:text-2xl font-bold">
                {interviews.length > 0
                  ? formatDuration(
                      interviews.reduce((sum, i) => sum + (i.total_duration || 0), 0) / interviews.length
                    )
                  : 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground">Avg Duration</p>
            </CardContent>
          </Card>
        </div>

        {/* Interview List */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>Recent Interviews</CardTitle>
                <CardDescription>
                  View and review student interview assessments
                </CardDescription>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    type="text"
                    placeholder="Search email, ID, school..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSearchQuery("")}
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>
            
            {/* Super Admin Bulk Actions */}
            {schoolInfo?.is_super_admin && filteredInterviews.length > 0 && (
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedInterviews.size === filteredInterviews.length && filteredInterviews.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-slate-300"
                    />
                    <span className="text-sm text-slate-600">
                      Select All ({selectedInterviews.size} selected)
                    </span>
                  </label>
                  
                  {selectedInterviews.size > 0 && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setShowDeleteConfirm(true)}
                      disabled={isDeleting}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Selected ({selectedInterviews.size})
                    </Button>
                  )}
                </div>
              </div>
            )}
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
            ) : filteredInterviews.length === 0 ? (
              <div className="text-center py-12">
                <Video className="mx-auto h-12 w-12 text-slate-400" />
                <p className="mt-4 text-slate-600">
                  {searchQuery ? 'No interviews match your search' : 'No interviews found'}
                </p>
                <p className="text-sm text-slate-500 mt-2">
                  {searchQuery 
                    ? `Try searching with different keywords`
                    : schoolInfo?.is_super_admin 
                      ? 'No interviews have been submitted yet'
                      : `No interviews for ${schoolInfo?.name} yet`
                  }
                </p>
                {searchQuery && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setSearchQuery("")}
                    className="mt-4"
                  >
                    Clear Search
                  </Button>
                )}
              </div>
            ) : (
              <>
                {searchQuery && (
                  <div className="mb-4 text-sm text-slate-600">
                    Found <strong>{filteredInterviews.length}</strong> interview{filteredInterviews.length !== 1 ? 's' : ''} matching "<strong>{searchQuery}</strong>"
                  </div>
                )}
                <div className="space-y-4">
                  {filteredInterviews.map((interview) => (
                  <div
                    key={interview.id}
                    className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 border rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    {/* Selection checkbox for super admins */}
                    {schoolInfo?.is_super_admin && (
                      <div className="flex items-center sm:mr-4">
                        <input
                          type="checkbox"
                          checked={selectedInterviews.has(interview.id)}
                          onChange={() => handleSelectInterview(interview.id)}
                          className="rounded border-slate-300"
                        />
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0 space-y-2">
                      {/* First row: Name and badges */}
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <Mail className="h-3 w-3 sm:h-4 sm:w-4 text-slate-400 flex-shrink-0" />
                          <div className="flex flex-col min-w-0">
                            {interview.student_name && (
                              <span className="font-medium text-slate-900 truncate text-sm sm:text-base">
                                {interview.student_name}
                              </span>
                            )}
                            <span className={`${interview.student_name ? "text-xs sm:text-sm text-slate-600" : "text-sm sm:text-base font-medium text-slate-900"} truncate`}>
                              {interview.student_email || 'Unknown'}
                            </span>
                          </div>
                        </div>
                        {interview.school_code && (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800 whitespace-nowrap">
                            {interview.school_code}
                          </span>
                        )}
                        {interview.status && (
                          <span className={`px-2 py-0.5 text-xs rounded-full whitespace-nowrap ${
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
                      {/* Second row: Date, duration, ID */}
                      <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-slate-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span className="whitespace-nowrap">{format(new Date(interview.created_at), 'MMM dd, yyyy HH:mm')}</span>
                        </div>
                        {interview.total_duration && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{formatDuration(interview.total_duration)}</span>
                          </div>
                        )}
                        <div className="text-xs text-slate-500 font-mono truncate hidden sm:block">
                          ID: {interview.interview_id}
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleWatchInterview(interview)}
                      size="sm"
                      className="w-full sm:w-auto shrink-0"
                    >
                      <Video className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                      <span className="sm:inline">Watch</span>
                    </Button>
                  </div>
                ))}
              </div>
              </>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Delete Interviews</h3>
                <p className="text-sm text-slate-600">
                  Are you sure you want to delete {selectedInterviews.size} interview{selectedInterviews.size !== 1 ? 's' : ''}?
                </p>
              </div>
            </div>
            
            <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
              <p className="text-sm text-red-800">
                <strong>Warning:</strong> This action cannot be undone. The selected interviews and all associated data will be permanently deleted.
              </p>
            </div>
            
            <div className="flex items-center justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleBulkDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete {selectedInterviews.size} Interview{selectedInterviews.size !== 1 ? 's' : ''}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
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
