"use client"

import { useState, useEffect, Suspense } from "react"
import Image from "next/image"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { verifyResetToken, resetPasswordWithToken } from "@/app/actions/auth"
import { AlertCircle, Loader2, CheckCircle2, ArrowLeft, Eye, EyeOff } from "lucide-react"

function ResetPasswordContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get("token")

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(true)
  const [tokenValid, setTokenValid] = useState(false)

  // Verify token on mount
  useEffect(() => {
    async function checkToken() {
      if (!token) {
        setError("Invalid reset link. Please request a new password reset.")
        setVerifying(false)
        return
      }

      const result = await verifyResetToken(token)
      
      if (result.success && result.valid) {
        setTokenValid(true)
      } else {
        setError(result.error || "Invalid or expired reset link")
      }
      setVerifying(false)
    }

    checkToken()
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate password
    if (password.length < 8) {
      setError("Password must be at least 8 characters long")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (!token) {
      setError("Invalid reset token")
      return
    }

    setLoading(true)

    const result = await resetPasswordWithToken(token, password)

    if (result.success) {
      setSuccess(true)
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push("/school/login")
      }, 3000)
    } else {
      setError(result.error || "Failed to reset password")
    }
    setLoading(false)
  }

  // Loading state
  if (verifying) {
    return (
      <div className="flex justify-center p-4 py-16 min-h-full">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 pb-8">
            <div className="flex flex-col items-center justify-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <p className="text-slate-600">Verifying reset link...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex justify-center p-4 py-16 min-h-full">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-4">
          {/* Logo */}
          <div className="flex justify-center">
            <Image
              src="/RGB Logo Verified Video Interviews.png"
              alt="Vericant Logo"
              width={315}
              height={60}
              className="h-auto max-w-full"
              priority
            />
          </div>
        </CardHeader>
        <CardContent>
          {success ? (
            // Success state
            <div className="space-y-4">
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Your password has been reset successfully!
                </AlertDescription>
              </Alert>
              
              <p className="text-sm text-slate-600 text-center">
                密码重置成功！您将在3秒后跳转到登录页面...
              </p>

              <div className="text-center pt-4">
                <Link 
                  href="/school/login"
                  className="inline-flex items-center text-blue-600 hover:underline"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Go to Login Now
                </Link>
              </div>
            </div>
          ) : !tokenValid ? (
            // Invalid token state
            <div className="space-y-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
              
              <p className="text-sm text-slate-600 text-center">
                重置链接无效或已过期。请重新请求密码重置。
              </p>

              <div className="flex flex-col space-y-2 pt-4">
                <Link href="/school/forgot-password">
                  <Button className="w-full">Request New Reset Link</Button>
                </Link>
                <Link 
                  href="/school/login"
                  className="inline-flex items-center justify-center text-blue-600 hover:underline text-sm"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back to Login
                </Link>
              </div>
            </div>
          ) : (
            // Form state
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="text-center mb-4">
                <h2 className="text-lg font-semibold text-slate-900">Reset Your Password</h2>
                <p className="text-sm text-slate-600 mt-1">
                  Enter your new password below.
                </p>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter new password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    autoComplete="new-password"
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-slate-500">Minimum 8 characters</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={loading}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading || !password || !confirmPassword}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Resetting Password...
                  </>
                ) : (
                  "Reset Password"
                )}
              </Button>

              <div className="text-center text-sm text-slate-600">
                <Link 
                  href="/school/login" 
                  className="inline-flex items-center text-blue-600 hover:underline"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back to Login
                </Link>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center p-4 py-16 min-h-full">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 pb-8">
            <div className="flex flex-col items-center justify-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <p className="text-slate-600">Loading...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  )
}
