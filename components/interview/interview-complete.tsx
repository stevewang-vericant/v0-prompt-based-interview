"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { CheckCircle2, Clock } from "lucide-react"

interface StudentInfo {
  email: string
  name?: string
  gender?: string | null
  currentGrade?: string | null
  residencyCity?: string | null
  needFinancialAid?: boolean | null
}

interface InterviewCompleteProps {
  responsesCount: number
  onSubmit: () => void
  isUploading?: boolean
  uploadProgress?: number
  uploadStatus?: string
  interviewId?: string
  isResumeUpload?: boolean
  pendingCount?: number
}

export function InterviewComplete({ 
  responsesCount, 
  onSubmit, 
  isUploading = false,
  uploadProgress = 0,
  uploadStatus = "",
  interviewId,
  isResumeUpload = false,
  pendingCount = 0
}: InterviewCompleteProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    setIsSubmitting(true)
    await onSubmit()
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {isResumeUpload ? (
        <Card className="border-blue-200 bg-[#0071e3]/5">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#0071e3]/10">
                <Clock className="h-8 w-8 text-[#0071e3]" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-blue-900">Upload Incomplete</h2>
                <p className="text-sm sm:text-base text-[#0071e3]">
                  {pendingCount} of {responsesCount} videos still need to be uploaded
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-green-900">Interview Complete!</h2>
                <p className="text-sm sm:text-base text-green-700">You've successfully recorded all {responsesCount} responses</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!isResumeUpload && (
        <Card>
          <CardHeader>
            <CardTitle>What Happens Next?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3 sm:gap-4">
              <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#0071e3]/10 flex items-center justify-center">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-[#0071e3]" />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-sm sm:text-base">Verification Process</p>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Your identity and responses will be verified by our operations team to ensure authenticity
                </p>
              </div>
            </div>

            <div className="flex gap-3 sm:gap-4">
              <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#0071e3]/10 flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-[#0071e3]" />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-sm sm:text-base">Video Delivery</p>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Your video will be delivered to your school within 48 hours. You'll receive an email notification when
                  complete.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{isResumeUpload ? 'Continue Upload' : 'Submit Interview'}</CardTitle>
          <CardDescription>
            {isResumeUpload
              ? 'Click the button below to upload your remaining video segments'
              : 'Click the button below to submit your interview video'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isUploading && (
            <div className="p-4 bg-[#0071e3]/5 border border-blue-200 rounded-lg space-y-3">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#0071e3]"></div>
                <div className="flex-1">
                  <p className="font-medium text-blue-900">
                    {uploadStatus || "Uploading your interview video..."}
                  </p>
                  <p className="text-sm text-[#0071e3]">
                    {uploadProgress < 100 
                      ? "Please wait, do not close this page" 
                      : "Upload complete! You can close this window. Video processing will continue in the background."}
                  </p>
                  {interviewId && (
                    <p className="text-xs text-[#0071e3] font-mono mt-1">
                      Interview ID: {interviewId}
                    </p>
                  )}
                </div>
              </div>
              {uploadProgress > 0 && (
                <div className="space-y-1">
                  <Progress value={uploadProgress} className="h-2" />
                  <p className="text-xs text-[#0071e3] text-right">{uploadProgress}%</p>
                </div>
              )}
            </div>
          )}

          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting || isUploading} 
            className="w-full" 
            size="lg"
          >
            {isUploading
              ? (uploadProgress < 100 ? "Uploading Video..." : "Upload Complete!")
              : isSubmitting
                ? "Uploading..."
                : isResumeUpload ? "Continue Upload" : "Submit Interview"}
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            By submitting, you confirm that all responses are your own work and were completed without assistance
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

