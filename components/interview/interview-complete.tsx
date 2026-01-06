"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CheckCircle2, Clock, Mail } from "lucide-react"

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
  onSubmit: (studentEmail: string, studentName?: string, additionalInfo?: {
    gender?: string | null
    currentGrade?: string | null
    residencyCity?: string | null
    needFinancialAid?: boolean | null
  }) => void
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
  
  // Consent and additional fields
  const [consentGiven, setConsentGiven] = useState(false)
  const [gender, setGender] = useState("")
  const [currentGrade, setCurrentGrade] = useState("")
  const [residencyCity, setResidencyCity] = useState("")
  const [needFinancialAid, setNeedFinancialAid] = useState<string>("")

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
    
    // 准备额外信息
    // 字段为空时传递 null
    const additionalInfo: {
      gender?: string | null
      currentGrade?: string | null
      residencyCity?: string | null
      needFinancialAid?: boolean | null
    } = {
      gender: gender || null,
      currentGrade: currentGrade || null,
      residencyCity: residencyCity || null,
      needFinancialAid: needFinancialAid === "yes" ? true : needFinancialAid === "no" ? false : null
    }
    
    await onSubmit(studentEmail, studentName || undefined, additionalInfo)
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
              <h2 className="text-xl sm:text-2xl font-bold text-green-900">Interview Complete!</h2>
              <p className="text-sm sm:text-base text-green-700">You've successfully recorded all {responsesCount} responses</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>What Happens Next?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3 sm:gap-4">
            <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-sm sm:text-base">Verification Process</p>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Your identity and responses will be verified by our operations team to ensure authenticity
              </p>
            </div>
          </div>

          <div className="flex gap-3 sm:gap-4">
            <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
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

          <div className="space-y-2">
            <Label htmlFor="gender">Gender (Optional)</Label>
            <Select value={gender} onValueChange={setGender} disabled={isUploading || isSubmitting}>
              <SelectTrigger id="gender">
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
                <SelectItem value="Non-binary">Non-binary</SelectItem>
                <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="grade">Current Grade (Optional)</Label>
            <Select value={currentGrade} onValueChange={setCurrentGrade} disabled={isUploading || isSubmitting}>
              <SelectTrigger id="grade">
                <SelectValue placeholder="Select grade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="9th Grade">9th Grade</SelectItem>
                <SelectItem value="10th Grade">10th Grade</SelectItem>
                <SelectItem value="11th Grade">11th Grade</SelectItem>
                <SelectItem value="12th Grade">12th Grade</SelectItem>
                <SelectItem value="Undergraduate">Undergraduate</SelectItem>
                <SelectItem value="Graduate">Graduate</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="city">Residency City (Optional)</Label>
            <Input
              id="city"
              type="text"
              placeholder="e.g., New York, London, Tokyo"
              value={residencyCity}
              onChange={(e) => setResidencyCity(e.target.value)}
              disabled={isUploading || isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label>Need Financial Aid? (Optional)</Label>
            <RadioGroup 
              value={needFinancialAid} 
              onValueChange={setNeedFinancialAid}
              disabled={isUploading || isSubmitting}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="aid-yes" />
                <Label htmlFor="aid-yes" className="font-normal cursor-pointer">Yes</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="aid-no" />
                <Label htmlFor="aid-no" className="font-normal cursor-pointer">No</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Consent Checkbox - Hidden for now (set to false to hide) */}
          {false && (
            <>
              <div className="flex items-start space-x-3 pt-2">
                <Checkbox 
                  id="consent" 
                  checked={consentGiven}
                  onCheckedChange={(checked) => setConsentGiven(checked as boolean)}
                  disabled={isUploading || isSubmitting}
                />
                <div className="grid gap-1.5 leading-none">
                  <label
                    htmlFor="consent"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    I consent to share additional information with the school
                  </label>
                  <p className="text-xs text-muted-foreground">
                    By checking this box, you allow the school to access and use your detailed information for admission purposes.
                  </p>
                </div>
              </div>
            </>
          )}

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

