"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, AlertCircle } from "lucide-react"

function ParentCompleteContent() {
  const searchParams = useSearchParams()
  const status = searchParams.get("status")
  const email = searchParams.get("email")
  const error = searchParams.get("error")
  const isSuccess = status === "success"

  return (
    <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div
            className={`mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full ${
              isSuccess ? "bg-green-100" : "bg-red-100"
            }`}
          >
            {isSuccess ? (
              <CheckCircle2 className="h-7 w-7 text-green-600" />
            ) : (
              <AlertCircle className="h-7 w-7 text-red-600" />
            )}
          </div>
          <CardTitle className="text-2xl">
            {isSuccess ? "Thank You!" : "Something Went Wrong"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          {isSuccess ? (
            <>
              <p className="text-[rgba(0,0,0,0.68)]">
                Your parent interview has been submitted successfully. The video is being processed and will
                be delivered to the school shortly.
              </p>
              {email && (
                <p className="text-sm text-[rgba(0,0,0,0.56)]">
                  A confirmation will be sent to <span className="font-medium">{email}</span>.
                </p>
              )}
              <p className="text-sm text-[rgba(0,0,0,0.48)]">You can now close this window.</p>
            </>
          ) : (
            <>
              <p className="text-[rgba(0,0,0,0.68)]">
                We were unable to submit your interview. Please try again or contact the school for help.
              </p>
              {error && (
                <p className="text-sm text-red-600 break-words">{error}</p>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function ParentInterviewCompletePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-[#f5f5f7]">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#0071e3] border-t-transparent"></div>
        </div>
      }
    >
      <ParentCompleteContent />
    </Suspense>
  )
}
