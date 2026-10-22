"use client"

import { useEffect, useMemo, useState } from "react"
import { Check, RefreshCw, Search, X } from "lucide-react"
import {
  listIdVerifications,
  reviewIdVerification,
  type IdVerificationRecord,
} from "@/app/actions/id-verification"
import { mediaProxyUrl } from "@/lib/id-verification-client"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

function formatDate(value: string | null): string {
  return value ? new Date(value).toLocaleString() : "—"
}

function statusLabel(status: string): string {
  if (status === "approved") return "Approved"
  if (status === "rejected") return "Rejected"
  return "Needs review"
}

function statusClass(status: string): string {
  if (status === "approved") return "bg-green-100 text-green-800"
  if (status === "rejected") return "bg-red-100 text-red-800"
  return "bg-amber-100 text-amber-800"
}

function PhotoFrame({
  label,
  url,
}: {
  label: string
  url: string | null
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-[#1d1d1f]">{label}</p>
      <div className="flex min-h-64 items-center justify-center overflow-hidden rounded-xl border border-black/[0.08] bg-[#f5f5f7]">
        {url ? (
          // B2 objects are loaded through the existing media proxy.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={mediaProxyUrl(url)}
            alt={label}
            className="max-h-[420px] w-full object-contain"
          />
        ) : (
          <p className="px-6 text-center text-sm text-[rgba(0,0,0,0.48)]">Not available yet</p>
        )}
      </div>
    </div>
  )
}

export default function IdVerificationPage() {
  const [records, setRecords] = useState<IdVerificationRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState("pending")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [note, setNote] = useState("")
  const [saving, setSaving] = useState(false)

  const loadRecords = async (nextStatus = status, nextQuery = query) => {
    setLoading(true)
    setError(null)
    const result = await listIdVerifications({ status: nextStatus, query: nextQuery })
    if (result.success && result.records) {
      setRecords(result.records)
      setSelectedId((current) => {
        if (current && result.records?.some((record) => record.id === current)) return current
        return result.records?.[0]?.id || null
      })
    } else {
      setError(result.error || "Failed to load ID checks")
      setRecords([])
      setSelectedId(null)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadRecords("pending", "")
    // Initial load only. Filters submit explicitly so typing does not refetch each key.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const selected = useMemo(
    () => records.find((record) => record.id === selectedId) || null,
    [records, selectedId],
  )

  useEffect(() => {
    setNote(selected?.note || "")
  }, [selected?.id, selected?.note])

  const decide = async (decision: "approved" | "rejected") => {
    if (!selected) return
    setSaving(true)
    setError(null)
    setNotice(null)
    const result = await reviewIdVerification({
      interviewDbId: selected.id,
      decision,
      note: decision === "rejected" ? note : null,
    })
    setSaving(false)
    if (!result.success) {
      setError(result.error || "Could not save the decision.")
      return
    }
    setNotice(decision === "approved" ? "Student approved." : "Student rejected.")
    await loadRecords()
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-[#1d1d1f]">Compare ID photo and interview</h2>
          <p className="mt-1 text-sm text-[rgba(0,0,0,0.56)]">
            Approve the student when the person holding the ID matches the interview screenshot.
          </p>
        </div>
        <Button variant="outline" onClick={() => loadRecords()} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[rgba(0,0,0,0.36)]" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") loadRecords(status, query)
            }}
            placeholder="Search name, email, school, or interview ID"
            className="pl-10"
          />
        </div>
        <Select
          value={status}
          onValueChange={(value) => {
            setStatus(value)
            loadRecords(value, query)
          }}
        >
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Needs review</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="all">All</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={() => loadRecords(status, query)}>
          Search
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {notice && (
        <Alert>
          <AlertDescription>{notice}</AlertDescription>
        </Alert>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <div className="overflow-hidden rounded-2xl border border-black/[0.08] bg-white">
          {loading && records.length === 0 ? (
            <p className="px-4 py-8 text-sm text-[rgba(0,0,0,0.48)]">Loading ID checks...</p>
          ) : records.length === 0 ? (
            <p className="px-4 py-8 text-sm text-[rgba(0,0,0,0.48)]">No ID checks in this view.</p>
          ) : (
            <ul className="divide-y divide-black/[0.06]">
              {records.map((record) => {
                const active = record.id === selectedId
                return (
                  <li key={record.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(record.id)}
                      className={`w-full px-4 py-3 text-left transition-colors ${
                        active ? "bg-[#0071e3]/10" : "hover:bg-black/[0.03]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-[#1d1d1f]">{record.studentName}</p>
                          <p className="truncate text-xs text-[rgba(0,0,0,0.48)]">{record.studentEmail}</p>
                          <p className="truncate text-xs text-[rgba(0,0,0,0.48)]">{record.schoolName}</p>
                        </div>
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${statusClass(record.status)}`}>
                          {statusLabel(record.status)}
                        </span>
                      </div>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-black/[0.08] bg-white p-5">
          {!selected ? (
            <p className="py-16 text-center text-sm text-[rgba(0,0,0,0.48)]">
              Select a student to compare the ID photo and the interview screenshot.
            </p>
          ) : (
            <div className="space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-[#1d1d1f]">{selected.studentName}</h3>
                  <p className="text-sm text-[rgba(0,0,0,0.56)]">{selected.studentEmail}</p>
                  <p className="text-sm text-[rgba(0,0,0,0.56)]">
                    {selected.schoolName}
                    {selected.schoolCode ? ` · ${selected.schoolCode}` : ""}
                  </p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClass(selected.status)}`}>
                  {statusLabel(selected.status)}
                </span>
              </div>

              <dl className="grid gap-2 text-xs text-[rgba(0,0,0,0.56)] sm:grid-cols-2">
                <div>
                  <dt className="text-[rgba(0,0,0,0.4)]">Interview</dt>
                  <dd className="break-all text-[#1d1d1f]">{selected.interviewId}</dd>
                </div>
                <div>
                  <dt className="text-[rgba(0,0,0,0.4)]">Submitted</dt>
                  <dd className="text-[#1d1d1f]">{formatDate(selected.completedAt || selected.createdAt)}</dd>
                </div>
                <div>
                  <dt className="text-[rgba(0,0,0,0.4)]">Reviewed</dt>
                  <dd className="text-[#1d1d1f]">
                    {selected.reviewedAt
                      ? `${formatDate(selected.reviewedAt)}${selected.reviewedBy ? ` · ${selected.reviewedBy}` : ""}`
                      : "Not reviewed"}
                  </dd>
                </div>
              </dl>

              <div className="grid gap-4 md:grid-cols-2">
                <PhotoFrame label="ID photo" url={selected.idPhotoUrl} />
                <PhotoFrame label="Interview screenshot" url={selected.screenshotUrl} />
              </div>

              {!selected.screenshotUrl && (
                <p className="text-sm text-amber-700">
                  The interview screenshot is not available yet. Approval stays unavailable until it arrives.
                </p>
              )}

              <div className="space-y-2">
                <label htmlFor="verification-note" className="text-sm font-medium text-[#1d1d1f]">
                  Rejection note
                </label>
                <Input
                  id="verification-note"
                  value={note}
                  maxLength={500}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="Optional note if this is not the same person"
                />
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  onClick={() => decide("approved")}
                  disabled={saving || !selected.idPhotoUrl || !selected.screenshotUrl || selected.status === "approved"}
                >
                  <Check className="mr-2 h-4 w-4" />
                  Approve
                </Button>
                <Button
                  variant="outline"
                  onClick={() => decide("rejected")}
                  disabled={saving || !selected.idPhotoUrl || selected.status === "rejected"}
                >
                  <X className="mr-2 h-4 w-4" />
                  Reject
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
