"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Mail, User, Users, Globe } from "lucide-react"
import { PARENT_RESPONSE_LANGUAGES, DEFAULT_PARENT_RESPONSE_LANGUAGE } from "@/lib/parent-languages"
import { parentT, type ParentUILang } from "@/lib/parent-i18n"

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
  lang?: ParentUILang
}

const RELATIONSHIPS = ["Mother", "Father", "Guardian", "Grandparent", "Other"]

export function InterviewParentInfo({ onSubmit, schoolName, lang = "en" }: InterviewParentInfoProps) {
  const t = parentT(lang)
  const [parentName, setParentName] = useState("")
  const [parentEmail, setParentEmail] = useState("")
  const [parentPhone, setParentPhone] = useState("")
  const [relationship, setRelationship] = useState("")
  const [preferredLanguage, setPreferredLanguage] = useState<string>(DEFAULT_PARENT_RESPONSE_LANGUAGE)
  const [studentName, setStudentName] = useState("")
  const [studentEmail, setStudentEmail] = useState("")
  const [studentDob, setStudentDob] = useState("")

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Clear stale validation messages when the UI language changes so they don't
  // linger in the previously selected language.
  useEffect(() => {
    setErrors({})
  }, [lang])

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  const handleSubmit = () => {
    const nextErrors: Record<string, string> = {}

    if (!parentName.trim()) nextErrors.parentName = t.info.errors.nameRequired
    if (!parentEmail.trim()) {
      nextErrors.parentEmail = t.info.errors.emailRequired
    } else if (!validateEmail(parentEmail)) {
      nextErrors.parentEmail = t.info.errors.emailInvalid
    }
    if (!relationship) nextErrors.relationship = t.info.errors.relationshipRequired
    if (!preferredLanguage) nextErrors.preferredLanguage = t.info.errors.langRequired
    if (!studentName.trim()) nextErrors.studentName = t.info.errors.studentNameRequired
    if (studentEmail.trim() && !validateEmail(studentEmail)) {
      nextErrors.studentEmail = t.info.errors.studentEmailInvalid
    }
    if (!studentDob) nextErrors.studentDob = t.info.errors.studentDobRequired

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
            {t.info.title}
          </CardTitle>
          <CardDescription>
            {schoolName ? t.info.descWithSchool(schoolName) : t.info.descNoSchool}{" "}
            {t.info.requiredNote}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Parent details */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-[#1d1d1f]">{t.info.yourInfo}</h3>

            <div className="space-y-2">
              <Label htmlFor="parent-name">
                {t.info.fullName} <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[rgba(0,0,0,0.36)]" />
                <Input
                  id="parent-name"
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  placeholder={t.info.fullNamePh}
                  className={`pl-10 ${errors.parentName ? "border-red-500" : ""}`}
                />
              </div>
              {errors.parentName && <p className="text-sm text-red-600">{errors.parentName}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="parent-email">
                {t.info.email} <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[rgba(0,0,0,0.36)]" />
                <Input
                  id="parent-email"
                  type="email"
                  value={parentEmail}
                  onChange={(e) => setParentEmail(e.target.value)}
                  placeholder={t.info.emailPh}
                  className={`pl-10 ${errors.parentEmail ? "border-red-500" : ""}`}
                />
              </div>
              {errors.parentEmail && <p className="text-sm text-red-600">{errors.parentEmail}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="relationship">
                  {t.info.relationship} <span className="text-red-500">*</span>
                </Label>
                <Select value={relationship} onValueChange={setRelationship}>
                  <SelectTrigger id="relationship" className={errors.relationship ? "border-red-500" : ""}>
                    <SelectValue placeholder={t.info.relationshipPh} />
                  </SelectTrigger>
                  <SelectContent>
                    {RELATIONSHIPS.map((r) => (
                      <SelectItem key={r} value={r}>
                        {t.info.relationships[r] ?? r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.relationship && <p className="text-sm text-red-600">{errors.relationship}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="parent-phone">{t.info.phone}</Label>
                <Input
                  id="parent-phone"
                  value={parentPhone}
                  onChange={(e) => setParentPhone(e.target.value)}
                  placeholder={t.info.phonePh}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="language">
                {t.info.prefLang} <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[rgba(0,0,0,0.36)] z-10" />
                <Select value={preferredLanguage} onValueChange={setPreferredLanguage}>
                  <SelectTrigger id="language" className="pl-10">
                    <SelectValue placeholder={t.info.prefLangPh} />
                  </SelectTrigger>
                  <SelectContent>
                    {PARENT_RESPONSE_LANGUAGES.map((language) => (
                      <SelectItem key={language} value={language}>
                        {language}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-[rgba(0,0,0,0.48)]">{t.info.prefLangHint}</p>
              {errors.preferredLanguage && <p className="text-sm text-red-600">{errors.preferredLanguage}</p>}
            </div>
          </div>

          {/* Student details */}
          <div className="space-y-4 border-t border-black/[0.06] pt-6">
            <h3 className="text-sm font-semibold text-[#1d1d1f]">{t.info.child}</h3>
            <p className="text-xs text-[rgba(0,0,0,0.48)]">{t.info.childHint}</p>

            <div className="space-y-2">
              <Label htmlFor="student-name">
                {t.info.studentName} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="student-name"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder={t.info.studentNamePh}
                className={errors.studentName ? "border-red-500" : ""}
              />
              {errors.studentName && <p className="text-sm text-red-600">{errors.studentName}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="student-email">{t.info.studentEmail}</Label>
                <Input
                  id="student-email"
                  type="email"
                  value={studentEmail}
                  onChange={(e) => setStudentEmail(e.target.value)}
                  placeholder={t.info.studentEmailPh}
                  className={errors.studentEmail ? "border-red-500" : ""}
                />
                {errors.studentEmail && <p className="text-sm text-red-600">{errors.studentEmail}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="student-dob">
                  {t.info.studentDob} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="student-dob"
                  type="date"
                  value={studentDob}
                  onChange={(e) => setStudentDob(e.target.value)}
                  className={errors.studentDob ? "border-red-500" : ""}
                />
                {errors.studentDob && <p className="text-sm text-red-600">{errors.studentDob}</p>}
              </div>
            </div>
            <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2">
              <p className="text-xs text-blue-900">{t.info.studentEmailHint}</p>
            </div>
          </div>

          <Button onClick={handleSubmit} className="w-full" size="lg">
            {t.info.continue}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
