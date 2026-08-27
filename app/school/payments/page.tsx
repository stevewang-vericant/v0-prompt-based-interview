"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Ban, CreditCard, ExternalLink, History, KeyRound, Pencil, RefreshCw, RotateCcw, Search } from "lucide-react"
import {
  listInterviewPayments,
  listPaymentAuditLogs,
  resendPaymentAccessCode,
  restartPaidInterviewAsAdmin,
  type AdminPaymentAuditLog,
  type AdminPaymentRecord,
  updatePaymentRecoveryEmail,
  voidTestPayment,
} from "@/app/actions/admin-payments"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

function formatMoney(amountCents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amountCents / 100)
}

function formatDate(value: string | null): string {
  return value ? new Date(value).toLocaleString() : "—"
}

function statusClass(status: string): string {
  if (status === "paid" || status === "completed" || status === "consumed") {
    return "bg-green-100 text-green-800"
  }
  if (status === "failed" || status === "expired" || status === "reset") {
    return "bg-red-100 text-red-800"
  }
  if (status === "processing" || status === "in_progress") {
    return "bg-blue-100 text-blue-800"
  }
  return "bg-amber-100 text-amber-800"
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<AdminPaymentRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [paymentStatus, setPaymentStatus] = useState("all")
  const [interviewStatus, setInterviewStatus] = useState("all")
  const [actionPaymentId, setActionPaymentId] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [auditPayment, setAuditPayment] = useState<AdminPaymentRecord | null>(null)
  const [auditLogs, setAuditLogs] = useState<AdminPaymentAuditLog[]>([])
  const [auditLoading, setAuditLoading] = useState(false)
  const [auditError, setAuditError] = useState<string | null>(null)

  const loadPayments = async () => {
    setLoading(true)
    setError(null)
    const result = await listInterviewPayments()
    if (result.success && result.payments) {
      setPayments(result.payments)
    } else {
      setError(result.error || "Failed to load payment records")
    }
    setLoading(false)
  }

  useEffect(() => {
    loadPayments()
  }, [])

  const finishAction = async (
    paymentId: string,
    action: () => Promise<{ success: boolean; error?: string }>,
    successMessage: string,
  ) => {
    setActionPaymentId(paymentId)
    setError(null)
    setNotice(null)
    const result = await action()
    setActionPaymentId(null)
    if (!result.success) {
      setError(result.error || "The payment action failed.")
      return
    }
    setNotice(successMessage)
    await loadPayments()
  }

  const changeRecoveryEmail = async (payment: AdminPaymentRecord) => {
    const email = window.prompt("New recovery email:", payment.studentEmail)?.trim()
    if (!email) return
    const reason = window.prompt("Reason for changing the payment email:")?.trim()
    if (!reason) return
    await finishAction(
      payment.id,
      () => updatePaymentRecoveryEmail({ paymentId: payment.id, email, reason }),
      "Recovery email updated and recorded in the audit log.",
    )
  }

  const resendCode = async (payment: AdminPaymentRecord) => {
    const reason = window.prompt("Reason for resending the verification code:")?.trim()
    if (!reason) return
    await finishAction(
      payment.id,
      () => resendPaymentAccessCode({ paymentId: payment.id, reason }),
      "Verification code sent and recorded in the audit log.",
    )
  }

  const restartInterview = async (payment: AdminPaymentRecord) => {
    const reason = window.prompt("Reason for restarting this interview:")?.trim()
    if (!reason) return
    if (!window.confirm("This will invalidate the student's current incomplete attempt. Continue?")) return
    await finishAction(
      payment.id,
      () => restartPaidInterviewAsAdmin({ paymentId: payment.id, reason }),
      "A fresh interview attempt was created and recorded in the audit log.",
    )
  }

  const voidPayment = async (payment: AdminPaymentRecord) => {
    const reason = window.prompt("Reason for voiding this test payment:")?.trim()
    if (!reason) return
    if (!window.confirm("Void this test entitlement? This does not issue a Stripe refund.")) return
    await finishAction(
      payment.id,
      () => voidTestPayment({ paymentId: payment.id, reason }),
      "Test payment entitlement voided and recorded in the audit log.",
    )
  }

  const viewAuditLog = async (payment: AdminPaymentRecord) => {
    setAuditPayment(payment)
    setAuditLogs([])
    setAuditError(null)
    setAuditLoading(true)
    const result = await listPaymentAuditLogs(payment.id)
    setAuditLoading(false)
    if (!result.success) {
      setAuditError(result.error || "Unable to load the audit log.")
      return
    }
    setAuditLogs(result.logs || [])
  }

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return payments.filter((payment) => {
      const matchesQuery =
        !normalizedQuery ||
        [
          payment.studentName,
          payment.studentEmail,
          payment.schoolName,
          payment.schoolCode,
          payment.interviewId,
          payment.stripePaymentIntentId || "",
        ].some((value) => value.toLowerCase().includes(normalizedQuery))
      const matchesPayment =
        paymentStatus === "all" || payment.paymentStatus === paymentStatus
      const matchesInterview =
        interviewStatus === "all" || payment.interviewStatus === interviewStatus
      return matchesQuery && matchesPayment && matchesInterview
    })
  }, [payments, query, paymentStatus, interviewStatus])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#1d1d1f]">Payments</h2>
          <p className="mt-1 text-sm text-[rgba(0,0,0,0.56)]">
            Stripe payments and the interview attempts funded by each payment.
          </p>
        </div>
        <Button variant="outline" onClick={loadPayments} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment records
          </CardTitle>
          <CardDescription>
            {filtered.length} of {payments.length} payments shown
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-[1fr_180px_180px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[rgba(0,0,0,0.4)]" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search student, school, interview or Stripe ID"
                className="pl-9"
              />
            </div>
            <Select value={paymentStatus} onValueChange={setPaymentStatus}>
              <SelectTrigger><SelectValue placeholder="Payment status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All payments</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
            <Select value={interviewStatus} onValueChange={setInterviewStatus}>
              <SelectTrigger><SelectValue placeholder="Interview status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All interviews</SelectItem>
                <SelectItem value="not_started">Not started</SelectItem>
                <SelectItem value="in_progress">In progress</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="reset">Reset</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full min-w-[1280px] text-sm">
              <thead className="bg-black/[0.03] text-left text-xs uppercase tracking-wide text-[rgba(0,0,0,0.48)]">
                <tr>
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">School</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Payment</th>
                  <th className="px-4 py-3">Interview</th>
                  <th className="px-4 py-3">Paid at</th>
                  <th className="px-4 py-3">Attempts</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((payment) => (
                  <tr key={payment.id} className="bg-white align-top">
                    <td className="px-4 py-3">
                      <p className="font-medium">{payment.studentName}</p>
                      <p className="text-xs text-[rgba(0,0,0,0.48)]">{payment.studentEmail}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p>{payment.schoolName}</p>
                      <p className="text-xs text-[rgba(0,0,0,0.48)]">{payment.schoolCode}</p>
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {formatMoney(payment.amountCents, payment.currency)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusClass(payment.paymentStatus)}`}>
                        {payment.paymentStatus}
                      </span>
                      <p className="mt-2 text-xs text-[rgba(0,0,0,0.48)]">
                        entitlement: {payment.entitlementStatus}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusClass(payment.interviewStatus)}`}>
                        {payment.interviewStatus.replace("_", " ")}
                      </span>
                      <p className="mt-2 max-w-[180px] truncate font-mono text-xs text-[rgba(0,0,0,0.48)]">
                        {payment.interviewId}
                      </p>
                    </td>
                    <td className="px-4 py-3">{formatDate(payment.paidAt)}</td>
                    <td className="px-4 py-3">
                      {payment.attemptCount}
                      {payment.restartCount > 0 && (
                        <p className="text-xs text-[rgba(0,0,0,0.48)]">
                          {payment.restartCount} restart{payment.restartCount === 1 ? "" : "s"}
                        </p>
                      )}
                      {payment.lastAdminAction && (
                        <p className="mt-2 text-xs text-[rgba(0,0,0,0.48)]">
                          Admin: {payment.lastAdminAction.replaceAll("_", " ")}
                          {payment.lastAdminActionAt ? ` · ${formatDate(payment.lastAdminActionAt)}` : ""}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 space-y-2">
                      {payment.videoUrl ? (
                        <Link
                          className="inline-flex items-center text-[#0071e3] hover:underline"
                          href={`/school/watch?interviewId=${encodeURIComponent(payment.interviewId)}&videoUrl=${encodeURIComponent(`/api/proxy-video?url=${encodeURIComponent(payment.videoUrl)}`)}&b2VideoUrl=${encodeURIComponent(payment.videoUrl)}&studentName=${encodeURIComponent(payment.studentName)}&studentEmail=${encodeURIComponent(payment.studentEmail)}`}
                        >
                          View <ExternalLink className="ml-1 h-3 w-3" />
                        </Link>
                      ) : (
                        <span className="text-xs text-[rgba(0,0,0,0.4)]">No completed video</span>
                      )}
                      <div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => viewAuditLog(payment)}
                        >
                          <History className="mr-1 h-3 w-3" /> View Audit Log
                        </Button>
                      </div>
                      {payment.paymentStatus === "paid" &&
                        payment.entitlementStatus === "active" &&
                        !["processing", "completed"].includes(payment.interviewStatus) && (
                          <div className="flex max-w-[260px] flex-wrap gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => resendCode(payment)}
                              disabled={actionPaymentId === payment.id}
                            >
                              <KeyRound className="mr-1 h-3 w-3" /> Resend code
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => changeRecoveryEmail(payment)}
                              disabled={actionPaymentId === payment.id}
                            >
                              <Pencil className="mr-1 h-3 w-3" /> Change Email
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => restartInterview(payment)}
                              disabled={actionPaymentId === payment.id}
                            >
                              <RotateCcw className="mr-1 h-3 w-3" /> Restart
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => voidPayment(payment)}
                              disabled={actionPaymentId === payment.id}
                            >
                              <Ban className="mr-1 h-3 w-3" /> Void test
                            </Button>
                          </div>
                        )}
                    </td>
                  </tr>
                ))}
                {!loading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-[rgba(0,0,0,0.48)]">
                      No matching payment records.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <AlertDialog
        open={Boolean(auditPayment)}
        onOpenChange={(open) => {
          if (!open) setAuditPayment(null)
        }}
      >
        <AlertDialogContent className="max-h-[80vh] max-w-2xl overflow-hidden">
          <AlertDialogHeader>
            <AlertDialogTitle>Payment Audit Log</AlertDialogTitle>
            <AlertDialogDescription>
              {auditPayment
                ? `${auditPayment.studentName} · ${auditPayment.studentEmail} · ${auditPayment.interviewId}`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="max-h-[55vh] overflow-y-auto rounded-lg border">
            {auditLoading && (
              <p className="px-4 py-8 text-center text-sm text-[rgba(0,0,0,0.48)]">
                Loading audit log...
              </p>
            )}
            {auditError && (
              <Alert variant="destructive" className="m-4">
                <AlertDescription>{auditError}</AlertDescription>
              </Alert>
            )}
            {!auditLoading && !auditError && auditLogs.length === 0 && (
              <p className="px-4 py-8 text-center text-sm text-[rgba(0,0,0,0.48)]">
                No administrator actions have been recorded for this payment.
              </p>
            )}
            {!auditLoading && auditLogs.length > 0 && (
              <div className="divide-y">
                {auditLogs.map((log) => (
                  <div key={log.id} className="space-y-2 px-4 py-4">
                    <div className="flex flex-col justify-between gap-1 sm:flex-row">
                      <p className="font-medium capitalize">
                        {log.action.replaceAll("_", " ")}
                      </p>
                      <p className="text-xs text-[rgba(0,0,0,0.48)]">
                        {formatDate(log.createdAt)}
                      </p>
                    </div>
                    <p className="text-sm text-[rgba(0,0,0,0.64)]">
                      By {log.actorEmail}
                    </p>
                    {log.reason && (
                      <p className="text-sm">
                        <span className="text-[rgba(0,0,0,0.48)]">Reason: </span>
                        {log.reason}
                      </p>
                    )}
                    {log.metadata !== null && (
                      <pre className="overflow-x-auto rounded-md bg-black/[0.03] p-2 text-xs text-[rgba(0,0,0,0.64)]">
                        {JSON.stringify(log.metadata, null, 2)}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
