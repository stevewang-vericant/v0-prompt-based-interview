"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Mail, User, Users, Globe } from "lucide-react"
import { PARENT_RESPONSE_LANGUAGES, DEFAULT_PARENT_RESPONSE_LANGUAGE } from "@/lib/parent-languages"

export interface ParentInfo {
  parentName: string
  parentEmail: string
  parentPhone?: string | null
  relationship?: string | null
  preferredLanguage: string
  studentName: string
  studentEmail?: string | null
  studentDateOfBirth?: string | null
}

interface InterviewParentInfoProps {
  onSubmit: (info: ParentInfo) => void
  schoolName?: string | null
}

const RELATIONSHIPS = ["Mother", "Father", "Guardian", "Grandparent", "Other"]

export function InterviewParentInfo({ onSubmit, schoolName }: InterviewParentInfoProps) {
  const [parentName, setParentName] = useState("")
  const [parentEmail, setParentEmail] = useState("")
  const [parentPhone, setParentPhone] = useState("")
  const [relationship, setRelationship] = useState("")
  const [preferredLanguage, setPreferredLanguage] = useState<string>(DEFAULT_PARENT_RESPONSE_LANGUAGE)
  const [studentName, setStudentName] = useState("")
  const [studentEmail, setStudentEmail] = useState("")
  const [studentDob, setStudentDob] = useState("")

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  const handleSubmit = () => {
    const nextErrors: Record<string, string> = {}

    if (!parentName.trim()) nextErrors.parentName = "Please enter your full name"
    if (!parentEmail.trim()) {
      nextErrors.parentEmail = "Please enter your email address"
    } else if (!validateEmail(parentEmail)) {
      nextErrors.parentEmail = "Please enter a valid email address"
    }
    if (!preferredLanguage) nextErrors.preferredLanguage = "Please select a preferred language"
    if (!studentName.trim()) nextErrors.studentName = "Please enter your child's full name"
    if (studentEmail.trim() && !validateEmail(studentEmail)) {
      nextErrors.studentEmail = "Please enter a valid student email address"
    }

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    onSubmit({
      parentName: parentName.trim(),
      parentEmail: parentEmail.trim(),
      parentPhone: parentPhone.trim() || null,
      relationship: relationship || null,
      preferredLanguage,
      studentName: studentName.trim(),
      studentEmail: studentEmail.trim() || null,
      studentDateOfBirth: studentDob || null,
    })
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Parent Interview
          </CardTitle>
          <CardDescription>
            {schoolName ? `${schoolName} invites you to complete a short video interview.` : "Please complete a short video interview."}{" "}
            Enter your information below. Fields marked with * are required.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Parent details */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-[#1d1d1f]">Your information</h3>

            <div className="space-y-2">
              <Label htmlFor="parent-name">
                Your Full Name <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[rgba(0,0,0,0.36)]" />
                <Input
                  id="parent-name"
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  placeholder="Your full name"
                  className={`pl-10 ${errors.parentName ? "border-red-500" : ""}`}
                />
              </div>
              {errors.parentName && <p className="text-sm text-red-600">{errors.parentName}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="parent-email">
                Your Email Address <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[rgba(0,0,0,0.36)]" />
                <Input
                  id="parent-email"
                  type="email"
                  value={parentEmail}
                  onChange={(e) => setParentEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className={`pl-10 ${errors.parentEmail ? "border-red-500" : ""}`}
                />
              </div>
              {errors.parentEmail && <p className="text-sm text-red-600">{errors.parentEmail}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="relationship">Relationship to Student (Optional)</Label>
                <Select value={relationship} onValueChange={setRelationship}>
                  <SelectTrigger id="relationship">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {RELATIONSHIPS.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="parent-phone">Phone (Optional)</Label>
                <Input
                  id="parent-phone"
                  value={parentPhone}
                  onChange={(e) => setParentPhone(e.target.value)}
                  placeholder="Phone number"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="language">
                Preferred Response Language <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[rgba(0,0,0,0.36)] z-10" />
                <Select value={preferredLanguage} onValueChange={setPreferredLanguage}>
                  <SelectTrigger id="language" className="pl-10">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    {PARENT_RESPONSE_LANGUAGES.map((lang) => (
                      <SelectItem key={lang} value={lang}>
                        {lang}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-[rgba(0,0,0,0.48)]">
                You can answer in this language. Each question is shown in English and in your language,
                and English subtitles are generated for the school.
              </p>
              {errors.preferredLanguage && <p className="text-sm text-red-600">{errors.preferredLanguage}</p>}
            </div>
          </div>

          {/* Student details */}
          <div className="space-y-4 border-t border-black/[0.06] pt-6">
            <h3 className="text-sm font-semibold text-[#1d1d1f]">Your child (student)</h3>
            <p className="text-xs text-[rgba(0,0,0,0.48)]">
              This helps the school link your interview to your child's interview, if one exists.
            </p>

            <div className="space-y-2">
              <Label htmlFor="student-name">
                Student Full Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="student-name"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="Your child's full name"
                className={errors.studentName ? "border-red-500" : ""}
              />
              {errors.studentName && <p className="text-sm text-red-600">{errors.studentName}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="student-email">Student Email (Optional)</Label>
                <Input
                  id="student-email"
                  type="email"
                  value={studentEmail}
                  onChange={(e) => setStudentEmail(e.target.value)}
                  placeholder="student.email@example.com"
                  className={errors.studentEmail ? "border-red-500" : ""}
                />
                {errors.studentEmail && <p className="text-sm text-red-600">{errors.studentEmail}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="student-dob">Student Date of Birth (Optional)</Label>
                <Input
                  id="student-dob"
                  type="date"
                  value={studentDob}
                  onChange={(e) => setStudentDob(e.target.value)}
                />
              </div>
            </div>
          </div>

          <Button onClick={handleSubmit} className="w-full" size="lg">
            Continue to Interview
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
