"use client"

import { useEffect, useState, Suspense } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { 
  getInterviews, 
  getInterviewsBySchoolCode,
  InterviewRecord 
} from "@/app/actions/interviews"
import { getCurrentUser } from "@/app/actions/auth"
import { Video, Calendar, Clock, Mail, RefreshCw, AlertCircle, Shield, Copy, Search, Link as LinkIcon, CheckCircle, Trash2, FileText, CreditCard } from "lucide-react"
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
    credits_balance: number
  } | null>(null)
  const [currentUser, setCurrentUser] = useState<{
    email: string
    is_rater: boolean
  } | null>(null)
  const [authError, setAuthError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [linkCopied, setLinkCopied] = useState(false)
  
  // Bulk selection state
  const [selectedInterviews, setSelectedInterviews] = useState<Set<string>>(new Set())
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [rescoringInterviewIds, setRescoringInterviewIds] = useState<Set<string>>(new Set())

  const loadUserAndSchool = async () => {
    try {
      console.log("[School] Fetching current user...")
      const result = await getCurrentUser()
      
      if (result.success && result.user) {
        console.log("[School] User loaded:", result.user.email)
        setCurrentUser({ email: result.user.email, is_rater: result.user.is_rater })
        if (result.user.school.code) {
          setSchoolInfo({
            code: result.user.school.code,
            name: result.user.school.name,
            is_super_admin: result.user.school.is_super_admin,
            credits_balance: result.user.school.credits_balance
          })
          return {
            code: result.user.school.code,
            name: result.user.school.name,
            is_super_admin: result.user.school.is_super_admin,
            credits_balance: result.user.school.credits_balance
          }
        } else {
          setAuthError("School code is missing")
          return null
        }
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
      
      // Refresh the school info each time so credit balance stays current.
      const school = await loadUserAndSchool()
      if (!school) {
        setLoading(false)
        return
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
    const finalScore = getFinalScore(interview)
    const scoreDetailReady = hasScoreDetail(interview)
    
    const params = new URLSearchParams({
      videoUrl: proxyVideoUrl,
      interviewId: interview.interview_id || ''
    })

    if (interview.school_level) {
      params.append('schoolLevel', interview.school_level)
    }

    if (interview.video_url) {
      params.append('b2VideoUrl', interview.video_url)
    }

    // 仅当本次面试用了"prep+response 连续录制"流程时才转发；
    // 老面试该字段为 null，不会在 watch 页渲染额外的链接面板。
    if (interview.video_with_prep_url) {
      params.append('videoWithPrepUrl', interview.video_with_prep_url)
    }

    if (proxySubtitleUrl) {
      params.append('subtitleUrl', proxySubtitleUrl)
    }
    
    if (interview.student_email) {
      params.append('studentEmail', interview.student_email)
    }
    
    if (interview.student_name) {
      params.append('studentName', interview.student_name)
    }
    
    // 添加额外的学生信息
    if (interview.student_gender) {
      params.append('studentGender', interview.student_gender)
    }
    
    if (interview.student_grade) {
      params.append('studentGrade', interview.student_grade)
    }
    
    if (interview.student_city) {
      params.append('studentCity', interview.student_city)
    }
    
    if (interview.student_financial_aid !== null) {
      params.append('studentFinancialAid', interview.student_financial_aid.toString())
    }

    if (interview.student_uses_cbo !== null) {
      params.append('studentUsesCbo', interview.student_uses_cbo.toString())
    }

    if (interview.student_cbo_organization) {
      params.append('studentCboOrganization', interview.student_cbo_organization)
    }

    if (finalScore !== null) {
      params.append('finalScore', finalScore.toFixed(2))
    }

    params.append('scoreDetailReady', String(scoreDetailReady))
    
    const watchUrl = `/school/watch?${params.toString()}`
    
    window.location.href = watchUrl
  }

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'N/A'
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  // Only super admins have elevated visibility in the Interviews page.
  // Raters review unapproved scores via the Rating page, not here.
  const isPrivilegedUser = schoolInfo?.is_super_admin

  // K-12 schools are never AI-scored or rated.
  const isK12 = (interview: InterviewRecord): boolean => {
    return interview.school_level === "k12"
  }

  const getFinalScore = (interview: InterviewRecord): number | null => {
    // K-12 interviews have no score.
    if (isK12(interview)) {
      return null
    }
    // Only show scores that have been approved (super admins always see them)
    if (!isPrivilegedUser && !interview.score_approved) {
      return null
    }

    // If approved with rater override, show override score
    if (interview.score_approved && interview.rater_total_score !== null) {
      return interview.rater_total_score
    }

    if (interview.total_score !== null && interview.total_score !== undefined) {
      return Number(interview.total_score)
    }
    const metadata = interview.metadata as Record<string, any> | null
    const response = metadata?.cathoven?.response
    const metaScore = response?.vericant_lite?.overall ?? null
    return typeof metaScore === 'number' ? metaScore : null
  }

  const hasScoreDetail = (interview: InterviewRecord): boolean => {
    const metadata = interview.metadata as Record<string, any> | null
    const hasCathovenResponse = Boolean(metadata?.cathoven?.response)
    // Score detail only visible for approved interviews (super admins always see them)
    if (!isPrivilegedUser && !interview.score_approved) {
      return false
    }
    return hasCathovenResponse
  }

  const handleOpenScoreDetail = (interview: InterviewRecord) => {
    if (!interview.interview_id) return
    window.location.href = `/school/interview-report?interviewId=${encodeURIComponent(interview.interview_id)}`
  }

  const getCathovenStatus = (interview: InterviewRecord): 'completed' | 'failed' | 'not_called' => {
    const metadata = interview.metadata as Record<string, any> | null
    const status = metadata?.cathoven?.status
    if (status === 'completed') return 'completed'
    if (status === 'failed') return 'failed'
    return 'not_called'
  }

  const canRetryCathoven = (interview: InterviewRecord): boolean => {
    if (isK12(interview)) return false
    return Boolean(interview.video_url && interview.interview_id)
  }

  const getProgressBadge = (interview: InterviewRecord): { label: string; className: string } => {
    if (interview.status === "failed") {
      return { label: "Processing Failed", className: "bg-red-100 text-red-800" }
    }

    if (!interview.video_url) {
      const meta = interview.metadata as Record<string, any> | null
      const isAllUploaded = meta?.status === "uploaded"

      if (isAllUploaded) {
        return { label: "Processing", className: "bg-amber-100 text-amber-800" }
      }
      if (interview.responseCount > 0) {
        return {
          label: `Uploading (${interview.responseCount})`,
          className: "bg-orange-100 text-orange-800",
        }
      }
      return { label: "Not Started", className: "bg-[#f5f5f7] text-[#1d1d1f]" }
    }

    if (interview.status === "completed") {
      return { label: "Completed", className: "bg-green-100 text-green-800" }
    }
    if (interview.status === "reviewing") {
      return { label: "Reviewing", className: "bg-yellow-100 text-yellow-800" }
    }
    return { label: "Ready", className: "bg-emerald-100 text-emerald-800" }
  }

  const getCathovenBadge = (interview: InterviewRecord): { label: string; className: string } | null => {
    if (!interview.video_url) return null

    // K-12 interviews are not rated; no rating badge at all.
    if (isK12(interview)) {
      return null
    }

    const cathovenStatus = getCathovenStatus(interview)
    if (cathovenStatus === "completed") {
      if (interview.score_approved) {
        return { label: "Score Approved", className: "bg-emerald-100 text-emerald-800" }
      }
      return { label: "Pending Rating", className: "bg-amber-100 text-amber-800" }
    }
    if (cathovenStatus === "failed") {
      return { label: "CAP Failed", className: "bg-red-100 text-red-800" }
    }
    return { label: "CAP Not Called", className: "bg-slate-100 text-slate-700" }
  }

  const handleRetryCathoven = async (interview: InterviewRecord) => {
    if (!interview.interview_id || !canRetryCathoven(interview)) return
    const interviewId = interview.interview_id

    setRescoringInterviewIds(prev => new Set(prev).add(interviewId))
    try {
      const response = await fetch('/api/cathoven/retry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interviewId }),
      })

      const result = await response.json()
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to call Cathoven API')
      }

      await loadInterviews()
    } catch (error) {
      console.error('[Cathoven] Retry failed:', error)
      setError(error instanceof Error ? error.message : 'Failed to call Cathoven API')
    } finally {
      setRescoringInterviewIds(prev => {
        const next = new Set(prev)
        next.delete(interviewId)
        return next
      })
    }
  }

  // 复制面试链接到剪贴板（支持多种方法）
  const handleCopyLink = async () => {
    if (!schoolInfo) return
    
    const interviewUrl = `${window.location.origin}/student/interview?school=${schoolInfo.code}`
    
    try {
      // 方法1: 尝试使用现代 Clipboard API（需要 HTTPS 或 localhost）
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(interviewUrl)
        setLinkCopied(true)
        setTimeout(() => setLinkCopied(false), 2000)
        return
      }
      
      // 方法2: 使用传统的 execCommand 作为 fallback
      const textArea = document.createElement('textarea')
      textArea.value = interviewUrl
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      textArea.style.top = '-999999px'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      
      try {
        const successful = document.execCommand('copy')
        if (successful) {
          setLinkCopied(true)
          setTimeout(() => setLinkCopied(false), 2000)
        } else {
          throw new Error('execCommand failed')
        }
      } finally {
        document.body.removeChild(textArea)
      }
    } catch (err) {
      console.error('Failed to copy link:', err)
      // 如果所有方法都失败，至少选中文本让用户可以手动复制
      const linkElement = document.querySelector('[data-interview-link]') as HTMLInputElement
      if (linkElement) {
        linkElement.select()
        linkElement.setSelectionRange(0, 99999) // 对于移动设备
        alert('请手动复制链接（已选中）')
      } else {
        alert('无法复制链接，请手动复制：\n' + interviewUrl)
      }
    }
  }

  // 过滤面试列表
  const filteredInterviews = interviews.filter(interview => {
    if (!searchQuery.trim()) return true
    
    const query = searchQuery.toLowerCase()
    const email = (interview.student_email || '').toLowerCase()
    const name = (interview.student_name || '').toLowerCase()
    const interviewId = (interview.interview_id || '').toLowerCase()
    const schoolCode = (interview.school_code || '').toLowerCase()
    const gender = (interview.student_gender || '').toLowerCase()
    const grade = (interview.student_grade || '').toLowerCase()
    const city = (interview.student_city || '').toLowerCase()
    const cboOrganization = (interview.student_cbo_organization || '').toLowerCase()
    
    return email.includes(query) || 
           name.includes(query) ||
           interviewId.includes(query) || 
           schoolCode.includes(query) ||
           gender.includes(query) ||
           grade.includes(query) ||
           city.includes(query) ||
           cboOrganization.includes(query)
  })

  // 如果认证失败，显示错误
  if (authError) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center p-4">
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
            <p className="text-sm text-[rgba(0,0,0,0.56)]">
              You need to be logged in to access the school dashboard.
            </p>
            <p className="text-sm text-[rgba(0,0,0,0.56)]">
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
    <div className="space-y-6">
      {/* Refresh button */}
      <div className="flex justify-end">
              <Button
                onClick={handleRefresh}
                disabled={isRefreshing}
                variant="outline"
                size="sm"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

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
            <CardHeader className="space-y-2">
              <div className="flex items-center gap-2">
                <LinkIcon className="h-5 w-5 text-[#0071e3]" />
                <CardTitle className="text-blue-900 text-sm sm:text-base">Student Interview Link</CardTitle>
              </div>
              <CardDescription className="text-blue-700 text-xs sm:text-sm">
                <strong>{schoolInfo?.name}</strong> students can start their video interview at:
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className={`rounded-lg border px-4 py-3 ${
                (schoolInfo?.credits_balance ?? 0) > 0
                  ? "bg-white border-blue-200"
                  : "bg-amber-50 border-amber-200"
              }`}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`rounded-full p-2 ${
                      (schoolInfo?.credits_balance ?? 0) > 0
                        ? "bg-blue-100 text-[#0071e3]"
                        : "bg-amber-100 text-amber-700"
                    }`}>
                      <CreditCard className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#1d1d1f]">Interview credits remaining</p>
                      <p className="text-xs text-[rgba(0,0,0,0.56)]">
                        One credit is used when a student interview finishes processing.
                      </p>
                    </div>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-2xl font-semibold text-[#1d1d1f]">{schoolInfo?.credits_balance ?? 0}</p>
                    <p className="text-xs text-[rgba(0,0,0,0.48)]">available</p>
                  </div>
                </div>
                {(schoolInfo?.credits_balance ?? 0) <= 0 && (
                  <p className="mt-3 text-xs text-amber-800">
                    Students cannot start a new interview until more credits are added by a super administrator.
                  </p>
                )}
              </div>

              {/* Link display - separate line for better visibility */}
              <input
                type="text"
                readOnly
                value={typeof window !== 'undefined' ? `${window.location.origin}/student/interview?school=${schoolInfo?.code}` : ''}
                data-interview-link
                className="w-full bg-white rounded-lg border border-blue-300 px-4 py-3 font-mono text-xs sm:text-sm text-[#1d1d1f] break-all focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-text"
                onClick={(e) => {
                  // 点击时自动选中文本
                  const target = e.target as HTMLInputElement
                  target.select()
                  target.setSelectionRange(0, 99999) // 对于移动设备
                }}
              />
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
        <section className="space-y-2">
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-[#1d1d1f]">Recent Interviews</h2>
                <p className="text-sm text-[rgba(0,0,0,0.56)]">
                  View and review student interviews
                </p>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[rgba(0,0,0,0.36)]" />
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
              <div className="flex items-center justify-between pt-4 border-t border-black/[0.06]">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedInterviews.size === filteredInterviews.length && filteredInterviews.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-black/[0.08]"
                    />
                    <span className="text-sm text-[rgba(0,0,0,0.56)]">
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
          </div>
          <div>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-[rgba(0,0,0,0.56)]">Loading interviews...</span>
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
                <Video className="mx-auto h-12 w-12 text-[rgba(0,0,0,0.36)]" />
                <p className="mt-4 text-[rgba(0,0,0,0.56)]">
                  {searchQuery ? 'No interviews match your search' : 'No interviews found'}
                </p>
                <p className="text-sm text-[rgba(0,0,0,0.48)] mt-2">
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
                  <div className="mb-4 text-sm text-[rgba(0,0,0,0.56)]">
                    Found <strong>{filteredInterviews.length}</strong> interview{filteredInterviews.length !== 1 ? 's' : ''} matching "<strong>{searchQuery}</strong>"
                  </div>
                )}
                <div className="hidden lg:grid grid-cols-[minmax(0,1fr)_220px_320px] items-center px-4 py-2 text-xs font-medium uppercase tracking-wide text-[rgba(0,0,0,0.44)] border-y border-black/[0.08]">
                  <span>Candidate</span>
                  <span>Status</span>
                  <span className="text-right">Actions</span>
                </div>
                <div className="divide-y divide-black/[0.06] border-y border-black/[0.08] bg-transparent">
                  {filteredInterviews.map((interview) => {
                    const progressBadge = getProgressBadge(interview)
                    const cathovenBadge = getCathovenBadge(interview)
                    return (
                    <div
                      key={interview.id}
                      className="px-4 py-4 sm:px-5 transition-colors hover:bg-black/[0.015]"
                    >
                      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px_320px] lg:items-center">
                        {/* Selection checkbox for super admins */}
                        {schoolInfo?.is_super_admin && (
                          <div className="flex items-center lg:col-span-3">
                            <input
                              type="checkbox"
                              checked={selectedInterviews.has(interview.id)}
                              onChange={() => handleSelectInterview(interview.id)}
                              className="rounded border-black/[0.08]"
                            />
                          </div>
                        )}

                        <div className="min-w-0 space-y-2.5">
                          <div className="flex flex-wrap items-start justify-between gap-2 lg:justify-start">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <Mail className="h-3.5 w-3.5 text-[rgba(0,0,0,0.36)]" />
                                <p className="truncate text-base font-semibold text-[#1d1d1f]">
                                  {interview.student_name || interview.student_email || "Unknown Student"}
                                </p>
                              </div>
                              {interview.student_name && (
                                <p className="truncate pl-6 text-sm text-[rgba(0,0,0,0.56)]">
                                  {interview.student_email || "Unknown"}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[rgba(0,0,0,0.56)]">
                            <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                              <Calendar className="h-3.5 w-3.5" />
                              {format(new Date(interview.created_at), "MMM dd, yyyy HH:mm")}
                            </span>
                            {interview.total_duration && (
                              <span className="inline-flex items-center gap-1.5">
                                <Clock className="h-3.5 w-3.5" />
                                {formatDuration(interview.total_duration)}
                              </span>
                            )}
                            {getFinalScore(interview) !== null && (
                              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                                Score {getFinalScore(interview)!.toFixed(2)}
                              </span>
                            )}
                            {interview.interview_id && (
                              <span className="rounded-md bg-black/[0.03] px-2 py-0.5 font-mono text-xs text-[rgba(0,0,0,0.48)] break-all">
                                ID: {interview.interview_id}
                              </span>
                            )}
                          </div>

                          {(interview.student_gender || interview.student_grade || interview.student_city || interview.student_financial_aid !== null || interview.student_cbo_organization) && (
                            <div className="flex flex-wrap items-center gap-1.5 text-xs">
                              {interview.student_gender && (
                                <span className="rounded-md bg-black/[0.03] px-2 py-0.5 text-[#1d1d1f]">
                                  {interview.student_gender}
                                </span>
                              )}
                              {interview.student_grade && (
                                <span className="rounded-md bg-black/[0.03] px-2 py-0.5 text-[#1d1d1f]">
                                  {interview.student_grade}
                                </span>
                              )}
                              {interview.student_city && (
                                <span className="rounded-md bg-black/[0.03] px-2 py-0.5 text-[#1d1d1f]">
                                  {interview.student_city}
                                </span>
                              )}
                              {interview.student_financial_aid !== null && (
                                <span
                                  className={`rounded-md px-2 py-0.5 ${
                                    interview.student_financial_aid
                                      ? "bg-purple-100 text-purple-700"
                                      : "bg-black/[0.03] text-[#1d1d1f]"
                                  }`}
                                >
                                  {interview.student_financial_aid ? "Financial Aid" : "No Financial Aid"}
                                </span>
                              )}
                              {interview.student_cbo_organization && (
                                <span className="rounded-md bg-teal-100 px-2 py-0.5 text-teal-700">
                                  CBO: {interview.student_cbo_organization}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5">
                          {interview.school_code && (
                            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                              {interview.school_code}
                            </span>
                          )}
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${progressBadge.className}`}>
                            {progressBadge.label}
                          </span>
                          {cathovenBadge && (
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs font-medium ${cathovenBadge.className}`}
                            >
                              {cathovenBadge.label}
                            </span>
                          )}
                        </div>

                        <div className={`grid w-full shrink-0 ${isK12(interview) ? "grid-cols-1" : "grid-cols-3"} gap-1.5 rounded-xl border border-black/[0.06] bg-black/[0.02] p-1 lg:justify-self-end`}>
                          <Button
                            onClick={() => handleWatchInterview(interview)}
                            size="sm"
                            className="col-span-1 min-w-0 border border-[#0071e3]/80 bg-[#0071e3] text-white shadow-sm hover:bg-[#0067cf] active:bg-[#005bb5] disabled:border-[#0071e3]/20 disabled:bg-white disabled:text-[rgba(0,0,0,0.42)] disabled:opacity-100 disabled:shadow-none"
                            disabled={!interview.video_url}
                            title={
                              interview.video_url
                                ? "Watch interview"
                                : interview.status === "failed"
                                  ? "Video processing failed"
                                  : "Video is still processing..."
                            }
                          >
                            <Video className="mr-1.5 h-3.5 w-3.5" />
                            {interview.video_url
                              ? "Watch"
                              : interview.status === "failed"
                                ? "Failed"
                                : (interview.metadata as Record<string, any> | null)?.status === "uploaded"
                                ? "Processing"
                                : "Pending"}
                          </Button>
                          {!isK12(interview) && (
                            <>
                              <Button
                                onClick={() => handleOpenScoreDetail(interview)}
                                size="sm"
                                variant="ghost"
                                className="col-span-1 min-w-0 border border-black/[0.14] bg-white text-[#1d1d1f] hover:bg-black/[0.04] active:bg-black/[0.08] disabled:border-black/[0.08] disabled:bg-black/[0.02] disabled:text-[rgba(0,0,0,0.32)] disabled:opacity-100"
                                disabled={!hasScoreDetail(interview)}
                                title={!hasScoreDetail(interview) ? "Score detail not ready yet" : "Open score detail"}
                              >
                                <FileText className="mr-1.5 h-3.5 w-3.5" />
                                Detail
                              </Button>
                              <Button
                                onClick={() => handleRetryCathoven(interview)}
                                size="sm"
                                variant="ghost"
                                className="col-span-1 min-w-0 border border-black/[0.14] bg-white text-[#1d1d1f] hover:bg-black/[0.04] active:bg-black/[0.08] disabled:border-black/[0.08] disabled:bg-black/[0.02] disabled:text-[rgba(0,0,0,0.32)] disabled:opacity-100"
                                disabled={!canRetryCathoven(interview) || (!!interview.interview_id && rescoringInterviewIds.has(interview.interview_id))}
                                title={!canRetryCathoven(interview) ? "Video is not ready yet" : "Call Cathoven API to get score"}
                              >
                                <RefreshCw
                                  className={`mr-1.5 h-3.5 w-3.5 ${
                                    interview.interview_id && rescoringInterviewIds.has(interview.interview_id)
                                      ? "animate-spin"
                                      : ""
                                  }`}
                                />
                                {interview.interview_id && rescoringInterviewIds.has(interview.interview_id)
                                  ? "Scoring"
                                  : "CAP Retry"}
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    )
                })}
              </div>
              </>
            )}
          </div>
        </section>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[#1d1d1f]">Delete Interviews</h3>
                <p className="text-sm text-[rgba(0,0,0,0.56)]">
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
      <div className="flex items-center justify-center min-h-screen bg-[#f5f5f7]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#0071e3] border-t-transparent mx-auto"></div>
          <p className="mt-2 text-sm text-[rgba(0,0,0,0.56)]">Loading dashboard...</p>
        </div>
      </div>
    }>
      <SchoolDashboardContent />
    </Suspense>
  )
}
