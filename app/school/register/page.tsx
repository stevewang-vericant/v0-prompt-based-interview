"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getSchools, registerSchoolAdmin, type School } from "@/app/actions/auth"
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react"
import Link from "next/link"

type SchoolLevel = "k12" | "undergraduate"

const SCHOOL_LEVEL_OPTIONS: Array<{ value: SchoolLevel; label: string }> = [
  { value: "k12", label: "K-12" },
  { value: "undergraduate", label: "University" },
]

const SCHOOL_LEVEL_SEARCH_TERMS: Record<SchoolLevel, string[]> = {
  k12: ["k-12", "k12"],
  undergraduate: ["university", "undergraduate", "college"],
}

export default function SchoolRegisterPage() {
  const [schools, setSchools] = useState<School[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [schoolSearch, setSchoolSearch] = useState("")
  const [isSchoolSearchFocused, setIsSchoolSearchFocused] = useState(false)
  const [highlightedSchoolIndex, setHighlightedSchoolIndex] = useState(-1)
  const schoolResultRefs = useRef<Array<HTMLButtonElement | null>>([])
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    schoolLevel: "" as SchoolLevel | "",
    schoolId: ""
  })

  const selectedSchool = useMemo(
    () => schools.find((school) => school.id === formData.schoolId) || null,
    [schools, formData.schoolId]
  )

  const filteredSchools = useMemo(() => {
    const query = schoolSearch.trim().toLowerCase()

    if (!formData.schoolLevel || query.length < 2) {
      return []
    }

    const levelTerms = SCHOOL_LEVEL_SEARCH_TERMS[formData.schoolLevel] || []

    return schools
      .filter((school) => school.level === formData.schoolLevel)
      .filter((school) => {
        const schoolCode = school.code?.toLowerCase() || ""

        return (
          school.name.toLowerCase().includes(query) ||
          schoolCode.includes(query) ||
          levelTerms.some((term) => term.includes(query))
        )
      })
      .slice(0, 8)
  }, [schools, formData.schoolLevel, schoolSearch])

  const hasEnoughSchoolSearch = schoolSearch.trim().length >= 2
  const showSchoolResults =
    Boolean(formData.schoolLevel) &&
    isSchoolSearchFocused &&
    hasEnoughSchoolSearch

  const handleSchoolLevelChange = (schoolLevel: SchoolLevel) => {
    setFormData({ ...formData, schoolLevel, schoolId: "" })
    setSchoolSearch("")
    setHighlightedSchoolIndex(-1)
    setError(null)
  }

  const handleSchoolSearchChange = (value: string) => {
    setSchoolSearch(value)
    setFormData({ ...formData, schoolId: "" })
    setIsSchoolSearchFocused(true)
    setHighlightedSchoolIndex(-1)
  }

  const handleSelectSchool = (school: School) => {
    setFormData({ ...formData, schoolId: school.id })
    setSchoolSearch(school.name)
    setIsSchoolSearchFocused(false)
    setHighlightedSchoolIndex(-1)
  }

  const handleSchoolSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setIsSchoolSearchFocused(false)
      setHighlightedSchoolIndex(-1)
      return
    }

    if (!showSchoolResults || filteredSchools.length === 0) {
      return
    }

    if (e.key === "ArrowDown") {
      e.preventDefault()
      setHighlightedSchoolIndex((current) =>
        current >= filteredSchools.length - 1 ? 0 : current + 1
      )
      return
    }

    if (e.key === "ArrowUp") {
      e.preventDefault()
      setHighlightedSchoolIndex((current) =>
        current <= 0 ? filteredSchools.length - 1 : current - 1
      )
      return
    }

    if (e.key === "Enter") {
      const schoolToSelect = filteredSchools[highlightedSchoolIndex] || filteredSchools[0]

      if (schoolToSelect) {
        e.preventDefault()
        handleSelectSchool(schoolToSelect)
      }
    }
  }

  useEffect(() => {
    async function loadSchools() {
      const result = await getSchools()
      if (result.success && result.schools) {
        setSchools(result.schools)
      } else {
        setError(result.error || "Failed to load schools")
      }
      setLoading(false)
    }
    loadSchools()
  }, [])

  useEffect(() => {
    if (formData.schoolId) {
      return
    }

    if (!formData.schoolLevel || !hasEnoughSchoolSearch) {
      setHighlightedSchoolIndex(-1)
      return
    }

    if (filteredSchools.length === 1) {
      setHighlightedSchoolIndex(0)
      return
    }

    setHighlightedSchoolIndex(-1)
  }, [filteredSchools, formData.schoolId, formData.schoolLevel, hasEnoughSchoolSearch])

  useEffect(() => {
    if (highlightedSchoolIndex < 0) {
      return
    }

    schoolResultRefs.current[highlightedSchoolIndex]?.scrollIntoView({
      block: "nearest",
    })
  }, [highlightedSchoolIndex])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    // 验证
    if (!formData.email || !formData.password || !formData.name || !formData.schoolLevel || !formData.schoolId) {
      setError("Please fill in all required fields")
      return
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      return
    }
    
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }
    
    setSubmitting(true)
    
    const result = await registerSchoolAdmin(
      formData.email,
      formData.password,
      formData.name,
      formData.schoolId
    )
    
    if (result.success) {
      setSuccess(true)
      // 3 秒后跳转到登录页面
      setTimeout(() => {
        window.location.href = "/school/login"
      }, 3000)
    } else {
      setError(result.error || "Registration failed")
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="flex justify-center p-4 py-16 min-h-full">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <CardTitle className="text-center text-2xl text-green-900">
              Registration Successful!
            </CardTitle>
            <CardDescription className="text-center">
              Your account has been created and is pending approval. You will be able to log in once your account is activated by an administrator. Redirecting to login page...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex justify-center p-4 py-16 min-h-full">
      <Card className="w-full max-w-md">
        <CardHeader>
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <Image
              src="/RGB Logo Verified Video Interviews.png"
              alt="Vericant Logo"
              width={315}
              height={60}
              className="h-auto max-w-full"
              priority
            />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-2xl">Register School Account</CardTitle>
            <CardDescription>
              Create an account to manage your school's interview system
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {/* 学校选择 */}
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>
                  School level <span className="text-red-500">*</span>
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {SCHOOL_LEVEL_OPTIONS.map((option) => (
                    <Button
                      key={option.value}
                      type="button"
                      variant={formData.schoolLevel === option.value ? "default" : "outline"}
                      className="w-full"
                      disabled={submitting || loading}
                      onClick={() => handleSchoolLevelChange(option.value)}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="schoolSearch">
                  School <span className="text-red-500">*</span>
                </Label>
                {loading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-[rgba(0,0,0,0.36)]" />
                    <span className="ml-2 text-sm text-[rgba(0,0,0,0.56)]">Loading schools...</span>
                  </div>
                ) : (
                  <div className="relative">
                    <Input
                      id="schoolSearch"
                      type="text"
                      placeholder={
                        formData.schoolLevel
                          ? "Type at least 2 letters to search..."
                          : "Choose a school level first"
                      }
                      value={schoolSearch}
                      onChange={(e) => handleSchoolSearchChange(e.target.value)}
                      onFocus={() => setIsSchoolSearchFocused(true)}
                      onBlur={() => {
                        window.setTimeout(() => setIsSchoolSearchFocused(false), 150)
                      }}
                      onKeyDown={handleSchoolSearchKeyDown}
                      disabled={submitting || !formData.schoolLevel}
                      autoComplete="off"
                    />

                    {showSchoolResults && (
                      <div className="absolute z-20 mt-2 max-h-64 w-full overflow-y-auto rounded-xl border border-black/[0.08] bg-white shadow-lg">
                        {filteredSchools.length > 0 ? (
                          filteredSchools.map((school, index) => (
                            <button
                              key={school.id}
                              ref={(element) => {
                                schoolResultRefs.current[index] = element
                              }}
                              type="button"
                              className={`block w-full px-4 py-3 text-left text-sm hover:bg-black/[0.04] focus:bg-black/[0.04] focus:outline-none ${
                                index === highlightedSchoolIndex ? "bg-black/[0.04]" : ""
                              }`}
                              onMouseDown={(e) => e.preventDefault()}
                              onMouseEnter={() => setHighlightedSchoolIndex(index)}
                              onClick={() => handleSelectSchool(school)}
                            >
                              <span className="block">{school.name}</span>
                              {school.code && (
                                <span className="block text-xs text-[rgba(0,0,0,0.48)]">
                                  {school.code}
                                </span>
                              )}
                            </button>
                          ))
                        ) : (
                          <div className="px-4 py-3 text-sm text-[rgba(0,0,0,0.56)]">
                            No schools found for this level.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
                {formData.schoolLevel && !formData.schoolId && schoolSearch && !hasEnoughSchoolSearch && (
                  <p className="text-xs text-[rgba(0,0,0,0.48)]">
                    Enter at least 2 letters to search schools.
                  </p>
                )}
                {selectedSchool && (
                  <p className="text-xs text-green-700">
                    Selected: {selectedSchool.name}
                  </p>
                )}
                <p className="text-xs text-[rgba(0,0,0,0.48)]">
                  Don't see your school? Contact support to add it.
                </p>
              </div>
            </div>

            {/* 姓名 */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Your Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                disabled={submitting}
              />
            </div>

            {/* 邮箱 */}
            <div className="space-y-2">
              <Label htmlFor="email">
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@school.edu"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                disabled={submitting}
              />
            </div>

            {/* 密码 */}
            <div className="space-y-2">
              <Label htmlFor="password">
                Password <span className="text-red-500">*</span>
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="At least 6 characters"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                disabled={submitting}
                minLength={6}
              />
            </div>

            {/* 确认密码 */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">
                Confirm Password <span className="text-red-500">*</span>
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Re-enter your password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
                disabled={submitting}
              />
            </div>

            {/* 提交按钮 */}
            <Button
              type="submit"
              className="w-full"
              disabled={submitting || loading}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                "Create Account"
              )}
            </Button>

            {/* 登录链接 */}
            <div className="text-center text-sm text-[rgba(0,0,0,0.56)]">
              Already have an account?{" "}
              <Link href="/school/login" className="text-[#0071e3] hover:underline">
                Sign in
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

