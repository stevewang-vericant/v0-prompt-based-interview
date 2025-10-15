"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Video, CheckCircle2, Clock, AlertCircle, FileText } from "lucide-react"

type Student = {
  id: string
  email: string
  firstName: string
  lastName: string
  schoolName: string
  verificationStatus: "pending" | "submitted" | "approved" | "rejected"
  interviewStatus: "not_started" | "in_progress" | "completed"
}

export default function StudentDashboardPage() {
  const [student, setStudent] = useState<Student | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const storedStudent = localStorage.getItem("currentStudent")
    if (storedStudent) {
      setStudent(JSON.parse(storedStudent))
    } else {
      // Redirect to login if no student data
      window.location.href = "/student/login"
    }
    setIsLoading(false)
  }, [])

  const handleSignOut = () => {
    localStorage.removeItem("currentStudent")
    window.location.href = "/student/login"
  }

  if (isLoading || !student) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto"></div>
          <p className="mt-2 text-sm text-slate-600">Loading...</p>
        </div>
      </div>
    )
  }

  const getStatusInfo = () => {
    if (student.interviewStatus === "not_started") {
      return {
        title: "Ready to Start Interview",
        description: "You can now begin your video interview assessment.",
        action: "Start Interview",
        href: "/student/interview",
        variant: "default" as const,
      }
    }

    if (student.interviewStatus === "in_progress") {
      return {
        title: "Interview In Progress",
        description: "Continue your interview assessment where you left off.",
        action: "Continue Interview",
        href: "/student/interview",
        variant: "default" as const,
      }
    }

    if (student.interviewStatus === "completed") {
      return {
        title: "Interview Completed",
        description: "Your interview has been submitted and is being scored. Results will be available soon.",
        action: null,
        variant: "secondary" as const,
      }
    }

    return null
  }

  const statusInfo = getStatusInfo()

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Welcome, {student.firstName} {student.lastName}
              </h1>
              <p className="text-sm text-slate-600">{student.email}</p>
              <p className="text-xs text-slate-500">{student.schoolName}</p>
            </div>
            <Button variant="outline" onClick={handleSignOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Status Alert */}
        {statusInfo && (
          <Alert className={statusInfo.variant === "destructive" ? "border-red-200 bg-red-50" : ""}>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{statusInfo.title}</AlertTitle>
            <AlertDescription className="mt-2">
              <p className="mb-3">{statusInfo.description}</p>
              {statusInfo.action && (
                <Button
                  variant={statusInfo.variant}
                  onClick={() => statusInfo.href && (window.location.href = statusInfo.href)}
                >
                  {statusInfo.action}
                </Button>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Progress Overview */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Identity Verification</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {student.verificationStatus === "approved" ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Verified</Badge>
                  </>
                ) : student.verificationStatus === "submitted" ? (
                  <>
                    <Clock className="h-5 w-5 text-yellow-600" />
                    <Badge variant="secondary">Under Review</Badge>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-5 w-5 text-slate-400" />
                    <Badge variant="outline">Pending</Badge>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Interview Status</CardTitle>
              <Video className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {student.interviewStatus === "completed" ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Completed</Badge>
                  </>
                ) : student.interviewStatus === "in_progress" ? (
                  <>
                    <Clock className="h-5 w-5 text-blue-600" />
                    <Badge>In Progress</Badge>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-5 w-5 text-slate-400" />
                    <Badge variant="outline">Not Started</Badge>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Estimated Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3-5 min</div>
              <p className="text-xs text-muted-foreground">Total interview duration</p>
            </CardContent>
          </Card>
        </div>

        {/* Interview Information */}
        <Card>
          <CardHeader>
            <CardTitle>About Your Interview</CardTitle>
            <CardDescription>What to expect during your video assessment</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Format</h3>
                <p className="text-sm text-muted-foreground">
                  You'll respond to 3-5 prompts via video. Each prompt has 10 seconds preparation time and 60-90 seconds
                  recording time.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Requirements</h3>
                <p className="text-sm text-muted-foreground">
                  A working webcam and microphone are required. Ensure you're in a quiet, well-lit environment.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Assessment Areas</h3>
                <p className="text-sm text-muted-foreground">
                  Critical thinking, conversational fluency, vocabulary, grammar, and pronunciation.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Results</h3>
                <p className="text-sm text-muted-foreground">
                  Your responses will be scored by AI and human reviewers. Results are typically available within 48
                  hours.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
