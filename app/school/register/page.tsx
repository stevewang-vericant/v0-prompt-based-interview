"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getSchools, registerSchoolAdmin, type School } from "@/app/actions/auth"
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react"
import Link from "next/link"

export default function SchoolRegisterPage() {
  const [schools, setSchools] = useState<School[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    schoolId: ""
  })

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    // 验证
    if (!formData.email || !formData.password || !formData.name || !formData.schoolId) {
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
            <div className="space-y-2">
              <Label htmlFor="school">
                School <span className="text-red-500">*</span>
              </Label>
              {loading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                  <span className="ml-2 text-sm text-slate-600">Loading schools...</span>
                </div>
              ) : (
                <select
                  id="school"
                  value={formData.schoolId}
                  onChange={(e) => setFormData({ ...formData, schoolId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={submitting}
                >
                  <option value="">Select your school...</option>
                  {schools.map((school) => (
                    <option key={school.id} value={school.id}>
                      {school.name}
                    </option>
                  ))}
                </select>
              )}
              <p className="text-xs text-slate-500">
                Don't see your school? Contact support to add it.
              </p>
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
            <div className="text-center text-sm text-slate-600">
              Already have an account?{" "}
              <Link href="/school/login" className="text-blue-600 hover:underline">
                Sign in
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

