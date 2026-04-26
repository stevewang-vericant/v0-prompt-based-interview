"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { getCurrentUser } from "@/app/actions/auth"
import { getRatingInterviews, type RatingInterviewRecord } from "@/app/actions/rating"
import { AlertCircle, Search, RefreshCw, CheckCircle2, Clock, PenLine } from "lucide-react"
import { format } from "date-fns"

type FilterStatus = "all" | "pending" | "approved"

export default function RatingPage() {
  const [interviews, setInterviews] = useState<RatingInterviewRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all")
  const [authorized, setAuthorized] = useState(false)

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      const userResult = await getCurrentUser()
      if (!userResult.success || !userResult.user) {
        window.location.href = "/school/login"
        return
      }

      if (!userResult.user.is_rater && !userResult.user.school.is_super_admin) {
        setError("Access denied: rater role required")
        setLoading(false)
        return
      }

      setAuthorized(true)

      const result = await getRatingInterviews()
      if (result.success && result.interviews) {
        setInterviews(result.interviews)
      } else {
        setError(result.error || "Failed to load interviews")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleRefresh = () => {
    setIsRefreshing(true)
    loadData()
  }

  const getApprovalBadge = (interview: RatingInterviewRecord) => {
    if (!interview.score_approved) {
      return {
        label: "Pending",
        className: "bg-[#f5f5f7] text-[rgba(0,0,0,0.56)]",
        icon: Clock,
      }
    }
    if (interview.rater_total_score !== null) {
      return {
        label: "Manual",
        className: "bg-blue-100 text-blue-800",
        icon: PenLine,
      }
    }
    return {
      label: "AI Score",
      className: "bg-emerald-100 text-emerald-800",
      icon: CheckCircle2,
    }
  }

  const filteredInterviews = interviews.filter((interview) => {
    // Status filter
    if (filterStatus === "pending" && interview.score_approved) return false
    if (filterStatus === "approved" && !interview.score_approved) return false

    // Search filter
    if (!searchQuery.trim()) return true
    const query = searchQuery.toLowerCase()
    return (
      (interview.student_name || "").toLowerCase().includes(query) ||
      (interview.student_email || "").toLowerCase().includes(query) ||
      (interview.interview_id || "").toLowerCase().includes(query) ||
      (interview.school_code || "").toLowerCase().includes(query) ||
      (interview.school_name || "").toLowerCase().includes(query)
    )
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#0071e3] border-t-transparent mx-auto"></div>
          <p className="mt-2 text-sm text-[rgba(0,0,0,0.56)]">Loading...</p>
        </div>
      </div>
    )
  }

  if (!authorized) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Access denied: rater role required.</AlertDescription>
        </Alert>
      </div>
    )
  }

  const pendingCount = interviews.filter((i) => !i.score_approved).length
  const approvedCount = interviews.filter((i) => i.score_approved).length

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <Card className="py-3">
          <CardContent className="p-0 text-center">
            <div className="text-lg sm:text-2xl font-bold">{interviews.length}</div>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card className="py-3">
          <CardContent className="p-0 text-center">
            <div className="text-lg sm:text-2xl font-bold text-amber-600">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card className="py-3">
          <CardContent className="p-0 text-center">
            <div className="text-lg sm:text-2xl font-bold text-emerald-600">{approvedCount}</div>
            <p className="text-xs text-muted-foreground">Approved</p>
          </CardContent>
        </Card>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[rgba(0,0,0,0.36)]" />
            <Input
              type="text"
              placeholder="Search name, email, school..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          {searchQuery && (
            <Button variant="ghost" size="sm" onClick={() => setSearchQuery("")}>
              Clear
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          {(["all", "pending", "approved"] as FilterStatus[]).map((status) => (
            <Button
              key={status}
              variant={filterStatus === status ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus(status)}
              className="capitalize"
            >
              {status}
            </Button>
          ))}
          <Button onClick={handleRefresh} disabled={isRefreshing} variant="outline" size="sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Interview list */}
      {filteredInterviews.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-[rgba(0,0,0,0.56)]">
            {searchQuery || filterStatus !== "all"
              ? "No interviews match your filters"
              : "No interviews found"}
          </p>
        </div>
      ) : (
        <div>
          {searchQuery && (
            <div className="mb-4 text-sm text-[rgba(0,0,0,0.56)]">
              Found <strong>{filteredInterviews.length}</strong> interview
              {filteredInterviews.length !== 1 ? "s" : ""}
            </div>
          )}

          {/* Table header */}
          <div className="hidden lg:grid grid-cols-[minmax(0,1.5fr)_120px_160px_180px_100px] items-center px-4 py-2 text-xs font-medium uppercase tracking-wide text-[rgba(0,0,0,0.44)] border-y border-black/[0.08]">
            <span>Candidate</span>
            <span>School</span>
            <span>Score</span>
            <span>Status</span>
            <span className="text-right">Action</span>
          </div>

          <div className="divide-y divide-black/[0.06] border-y border-black/[0.08]">
            {filteredInterviews.map((interview) => {
              const badge = getApprovalBadge(interview)
              const BadgeIcon = badge.icon
              const displayScore = interview.rater_total_score ?? interview.total_score

              return (
                <div
                  key={interview.id}
                  className="px-4 py-4 transition-colors hover:bg-black/[0.015]"
                >
                  <div className="grid gap-3 lg:grid-cols-[minmax(0,1.5fr)_120px_160px_180px_100px] lg:items-center">
                    {/* Candidate */}
                    <div className="min-w-0">
                      <p className="font-semibold text-[#1d1d1f] truncate text-sm">
                        {interview.student_name || interview.student_email || "Unknown"}
                      </p>
                      {interview.student_name && (
                        <p className="text-xs text-[rgba(0,0,0,0.48)] truncate">
                          {interview.student_email}
                        </p>
                      )}
                      <p className="text-xs text-[rgba(0,0,0,0.36)] mt-0.5">
                        {format(new Date(interview.created_at), "MMM dd, yyyy HH:mm")}
                      </p>
                    </div>

                    {/* School */}
                    <div>
                      <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-800">
                        {interview.school_code || "—"}
                      </span>
                    </div>

                    {/* Score */}
                    <div className="flex items-center gap-2">
                      {displayScore !== null ? (
                        <span className="font-semibold text-sm text-[#1d1d1f]">
                          {displayScore.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-xs text-[rgba(0,0,0,0.36)]">N/A</span>
                      )}
                      {interview.score_approved &&
                        interview.rater_total_score !== null &&
                        interview.total_score !== null && (
                          <span className="text-xs text-[rgba(0,0,0,0.36)] line-through">
                            AI: {interview.total_score.toFixed(2)}
                          </span>
                        )}
                      {!interview.score_approved && interview.total_score !== null && (
                        <span className="text-xs text-[rgba(0,0,0,0.36)]">(AI)</span>
                      )}
                    </div>

                    {/* Status */}
                    <div>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.className}`}
                      >
                        <BadgeIcon className="h-3 w-3" />
                        {badge.label}
                      </span>
                      {interview.score_approved_at && (
                        <p className="text-xs text-[rgba(0,0,0,0.36)] mt-0.5">
                          {format(new Date(interview.score_approved_at), "MMM dd HH:mm")}
                        </p>
                      )}
                    </div>

                    {/* Action */}
                    <div className="lg:text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (interview.interview_id) {
                            window.location.href = `/school/rating/${encodeURIComponent(interview.interview_id)}`
                          }
                        }}
                        disabled={!interview.interview_id}
                      >
                        Review
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
