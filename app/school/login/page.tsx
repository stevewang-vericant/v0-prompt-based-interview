"use client"

import { useState } from "react"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { signIn } from "@/app/actions/auth"
import { AlertCircle, Loader2 } from "lucide-react"
import Link from "next/link"

export default function SchoolLoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const result = await signIn(email, password)

    if (result.success) {
      // 登录成功，跳转到 dashboard
      window.location.href = "/school/dashboard"
    } else {
      setError(result.error || "Login failed")
      setLoading(false)
    }
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
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2" suppressHydrationWarning>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="school@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                autoComplete="current-password"
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>

            <div className="text-center text-sm text-slate-600">
              Don't have an account?{" "}
              <Link href="/school/register" className="text-blue-600 hover:underline">
                Register your school
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
