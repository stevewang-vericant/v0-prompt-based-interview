"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { VideoPlayerWithSubtitles } from "@/components/video-player-with-subtitles"
import { TranscriptionDisplay } from "@/components/transcription/transcription-display"
import { getCurrentUser } from "@/app/actions/auth"
import {
  getInterviewForRating,
  approveScore,
  approveWithOverride,
  revokeApproval,
  type RatingDetailRecord,
} from "@/app/actions/rating"
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Undo2,
} from "lucide-react"
import { format } from "date-fns"

function formatNumber(value: unknown): string {
  if (typeof value === "number" && Number.isFinite(value)) return String(value)
  return "N/A"
}

function toTitleCase(input: string): string {
  return input
    .replace(/_/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

export default function RatingDetailPage() {
  const params = useParams()
  const interviewId = params.interviewId as string

  const [interview, setInterview] = useState<RatingDetailRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [authorized, setAuthorized] = useState(false)

  // Override form state
  const [useOverride, setUseOverride] = useState(false)
  const [overrideScores, setOverrideScores] = useState({
    total_score: "",
    fluency_score: "",
    coherence_score: "",
    vocabulary_score: "",
    grammar_score: "",
    pronunciation_score: "",
  })

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

      const result = await getInterviewForRating(decodeURIComponent(interviewId))
      if (result.success && result.interview) {
        setInterview(result.interview)
        if (result.interview.rater_total_score !== null) {
          setUseOverride(true)
          setOverrideScores({
            total_score: result.interview.rater_total_score?.toString() || "",
            fluency_score: result.interview.rater_fluency_score?.toString() || "",
            coherence_score: result.interview.rater_coherence_score?.toString() || "",
            vocabulary_score: result.interview.rater_vocabulary_score?.toString() || "",
            grammar_score: result.interview.rater_grammar_score?.toString() || "",
            pronunciation_score: result.interview.rater_pronunciation_score?.toString() || "",
          })
        }
      } else {
        setError(result.error || "Failed to load interview")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [interviewId])

  const handleApproveCathoven = async () => {
    if (!interview?.interview_id) return
    setActionLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const result = await approveScore(interview.interview_id)
      if (result.success) {
        setSuccess("Score approved successfully")
        await loadData()
      } else {
        setError(result.error || "Failed to approve score")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setActionLoading(false)
    }
  }

  const handleApproveWithOverride = async () => {
    if (!interview?.interview_id) return

    const totalStr = overrideScores.total_score.trim()
    if (!totalStr) {
      setError("Final Score is required for manual override")
      return
    }
    const totalNum = Number(totalStr)
    if (isNaN(totalNum) || totalNum < 0 || totalNum > 100) {
      setError("Final Score must be a number between 0 and 100")
      return
    }

    setActionLoading(true)
    setError(null)
    setSuccess(null)

    const parseOptional = (val: string) => {
      const trimmed = val.trim()
      if (!trimmed) return null
      const n = Number(trimmed)
      return isNaN(n) ? null : n
    }

    try {
      const result = await approveWithOverride(interview.interview_id, {
        total_score: totalNum,
        fluency_score: parseOptional(overrideScores.fluency_score),
        coherence_score: parseOptional(overrideScores.coherence_score),
        vocabulary_score: parseOptional(overrideScores.vocabulary_score),
        grammar_score: parseOptional(overrideScores.grammar_score),
        pronunciation_score: parseOptional(overrideScores.pronunciation_score),
      })
      if (result.success) {
        setSuccess("Score approved with manual override")
        await loadData()
      } else {
        setError(result.error || "Failed to approve with override")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setActionLoading(false)
    }
  }

  const handleRevoke = async () => {
    if (!interview?.interview_id) return
    setActionLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const result = await revokeApproval(interview.interview_id)
      if (result.success) {
        setSuccess("Approval revoked")
        setUseOverride(false)
        setOverrideScores({
          total_score: "",
          fluency_score: "",
          coherence_score: "",
          vocabulary_score: "",
          grammar_score: "",
          pronunciation_score: "",
        })
        await loadData()
      } else {
        setError(result.error || "Failed to revoke approval")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setActionLoading(false)
    }
  }

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

  if (!authorized || !interview) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" onClick={() => (window.location.href = "/school/rating")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Rating List
        </Button>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || "Interview not found"}</AlertDescription>
        </Alert>
      </div>
    )
  }

  const metadata = (interview.metadata as Record<string, any> | null) || {}
  const cathoven = (metadata.cathoven as Record<string, any> | undefined) || {}
  const responseJson = cathoven.response || null
  const breakdown = (responseJson?.breakdown as Record<string, any> | undefined) || {}
  const breakdownItems = Object.entries(breakdown)
  const vericantLite = (responseJson?.vericant_lite as Record<string, any> | undefined) || {}
  const vericantLiteItems = Object.entries(vericantLite)

  // Map short breakdown keys to readable names and score fields
  const BREAKDOWN_NAMES: Record<string, string> = {
    fc: "Fluency & Coherence",
    gr: "Grammatical Range & Accuracy",
    lr: "Lexical Resource",
    pr: "Pronunciation",
  }

  // Derive per-dimension scores from metadata breakdown when DB fields are null
  const fcBand = breakdown.fc?.band ?? null
  const grBand = breakdown.gr?.band ?? null
  const lrBand = breakdown.lr?.band ?? null
  const prBand = breakdown.pr?.band ?? null

  const displayFluency = interview.fluency_score ?? (typeof fcBand === "number" ? fcBand : null)
  const displayGrammar = interview.grammar_score ?? (typeof grBand === "number" ? grBand : null)
  const displayVocabulary = interview.vocabulary_score ?? (typeof lrBand === "number" ? lrBand : null)
  const displayPronunciation = interview.pronunciation_score ?? (typeof prBand === "number" ? prBand : null)
  const displayTotal = responseJson?.band ?? interview.total_score

  const videoProxyUrl = interview.video_url
    ? `/api/proxy-video?url=${encodeURIComponent(interview.video_url)}`
    : null
  const subtitleProxyUrl = interview.subtitle_url
    ? `/api/proxy-json?url=${encodeURIComponent(interview.subtitle_url)}`
    : null

  return (
    <div className="space-y-6">
      {/* Navigation */}
      <Button variant="ghost" size="sm" onClick={() => (window.location.href = "/school/rating")}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Rating List
      </Button>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {/* Interview info */}
      <div className="rounded-xl border border-black/[0.08] bg-white p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold text-[#1d1d1f]">
              {interview.student_name || interview.student_email || "Unknown Student"}
            </h2>
            <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-[rgba(0,0,0,0.56)]">
              {interview.student_email && <span>{interview.student_email}</span>}
              {interview.school_code && (
                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-800">
                  {interview.school_code}
                </span>
              )}
              <span>{format(new Date(interview.created_at), "MMM dd, yyyy HH:mm")}</span>
            </div>
          </div>
          {interview.score_approved && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-800">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Approved
              {interview.score_approved_at && (
                <span className="text-xs text-emerald-600 ml-1">
                  {format(new Date(interview.score_approved_at), "MMM dd HH:mm")}
                </span>
              )}
            </span>
          )}
        </div>
      </div>

      {/* Main content: Video + Scoring */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Video + Transcript (2/3) */}
        <div className="xl:col-span-2 space-y-4">
          {videoProxyUrl ? (
            <VideoPlayerWithSubtitles
              videoUrl={videoProxyUrl}
              subtitleUrl={subtitleProxyUrl || undefined}
            />
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-[rgba(0,0,0,0.48)]">
                No video available
              </CardContent>
            </Card>
          )}

          {interview.interview_id && (
            <TranscriptionDisplay
              interviewId={interview.interview_id}
            />
          )}
        </div>

        {/* Scoring Panel (1/3) */}
        <div className="space-y-4">
          {/* Rater Action — pinned at top so rater can act while watching */}
          <Card className="border-[#0071e3]/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                {interview.score_approved ? "Approval Status" : "Rater Action"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {interview.score_approved ? (
                <>
                  <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 space-y-1">
                    <p className="text-sm font-medium text-emerald-800">Score Approved</p>
                    {interview.score_approved_by && (
                      <p className="text-xs text-emerald-600">By: {interview.score_approved_by}</p>
                    )}
                    {interview.score_approved_at && (
                      <p className="text-xs text-emerald-600">
                        At: {format(new Date(interview.score_approved_at), "MMM dd, yyyy HH:mm")}
                      </p>
                    )}
                    {interview.rater_total_score !== null && (
                      <div className="mt-2 pt-2 border-t border-emerald-200">
                        <p className="text-xs text-emerald-700 font-medium">Manual Override Scores:</p>
                        <div className="grid grid-cols-2 gap-1 mt-1 text-xs text-emerald-700">
                          <span>Final: {interview.rater_total_score.toFixed(2)}</span>
                          {interview.rater_fluency_score !== null && (
                            <span>Fluency: {interview.rater_fluency_score.toFixed(2)}</span>
                          )}
                          {interview.rater_coherence_score !== null && (
                            <span>Coherence: {interview.rater_coherence_score.toFixed(2)}</span>
                          )}
                          {interview.rater_grammar_score !== null && (
                            <span>Grammar: {interview.rater_grammar_score.toFixed(2)}</span>
                          )}
                          {interview.rater_pronunciation_score !== null && (
                            <span>Pronunciation: {interview.rater_pronunciation_score.toFixed(2)}</span>
                          )}
                          {interview.rater_vocabulary_score !== null && (
                            <span>Lexical: {interview.rater_vocabulary_score.toFixed(2)}</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-amber-700 border-amber-200 hover:bg-amber-50"
                    onClick={handleRevoke}
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Undo2 className="h-4 w-4 mr-2" />
                    )}
                    Revoke Approval
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    className="w-full"
                    onClick={handleApproveCathoven}
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                    )}
                    Approve AI Score
                  </Button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-black/[0.08]" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-2 text-[rgba(0,0,0,0.36)]">or manual override</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setUseOverride(!useOverride)}
                    className="w-full text-left text-sm font-medium text-[#0071e3] hover:text-[#0067cf] transition-colors"
                  >
                    {useOverride ? "Hide manual score form" : "Enter manual scores"}
                  </button>

                  {useOverride && (
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="total" className="text-xs">
                          Final Score <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="total"
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          placeholder="e.g. 88"
                          value={overrideScores.total_score}
                          onChange={(e) =>
                            setOverrideScores((s) => ({ ...s, total_score: e.target.value }))
                          }
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1.5">
                          <Label htmlFor="fluency" className="text-xs">Fluency & Coherence</Label>
                          <Input
                            id="fluency"
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            placeholder="0-100"
                            value={overrideScores.fluency_score}
                            onChange={(e) =>
                              setOverrideScores((s) => ({ ...s, fluency_score: e.target.value }))
                            }
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="grammar" className="text-xs">Grammar Range & Accuracy</Label>
                          <Input
                            id="grammar"
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            placeholder="0-100"
                            value={overrideScores.grammar_score}
                            onChange={(e) =>
                              setOverrideScores((s) => ({ ...s, grammar_score: e.target.value }))
                            }
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="pronunciation" className="text-xs">Pronunciation</Label>
                          <Input
                            id="pronunciation"
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            placeholder="0-100"
                            value={overrideScores.pronunciation_score}
                            onChange={(e) =>
                              setOverrideScores((s) => ({
                                ...s,
                                pronunciation_score: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="vocabulary" className="text-xs">Lexical Resource</Label>
                          <Input
                            id="vocabulary"
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            placeholder="0-100"
                            value={overrideScores.vocabulary_score}
                            onChange={(e) =>
                              setOverrideScores((s) => ({
                                ...s,
                                vocabulary_score: e.target.value,
                              }))
                            }
                          />
                        </div>
                      </div>

                      <Button
                        className="w-full"
                        variant="default"
                        onClick={handleApproveWithOverride}
                        disabled={actionLoading || !overrideScores.total_score.trim()}
                      >
                        {actionLoading ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                        )}
                        Approve with Manual Score
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Cathoven Score Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Cathoven AI Score</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-3xl font-bold text-[#1d1d1f]">
                {displayTotal != null ? (typeof displayTotal === "number" ? displayTotal : Number(displayTotal)) : "N/A"}
              </div>
              <div className="text-sm text-[rgba(0,0,0,0.56)]">
                CEFR: {responseJson?.cefr || "N/A"}
              </div>
              {!responseJson && (
                <div className="rounded bg-amber-50 border border-amber-200 p-2 text-xs text-amber-700">
                  Cathoven has not been called for this interview yet.
                </div>
              )}
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="rounded bg-[#f5f5f7] p-2 col-span-2">
                  <div className="text-xs text-[rgba(0,0,0,0.48)]">Fluency & Coherence</div>
                  <div className="font-medium">{displayFluency != null ? displayFluency : "N/A"}</div>
                </div>
                <div className="rounded bg-[#f5f5f7] p-2 col-span-2">
                  <div className="text-xs text-[rgba(0,0,0,0.48)]">Grammatical Range & Accuracy</div>
                  <div className="font-medium">{displayGrammar != null ? displayGrammar : "N/A"}</div>
                </div>
                <div className="rounded bg-[#f5f5f7] p-2 col-span-2">
                  <div className="text-xs text-[rgba(0,0,0,0.48)]">Pronunciation</div>
                  <div className="font-medium">{displayPronunciation != null ? displayPronunciation : "N/A"}</div>
                </div>
                <div className="rounded bg-[#f5f5f7] p-2 col-span-2">
                  <div className="text-xs text-[rgba(0,0,0,0.48)]">Lexical Resource</div>
                  <div className="font-medium">{displayVocabulary != null ? displayVocabulary : "N/A"}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Breakdown */}
          {breakdownItems.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {breakdownItems.map(([key, value]) => {
                  const item = value as Record<string, any>
                  const itemBreakdown = (item?.breakdown as Record<string, any> | undefined) || {}
                  const displayName = BREAKDOWN_NAMES[key] || item?.name || toTitleCase(key)
                  return (
                    <div key={key} className="rounded border border-black/[0.08] p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-medium text-sm">{displayName}</div>
                        <div className="text-sm">
                          Band: <span className="font-semibold">{formatNumber(item?.band)}</span>
                        </div>
                      </div>
                      {Object.keys(itemBreakdown).length > 0 && (
                        <div className="mt-2 grid grid-cols-2 gap-1.5 text-xs">
                          {Object.entries(itemBreakdown).map(([mk, mv]) => (
                            <div key={mk} className="rounded bg-[#f5f5f7] p-1.5">
                              {toTitleCase(mk)}: {formatNumber(mv)}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          )}

          {/* Vericant Lite */}
          {vericantLiteItems.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Vericant Lite Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-1.5 text-xs">
                  {vericantLiteItems.map(([mk, mv]) => (
                    <div key={mk} className="rounded bg-[#f5f5f7] p-1.5">
                      {toTitleCase(mk)}: {formatNumber(mv)}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

        </div>
      </div>
    </div>
  )
}
