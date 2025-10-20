"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { CheckCircle2, Clock, Award, Mail } from "lucide-react"

interface InterviewCompleteProps {
  responsesCount: number
  onSubmit: (studentEmail: string, studentName?: string) => void
  isUploading?: boolean
  uploadProgress?: number
  uploadStatus?: string
  interviewId?: string
}

export function InterviewComplete({ 
  responsesCount, 
  onSubmit, 
  isUploading = false,
  uploadProgress = 0,
  uploadStatus = "",
  interviewId
}: InterviewCompleteProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [studentEmail, setStudentEmail] = useState("")
  const [studentName, setStudentName] = useState("")
  const [emailError, setEmailError] = useState("")

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return re.test(email)
  }

  const handleSubmit = async () => {
    // 验证邮箱
    if (!studentEmail.trim()) {
      setEmailError("Please enter your email address")
      return
    }
    if (!validateEmail(studentEmail)) {
      setEmailError("Please enter a valid email address")
      return
    }
    
    setEmailError("")
    setIsSubmitting(true)
    await onSubmit(studentEmail, studentName || undefined)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-green-900">Interview Complete!</h2>
              <p className="text-green-700">You've successfully recorded all {responsesCount} responses</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>What Happens Next?</CardTitle>
          <CardDescription>Your interview will be reviewed and scored</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="font-medium">Verification Process</p>
              <p className="text-sm text-muted-foreground">
                Your identity and responses will be verified by our operations team to ensure authenticity
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Award className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="font-medium">AI + Human Scoring</p>
              <p className="text-sm text-muted-foreground">
                Your responses will be evaluated for fluency, coherence, vocabulary, grammar, and pronunciation
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="font-medium">Results Delivery</p>
              <p className="text-sm text-muted-foreground">
                Your scores will be delivered to your school within 48 hours. You'll receive an email notification when
                complete.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Student Information
          </CardTitle>
          <CardDescription>
            Please provide your contact information to submit the interview
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              placeholder="your.email@example.com"
              value={studentEmail}
              onChange={(e) => {
                setStudentEmail(e.target.value)
                setEmailError("")
              }}
              disabled={isUploading || isSubmitting}
              className={emailError ? "border-red-500" : ""}
            />
            {emailError && (
              <p className="text-sm text-red-600">{emailError}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Full Name (Optional)</Label>
            <Input
              id="name"
              type="text"
              placeholder="Your full name"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              disabled={isUploading || isSubmitting}
            />
          </div>

          {isUploading && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <div className="flex-1">
                  <p className="font-medium text-blue-900">
                    {uploadStatus || "Processing your interview video..."}
                  </p>
                  <p className="text-sm text-blue-700">Please wait, do not close this page</p>
                  {interviewId && (
                    <p className="text-xs text-blue-600 font-mono mt-1">
                      Interview ID: {interviewId}
                    </p>
                  )}
                </div>
              </div>
              {uploadProgress > 0 && (
                <div className="space-y-1">
                  <Progress value={uploadProgress} className="h-2" />
                  <p className="text-xs text-blue-600 text-right">{uploadProgress}%</p>
                </div>
              )}
            </div>
          )}

          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting || isUploading || !studentEmail.trim()} 
            className="w-full" 
            size="lg"
          >
            {isUploading ? "Processing Video..." : isSubmitting ? "Submitting Interview..." : "Submit Interview"}
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            By submitting, you confirm that all responses are your own work and were completed without assistance
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

