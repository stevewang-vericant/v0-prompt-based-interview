"use client"

import { Suspense, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Mail, RotateCcw, ShieldCheck } from "lucide-react"
import {
  requestInterviewAccessCode,
  verifyInterviewAccessCode,
} from "@/app/actions/payment-access"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { storeInterviewId } from "@/lib/interview-storage"

function AccessPageContent() {
  const searchParams = useSearchParams()
  const schoolCode = searchParams.get("school") || ""
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [codeSent, setCodeSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const requestCode = async () => {
    setLoading(true)
    setError(null)
    setMessage(null)
    const result = await requestInterviewAccessCode({ schoolCode, email })
    if (result.success) {
      setCodeSent(true)
      setMessage("If an active paid interview matches that email, a verification code has been sent.")
    } else {
      setError(result.error || "Unable to send verification code.")
    }
    setLoading(false)
  }

  const verify = async (restart: boolean) => {
    setLoading(true)
    setError(null)
    const result = await verifyInterviewAccessCode({
      schoolCode,
      email,
      code,
      restart,
    })
    if (result.success && result.interviewId) {
      storeInterviewId(schoolCode, result.interviewId)
      window.location.href =
        `/student/interview?school=${encodeURIComponent(schoolCode)}` +
        `&interviewId=${encodeURIComponent(result.interviewId)}`
      return
    }
    setError(result.error || "Unable to verify interview access.")
    setLoading(false)
  }

  if (!schoolCode) {
    return (
      <Alert variant="destructive">
        <AlertDescription>This access link is missing a school code.</AlertDescription>
      </Alert>
    )
  }

  return (
    <Card className="mx-auto max-w-lg">
      <CardHeader>
        <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 text-[#0071e3]">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <CardTitle>Access your paid interview</CardTitle>
        <CardDescription>
          Verify the email address used for Stripe payment. A completed or submitted interview cannot be restarted.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {error && (
          <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>
        )}
        {message && (
          <Alert><AlertDescription>{message}</AlertDescription></Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="payment-email">Payment email</Label>
          <Input
            id="payment-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="student@example.com"
            disabled={codeSent || loading}
          />
        </div>

        {!codeSent ? (
          <Button className="w-full" onClick={requestCode} disabled={loading || !email.trim()}>
            <Mail className="mr-2 h-4 w-4" />
            {loading ? "Sending..." : "Send verification code"}
          </Button>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="access-code">6-digit verification code</Label>
              <Input
                id="access-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                className="text-center text-xl tracking-[0.35em]"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Button
                variant="outline"
                onClick={() => verify(false)}
                disabled={loading || code.length !== 6}
              >
                Continue current attempt
              </Button>
              <Button
                onClick={() => verify(true)}
                disabled={loading || code.length !== 6}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Start from beginning
              </Button>
            </div>
            <button
              type="button"
              className="w-full text-center text-sm text-[#0071e3] hover:underline"
              onClick={() => {
                setCodeSent(false)
                setCode("")
                setMessage(null)
              }}
              disabled={loading}
            >
              Use a different email or resend
            </button>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default function PaymentAccessPage() {
  return (
    <div className="min-h-screen bg-[#f5f5f7] px-4 py-12">
      <Suspense fallback={<div className="text-center">Loading...</div>}>
        <AccessPageContent />
      </Suspense>
    </div>
  )
}
