"use client"

import { useEffect, useState, Suspense } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { getCurrentUser } from "@/app/actions/auth"
import {
  getParentInterviewsBySchoolCode,
  getStudentInterviewsForSchool,
  setParentInterviewMatch,
  type ParentInterviewRecord,
  type StudentInterviewOption,
} from "@/app/actions/parent-interviews"
import {
  Video,
  Calendar,
  Clock,
  Mail,
  RefreshCw,
  AlertCircle,
  Copy,
  Search,
  Link as LinkIcon,
  Link2,
  Unlink,
  CheckCircle,
  Globe,
  UsersRound,
  UserCheck,
  Shield,
} from "lucide-react"
import { format } from "date-fns"

function ParentInterviewsContent() {
  const [interviews, setInterviews] = useState<ParentInterviewRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [schoolInfo, setSchoolInfo] = useState<{ code: string; name: string; is_super_admin: boolean } | null>(null)
  const [authError, setAuthError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [linkCopied, setLinkCopied] = useState(false)

  // Manual student-linking panel state
  const [linkingId, setLinkingId] = useState<string | null>(null)
  // School code whose students we search when linking (the parent interview's own
  // school, so a super admin can link across schools).
  const [linkingSchoolCode, setLinkingSchoolCode] = useState<string | null>(null)
  const [studentOptions, setStudentOptions] = useState<StudentInterviewOption[]>([])
  const [studentSearch, setStudentSearch] = useState("")
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [savingMatchId, setSavingMatchId] = useState<string | null>(null)
  const [linkError, setLinkError] = useState<string | null>(null)

  const loadInterviews = async () => {
    try {
      setLoading(true)
      setError(null)
      const userResult = await getCurrentUser()
      if (!userResult.success || !userResult.user) {
        setAuthError(userResult.error || "Not authenticated")
        setTimeout(() => (window.location.href = "/school/login"), 2000)
        return
      }
      const code = userResult.user.school.code
      if (!code) {
        setAuthError("School code is missing")
        return
      }
      setSchoolInfo({
        code,
        name: userResult.user.school.name,
        is_super_admin: userResult.user.school.is_super_admin ?? false,
      })

      const result = await getParentInterviewsBySchoolCode(code, 100, 0)
      if (result.success && result.interviews) {
        setInterviews(result.interviews)
      } else {
        setError(result.error || "Failed to load parent interviews")
      }
    } catch (err) {
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

  const handleCopyLink = async () => {
    if (!schoolInfo) return
    const url = `${window.location.origin}/parent/interview?school=${schoolInfo.code}`
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url)
      } else {
        const textArea = document.createElement("textarea")
        textArea.value = url
        textArea.style.position = "fixed"
        textArea.style.left = "-999999px"
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        document.execCommand("copy")
        document.body.removeChild(textArea)
      }
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    } catch {
      alert("Could not copy link:\n" + url)
    }
  }

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "N/A"
    const minutes = Math.floor(seconds / 60)
    const remaining = Math.floor(seconds % 60)
    return `${minutes}:${remaining.toString().padStart(2, "0")}`
  }

  const getProgressBadge = (interview: ParentInterviewRecord): { label: string; className: string } => {
    if (interview.status === "failed") return { label: "Processing Failed", className: "bg-red-100 text-red-800" }
    if (!interview.video_url) {
      if (interview.responseCount > 0) return { label: "Processing", className: "bg-amber-100 text-amber-800" }
      return { label: "Not Started", className: "bg-[#f5f5f7] text-[#1d1d1f]" }
    }
    return { label: "Completed", className: "bg-green-100 text-green-800" }
  }

  const handleWatch = (interview: ParentInterviewRecord) => {
    if (!interview.video_url) return
    const params = new URLSearchParams({
      videoUrl: `/api/proxy-video?url=${encodeURIComponent(interview.video_url)}`,
      interviewId: interview.interview_id || "",
    })
    if (interview.subtitle_url) {
      params.append("subtitleUrl", `/api/proxy-json?url=${encodeURIComponent(interview.subtitle_url)}`)
    }
    if (interview.caption_url) {
      params.append("captionUrl", `/api/proxy-json?url=${encodeURIComponent(interview.caption_url)}`)
    }
    if (interview.parent_name) params.append("parentName", interview.parent_name)
    if (interview.parent_email) params.append("parentEmail", interview.parent_email)
    if (interview.parent_relationship) params.append("relationship", interview.parent_relationship)
    if (interview.response_language) params.append("language", interview.response_language)
    if (interview.student_name) params.append("studentName", interview.student_name)
    if (interview.video_with_prep_url) params.append("videoWithPrepUrl", interview.video_with_prep_url)
    if (interview.matched_interview_id && interview.matched_video_url) {
      params.append("matchedInterviewId", interview.matched_interview_id)
      params.append("matchedVideoUrl", interview.matched_video_url)
      if (interview.matched_subtitle_url) params.append("matchedSubtitleUrl", interview.matched_subtitle_url)
      if (interview.matched_student_name) params.append("matchedStudentName", interview.matched_student_name)
    }
    window.location.href = `/school/watch-parent?${params.toString()}`
  }

  const loadStudentOptions = async (query: string, schoolCode?: string | null) => {
    const targetCode = schoolCode ?? linkingSchoolCode ?? schoolInfo?.code
    if (!targetCode) return
    try {
      setLoadingStudents(true)
      setLinkError(null)
      const result = await getStudentInterviewsForSchool(targetCode, query)
      if (result.success && result.interviews) {
        setStudentOptions(result.interviews)
      } else {
        setLinkError(result.error || "Failed to load student interviews")
      }
    } catch (err) {
      setLinkError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoadingStudents(false)
    }
  }

  const openLinkPanel = (interview: ParentInterviewRecord) => {
    if (linkingId === interview.interview_id) {
      setLinkingId(null)
      setLinkingSchoolCode(null)
      return
    }
    const targetCode = interview.school_code ?? schoolInfo?.code ?? null
    setLinkingId(interview.interview_id)
    setLinkingSchoolCode(targetCode)
    setStudentSearch("")
    setStudentOptions([])
    setLinkError(null)
    loadStudentOptions("", targetCode)
  }

  // Debounced reload of student options while the link panel is open.
  useEffect(() => {
    if (!linkingId) return
    const handle = setTimeout(() => loadStudentOptions(studentSearch, linkingSchoolCode), 300)
    return () => clearTimeout(handle)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentSearch, linkingId, linkingSchoolCode])

  const handleSelectStudent = async (
    parentInterviewId: string | null,
    studentInterviewId: string | null,
  ) => {
    if (!parentInterviewId) return
    try {
      setSavingMatchId(parentInterviewId)
      setLinkError(null)
      const result = await setParentInterviewMatch(parentInterviewId, studentInterviewId)
      if (!result.success) {
        setLinkError(result.error || "Failed to update link")
        return
      }
      setLinkingId(null)
      setLinkingSchoolCode(null)
      await loadInterviews()
    } catch (err) {
      setLinkError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setSavingMatchId(null)
    }
  }

  const filteredInterviews = interviews.filter((interview) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      (interview.parent_name || "").toLowerCase().includes(q) ||
      (interview.parent_email || "").toLowerCase().includes(q) ||
      (interview.student_name || "").toLowerCase().includes(q) ||
      (interview.interview_id || "").toLowerCase().includes(q)
    )
  })

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
          <CardContent>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Authentication Error</AlertTitle>
              <AlertDescription>{authError}</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={handleRefresh} disabled={isRefreshing} variant="outline" size="sm">
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Share link (hidden for super admins, mirroring the student dashboard) */}
      {schoolInfo?.is_super_admin ? (
        <Alert className="mb-6 bg-purple-50 border-purple-200">
          <Shield className="h-4 w-4 text-purple-600" />
          <AlertTitle className="text-purple-900">Super Administrator Mode</AlertTitle>
          <AlertDescription className="text-purple-700">
            You can view parent interviews from all schools. Each interview shows the school it belongs to. The parent interview link belongs to each individual school, so it is not shown here.
          </AlertDescription>
        </Alert>
      ) : (
        <Card className="mb-6 bg-blue-50 border-blue-200">
          <CardHeader className="space-y-2">
            <div className="flex items-center gap-2">
              <LinkIcon className="h-5 w-5 text-[#0071e3]" />
              <CardTitle className="text-blue-900 text-sm sm:text-base">Parent Interview Link</CardTitle>
            </div>
            <CardDescription className="text-blue-700 text-xs sm:text-sm">
              Share this link with parents. They can complete a video interview in their preferred language.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-2">
            <input
              type="text"
              readOnly
              value={typeof window !== "undefined" && schoolInfo ? `${window.location.origin}/parent/interview?school=${schoolInfo.code}` : ""}
              className="w-full bg-white rounded-lg border border-blue-300 px-4 py-3 font-mono text-xs sm:text-sm text-[#1d1d1f] break-all focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-text"
              onClick={(e) => {
                const target = e.target as HTMLInputElement
                target.select()
                target.setSelectionRange(0, 99999)
              }}
            />
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
                  Copy Parent Interview Link
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-6">
        <Card className="py-3">
          <CardContent className="p-0 text-center">
            <div className="text-lg sm:text-2xl font-bold">{interviews.length}</div>
            <p className="text-xs text-muted-foreground">Total Parent Interviews</p>
          </CardContent>
        </Card>
        <Card className="py-3">
          <CardContent className="p-0 text-center">
            <div className="text-lg sm:text-2xl font-bold">
              {interviews.filter((i) => i.matched_interview_id).length}
            </div>
            <p className="text-xs text-muted-foreground">Matched to a Student</p>
          </CardContent>
        </Card>
      </div>

      {/* List */}
      <section className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-[#1d1d1f]">Parent Interviews</h2>
            <p className="text-sm text-[rgba(0,0,0,0.56)]">Review parent video interviews</p>
          </div>
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[rgba(0,0,0,0.36)]" />
            <Input
              type="text"
              placeholder="Search parent, student, ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-[rgba(0,0,0,0.56)]">Loading parent interviews...</span>
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
              <UsersRound className="mx-auto h-12 w-12 text-[rgba(0,0,0,0.36)]" />
              <p className="mt-4 text-[rgba(0,0,0,0.56)]">
                {searchQuery ? "No parent interviews match your search" : "No parent interviews yet"}
              </p>
              {!searchQuery && !schoolInfo?.is_super_admin && (
                <p className="text-sm text-[rgba(0,0,0,0.48)] mt-2">
                  Share the parent interview link above to collect parent interviews.
                </p>
              )}
            </div>
          ) : (
            <div className="divide-y divide-black/[0.06] border-y border-black/[0.08]">
              {filteredInterviews.map((interview) => {
                const badge = getProgressBadge(interview)
                return (
                  <div key={interview.id} className="px-4 py-4 sm:px-5 hover:bg-black/[0.015]">
                    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_200px_160px] lg:items-center">
                      <div className="min-w-0 space-y-2">
                        <div className="flex items-center gap-2">
                          <Mail className="h-3.5 w-3.5 text-[rgba(0,0,0,0.36)]" />
                          <p className="truncate text-base font-semibold text-[#1d1d1f]">
                            {interview.parent_name || interview.parent_email || "Unknown Parent"}
                          </p>
                          {interview.parent_relationship && (
                            <span className="rounded-md bg-black/[0.03] px-2 py-0.5 text-xs text-[#1d1d1f]">
                              {interview.parent_relationship}
                            </span>
                          )}
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
                          {interview.response_language && (
                            <span className="inline-flex items-center gap-1.5">
                              <Globe className="h-3.5 w-3.5" />
                              {interview.response_language}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 text-xs">
                          {schoolInfo?.is_super_admin && interview.school_name && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-purple-100 px-2 py-0.5 text-purple-700">
                              <Shield className="h-3 w-3" />
                              {interview.school_name}
                            </span>
                          )}
                          {interview.student_name && (
                            <span className="rounded-md bg-black/[0.03] px-2 py-0.5 text-[#1d1d1f]">
                              Student (entered): {interview.student_name}
                            </span>
                          )}
                          {interview.matched_interview_id ? (
                            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-2 py-0.5 text-emerald-700">
                              <UserCheck className="h-3 w-3" />
                              {interview.matched_manually
                                ? `Linked: ${interview.matched_student_name || "student interview"} (manual)`
                                : `Matched: ${interview.matched_student_name || "student interview"}`}
                            </span>
                          ) : (
                            <span className="rounded-md bg-black/[0.03] px-2 py-0.5 text-[rgba(0,0,0,0.56)]">
                              No student match
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${badge.className}`}>
                          {badge.label}
                        </span>
                      </div>

                      <div className="flex flex-col items-stretch gap-2 lg:justify-self-end">
                        <Button
                          onClick={() => handleWatch(interview)}
                          size="sm"
                          className="border border-[#0071e3]/80 bg-[#0071e3] text-white shadow-sm hover:bg-[#0067cf] disabled:border-[#0071e3]/20 disabled:bg-white disabled:text-[rgba(0,0,0,0.42)] disabled:opacity-100"
                          disabled={!interview.video_url}
                          title={interview.video_url ? "Watch interview" : "Video is still processing..."}
                        >
                          <Video className="mr-1.5 h-3.5 w-3.5" />
                          {interview.video_url ? "Watch" : "Processing"}
                        </Button>
                        <Button
                          onClick={() => openLinkPanel(interview)}
                          size="sm"
                          variant="outline"
                          title="Manually link this parent interview to a student interview"
                        >
                          <Link2 className="mr-1.5 h-3.5 w-3.5" />
                          {interview.matched_interview_id ? "Change link" : "Link student"}
                        </Button>
                      </div>
                    </div>

                    {/* Manual student-linking panel */}
                    {linkingId === interview.interview_id && (
                      <div className="mt-4 rounded-lg border border-black/[0.08] bg-[#fafafa] p-4 space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-[#1d1d1f]">
                            Link "{interview.parent_name || interview.parent_email || "this parent"}" to a student interview
                          </p>
                          {interview.matched_interview_id && (
                            <Button
                              onClick={() => handleSelectStudent(interview.interview_id, null)}
                              size="sm"
                              variant="ghost"
                              className="text-red-600 hover:bg-red-50 hover:text-red-700"
                              disabled={savingMatchId === interview.interview_id}
                            >
                              <Unlink className="mr-1.5 h-3.5 w-3.5" />
                              Unlink
                            </Button>
                          )}
                        </div>

                        {interview.matched_interview_id && (
                          <p className="text-xs text-[rgba(0,0,0,0.56)]">
                            Currently linked to: <span className="font-medium">{interview.matched_student_name || interview.matched_interview_id}</span>
                          </p>
                        )}

                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[rgba(0,0,0,0.36)]" />
                          <Input
                            type="text"
                            placeholder={
                              schoolInfo?.is_super_admin
                                ? "Search student by name or email (all schools)..."
                                : "Search student by name or email..."
                            }
                            value={studentSearch}
                            onChange={(e) => setStudentSearch(e.target.value)}
                            className="pl-10"
                          />
                        </div>

                        {linkError && <p className="text-sm text-red-600">{linkError}</p>}

                        <div className="max-h-64 overflow-y-auto rounded-md border border-black/[0.06] bg-white divide-y divide-black/[0.05]">
                          {loadingStudents ? (
                            <div className="flex items-center justify-center py-6">
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                            </div>
                          ) : studentOptions.length === 0 ? (
                            <p className="px-3 py-6 text-center text-sm text-[rgba(0,0,0,0.48)]">
                              No student interviews found
                            </p>
                          ) : (
                            studentOptions.map((option) => {
                              const isCurrent = option.interview_id === interview.matched_interview_id
                              return (
                                <button
                                  key={option.interview_id}
                                  type="button"
                                  onClick={() => handleSelectStudent(interview.interview_id, option.interview_id)}
                                  disabled={savingMatchId === interview.interview_id || isCurrent}
                                  className={`flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left hover:bg-blue-50 disabled:cursor-not-allowed ${
                                    isCurrent ? "bg-emerald-50" : ""
                                  }`}
                                >
                                  <span className="min-w-0">
                                    <span className="flex items-center gap-2">
                                      <span className="truncate text-sm font-medium text-[#1d1d1f]">
                                        {option.student_name || "Unknown student"}
                                      </span>
                                      {schoolInfo?.is_super_admin && option.school_name && (
                                        <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-purple-100 px-1.5 py-0.5 text-[10px] text-purple-700">
                                          <Shield className="h-2.5 w-2.5" />
                                          {option.school_name}
                                        </span>
                                      )}
                                    </span>
                                    <span className="block truncate text-xs text-[rgba(0,0,0,0.56)]">
                                      {option.student_email || "No email"} · {format(new Date(option.created_at), "MMM dd, yyyy")}
                                    </span>
                                  </span>
                                  {isCurrent ? (
                                    <span className="inline-flex items-center gap-1 whitespace-nowrap text-xs font-medium text-emerald-700">
                                      <CheckCircle className="h-3.5 w-3.5" /> Linked
                                    </span>
                                  ) : (
                                    <span className="whitespace-nowrap text-xs font-medium text-[#0071e3]">Select</span>
                                  )}
                                </button>
                              )
                            })
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

export default function ParentInterviewsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-[#f5f5f7]">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#0071e3] border-t-transparent"></div>
        </div>
      }
    >
      <ParentInterviewsContent />
    </Suspense>
  )
}
