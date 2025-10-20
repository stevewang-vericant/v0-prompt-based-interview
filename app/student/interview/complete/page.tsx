"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle2, XCircle, Video, Mail, ArrowRight, RefreshCcw } from "lucide-react"

function InterviewCompleteContent() {
  const searchParams = useSearchParams()
  const status = searchParams.get("status") // "success" or "error"
  const schoolCode = searchParams.get("school")
  const errorMessage = searchParams.get("error")
  const studentEmail = searchParams.get("email")
  const interviewId = searchParams.get("interviewId")

  const isSuccess = status === "success"

  // 构建重新面试的链接
  const retryUrl = schoolCode 
    ? `/student/interview?school=${schoolCode}` 
    : `/student/interview`

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center space-y-4">
          {isSuccess ? (
            <>
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              </div>
              <CardTitle className="text-3xl text-green-900">
                Interview Submitted Successfully!
              </CardTitle>
              <CardDescription className="text-base text-slate-600">
                Thank you for completing your video interview assessment
              </CardDescription>
              {interviewId && (
                <p className="text-xs text-slate-500 font-mono mt-2">
                  Interview ID: {interviewId}
                </p>
              )}
            </>
          ) : (
            <>
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <XCircle className="h-10 w-10 text-red-600" />
              </div>
              <CardTitle className="text-3xl text-red-900">
                Interview Submission Failed
              </CardTitle>
              <CardDescription className="text-base text-slate-600">
                We encountered an error while processing your interview
              </CardDescription>
              {interviewId && (
                <p className="text-xs text-slate-500 font-mono mt-2">
                  Interview ID: {interviewId}
                </p>
              )}
            </>
          )}
        </CardHeader>

        <CardContent className="space-y-6">
          {isSuccess ? (
            <>
              {/* Success Information */}
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-900">What happens next?</AlertTitle>
                <AlertDescription className="text-green-700 space-y-2 mt-2">
                  <p>
                    Your video interview has been successfully uploaded and sent to the admissions team.
                  </p>
                  <div className="flex items-start gap-2 mt-3">
                    <Video className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <p className="text-sm">
                      <strong>Video processed:</strong> Your responses have been merged into a single video file
                    </p>
                  </div>
                  {schoolCode && (
                    <div className="flex items-start gap-2">
                      <ArrowRight className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <p className="text-sm">
                        <strong>Sent to:</strong> {schoolCode.charAt(0).toUpperCase() + schoolCode.slice(1)} University
                      </p>
                    </div>
                  )}
                  {studentEmail && (
                    <div className="flex items-start gap-2">
                      <Mail className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <p className="text-sm">
                        <strong>Confirmation sent to:</strong> {studentEmail}
                      </p>
                    </div>
                  )}
                </AlertDescription>
              </Alert>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                <h4 className="font-medium text-blue-900">Review Timeline</h4>
                <p className="text-sm text-blue-700">
                  The admissions team will review your interview within the next 48 hours. 
                  You will receive an email notification once your interview has been evaluated.
                </p>
              </div>

              <div className="text-center pt-4">
                <p className="text-sm text-slate-500">
                  You may now close this window
                </p>
              </div>
            </>
          ) : (
            <>
              {/* Error Information */}
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertTitle>Error Details</AlertTitle>
                <AlertDescription className="mt-2">
                  {errorMessage || "An unknown error occurred while processing your interview. This could be due to network issues or server problems."}
                </AlertDescription>
              </Alert>

              <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                <h4 className="font-medium text-slate-900">What should I do?</h4>
                <ol className="text-sm text-slate-600 space-y-2 list-decimal list-inside">
                  <li>Check your internet connection is stable</li>
                  <li>Click the button below to retake the interview</li>
                  <li>If the problem persists, contact technical support</li>
                </ol>
              </div>

              {/* Retry Button */}
              <div className="flex flex-col gap-3 pt-4">
                <Button 
                  size="lg" 
                  className="w-full"
                  onClick={() => window.location.href = retryUrl}
                >
                  <RefreshCcw className="h-4 w-4 mr-2" />
                  Retake Interview
                </Button>
                
                <div className="text-center">
                  <p className="text-xs text-slate-500">
                    This will take you back to the interview page with all your settings preserved
                  </p>
                </div>
              </div>

              {/* Support Information */}
              <div className="border-t pt-4 mt-4">
                <p className="text-sm text-slate-600 text-center">
                  Need help? Contact support at{" "}
                  <a href="mailto:support@example.com" className="text-blue-600 hover:underline">
                    support@example.com
                  </a>
                </p>
                {schoolCode && (
                  <p className="text-xs text-slate-500 text-center mt-2">
                    Reference Code: {schoolCode}-{Date.now().toString(36)}
                  </p>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function InterviewCompletePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto"></div>
          <p className="mt-2 text-sm text-slate-600">Loading...</p>
        </div>
      </div>
    }>
      <InterviewCompleteContent />
    </Suspense>
  )
}

