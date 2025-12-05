"use client"

import { useEffect, useState, Suspense, useCallback, type FormEvent } from "react"
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
import { listSchools, createSchool, deleteSchool, type ManagedSchool } from "@/app/actions/schools"
import { Video, Calendar, Clock, Mail, RefreshCw, AlertCircle, Shield, Building2, Copy, Search, Link as LinkIcon, CheckCircle, LogOut, Trash2, X, PlusCircle, Upload } from "lucide-react"
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
  
  // Bulk selection state
  const [selectedInterviews, setSelectedInterviews] = useState<Set<string>>(new Set())
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [managedSchools, setManagedSchools] = useState<ManagedSchool[]>([])
  const [schoolsLoading, setSchoolsLoading] = useState(false)
  const [schoolActionError, setSchoolActionError] = useState<string | null>(null)
  const [newSchoolName, setNewSchoolName] = useState("")
  const [newSchoolCode, setNewSchoolCode] = useState("")
  const [isCreatingSchool, setIsCreatingSchool] = useState(false)
  const [deletingSchoolId, setDeletingSchoolId] = useState<string | null>(null)

  const loadUserAndSchool = async () => {
    try {
      console.log("[School] Fetching current user...")
      const result = await getCurrentUser()
      
      if (result.success && result.user) {
        console.log("[School] User loaded:", result.user.email)
        setCurrentUser({ email: result.user.email })
        if (result.user.school.code) {
          setSchoolInfo({
            code: result.user.school.code,
            name: result.user.school.name,
            is_super_admin: result.user.school.is_super_admin
          })
          return {
            code: result.user.school.code,
            name: result.user.school.name,
            is_super_admin: result.user.school.is_super_admin
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

  const fetchManagedSchools = useCallback(async () => {
    if (!schoolInfo?.is_super_admin) return
    setSchoolsLoading(true)
    setSchoolActionError(null)
    const result = await listSchools()
    if (result.success && result.schools) {
      setManagedSchools(result.schools)
    } else {
      setSchoolActionError(result.error || "Failed to load schools")
    }
    setSchoolsLoading(false)
  }, [schoolInfo?.is_super_admin])

  useEffect(() => {
    if (schoolInfo?.is_super_admin) {
      fetchManagedSchools()
    }
  }, [schoolInfo?.is_super_admin, fetchManagedSchools])

  const handleCreateSchool = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!newSchoolName.trim() || !newSchoolCode.trim()) {
      setSchoolActionError("School name and code are required")
      return
    }

    setIsCreatingSchool(true)
    setSchoolActionError(null)

    const result = await createSchool({
      name: newSchoolName,
      code: newSchoolCode,
    })

    if (result.success) {
      setNewSchoolName("")
      setNewSchoolCode("")
      await fetchManagedSchools()
    } else {
      setSchoolActionError(result.error || "Failed to create school")
    }

    setIsCreatingSchool(false)
  }

  const handleDeleteSchool = async (schoolId: string, schoolName: string) => {
    if (deletingSchoolId) return

    const confirmed =
      typeof window !== "undefined"
        ? window.confirm(
            `Delete "${schoolName}"?\nThis action requires removing all associated interviews first and cannot be undone.`
          )
        : false

    if (!confirmed) return

    setDeletingSchoolId(schoolId)
    setSchoolActionError(null)

    const result = await deleteSchool(schoolId)

    if (result.success) {
      setManagedSchools((prev) => prev.filter((school) => school.id !== schoolId))
    } else {
      setSchoolActionError(result.error || "Failed to delete school")
    }

    setDeletingSchoolId(null)
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
      interviewId: interview.interview_id || ''
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
    
    const watchUrl = `/school/watch?${params.toString()}`
    
    window.location.href = watchUrl
  }

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'N/A'
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
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
    
    return email.includes(query) || 
           name.includes(query) ||
           interviewId.includes(query) || 
           schoolCode.includes(query) ||
           gender.includes(query) ||
           grade.includes(query) ||
           city.includes(query)
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
                <LinkIcon className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-blue-900 text-sm sm:text-base">Student Interview Link</CardTitle>
              </div>
              <CardDescription className="text-blue-700 text-xs sm:text-sm">
                <strong>{schoolInfo?.name}</strong> students can start their video interview at:
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              {/* Link display - separate line for better visibility */}
              <input
                type="text"
                readOnly
                value={typeof window !== 'undefined' ? `${window.location.origin}/student/interview?school=${schoolInfo?.code}` : ''}
                data-interview-link
                className="w-full bg-white rounded-lg border border-blue-300 px-4 py-3 font-mono text-xs sm:text-sm text-slate-700 break-all focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-text"
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

        {schoolInfo?.is_super_admin && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PlusCircle className="h-5 w-5 text-purple-600" />
                Manage Schools
              </CardTitle>
              <CardDescription>Super admins can add or remove schools below.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {schoolActionError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{schoolActionError}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleCreateSchool} className="grid gap-3 md:grid-cols-3">
                <Input
                  placeholder="School Name (e.g. MIT)"
                  value={newSchoolName}
                  onChange={(e) => setNewSchoolName(e.target.value)}
                  required
                />
                <Input
                  placeholder="School Code (e.g. mit)"
                  value={newSchoolCode}
                  onChange={(e) => setNewSchoolCode(e.target.value)}
                  required
                />
                <Button type="submit" disabled={isCreatingSchool}>
                  {isCreatingSchool ? "Adding..." : "Add School"}
                </Button>
              </form>
              <p className="text-xs text-slate-500">
                School codes must be lowercase letters, numbers, or hyphen. Example: harvard, mit, the-governors-academy.
              </p>

              {schoolsLoading ? (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <div className="h-4 w-4 border-b-2 border-purple-600 rounded-full animate-spin" />
                  Loading schools...
                </div>
              ) : managedSchools.length === 0 ? (
                <p className="text-sm text-slate-600">No schools yet.</p>
              ) : (
                <div className="space-y-3">
                  {managedSchools.map((school) => (
                    <div
                      key={school.id}
                      className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 border rounded-lg"
                    >
                      <div>
                        <p className="font-semibold text-slate-900">
                          {school.name}{" "}
                          <span className="text-sm font-normal text-slate-500">({school.code})</span>
                        </p>
                        <p className="text-xs text-slate-500">
                          Added {school.created_at ? format(new Date(school.created_at), "MMM dd, yyyy") : "—"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {!school.active && (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-amber-100 text-amber-800">Inactive</span>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteSchool(school.id, school.name)}
                          disabled={deletingSchoolId === school.id}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          {deletingSchoolId === school.id ? "Deleting..." : "Delete"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
          <CardHeader className="space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>Recent Interviews</CardTitle>
                <CardDescription>
                  View and review student interviews
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
                        {/* 显示处理状态 */}
                        {!interview.video_url ? (
                          <span className="px-2 py-0.5 text-xs rounded-full whitespace-nowrap bg-amber-100 text-amber-800">
                            Processing
                          </span>
                        ) : interview.status ? (
                          <span className={`px-2 py-0.5 text-xs rounded-full whitespace-nowrap ${
                            interview.status === 'completed' 
                              ? 'bg-green-100 text-green-800' 
                              : interview.status === 'reviewing'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-slate-100 text-slate-800'
                          }`}>
                            {interview.status}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 text-xs rounded-full whitespace-nowrap bg-green-100 text-green-800">
                            Ready
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
                      {/* Third row: Additional student info (if available) */}
                      {(interview.student_gender || interview.student_grade || interview.student_city || interview.student_financial_aid !== null) && (
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                          {interview.student_gender && (
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                              {interview.student_gender}
                            </span>
                          )}
                          {interview.student_grade && (
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                              {interview.student_grade}
                            </span>
                          )}
                          {interview.student_city && (
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                              📍 {interview.student_city}
                            </span>
                          )}
                          {interview.student_financial_aid !== null && (
                            <span className={`px-2 py-0.5 rounded ${interview.student_financial_aid ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-700'}`}>
                              {interview.student_financial_aid ? '💰 Financial Aid' : 'No Financial Aid'}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto shrink-0">
                      {!interview.video_url && (
                        <Button
                          onClick={() => {
                            // 跳转到重新上传页面
                            window.location.href = `/student/interview/resume?interviewId=${interview.interview_id}&school=${interview.school_code || ''}`
                          }}
                          size="sm"
                          variant="outline"
                          className="w-full sm:w-auto"
                          title="Resume upload if video segments are stored locally"
                        >
                          <Upload className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                          <span className="sm:inline">Resume Upload</span>
                        </Button>
                      )}
                      <Button
                        onClick={() => handleWatchInterview(interview)}
                        size="sm"
                        className="w-full sm:w-auto"
                        disabled={!interview.video_url}
                        title={!interview.video_url ? 'Video is still processing...' : 'Watch interview'}
                      >
                        <Video className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                        <span className="sm:inline">
                          {interview.video_url ? 'Watch' : 'Processing...'}
                        </span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              </>
            )}
          </CardContent>
        </Card>

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
