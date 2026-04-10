"use client"

import { useState } from "react"
import Image from "next/image"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
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
      window.location.href = "/school/dashboard"
    } else {
      setError(result.error || "Login failed")
      setLoading(false)
    }
  }

  return (
    <div className="flex justify-center items-center p-4 py-16 min-h-full bg-[#f5f5f7]">
      <Card className="w-full max-w-md bg-white rounded-2xl shadow-[0_3px_30px_rgba(0,0,0,0.08)]">
        <CardHeader className="text-center pb-2 pt-8">
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
        <CardContent className="px-8 pb-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <Alert variant="destructive" className="rounded-xl border-[#ff3b30]/20 bg-[#ff3b30]/5">
                <AlertCircle className="h-4 w-4 text-[#ff3b30]" />
                <AlertDescription className="text-[#ff3b30]">{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2" suppressHydrationWarning>
              <Label htmlFor="email" className="text-sm font-medium text-[#1d1d1f] tracking-tight">Email</Label>
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
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium text-[#1d1d1f] tracking-tight">Password</Label>
                <Link 
                  href="/school/forgot-password" 
                  className="text-sm text-[#0066cc] hover:text-[#0066cc]/80 tracking-tight transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
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

            <div className="text-center text-sm text-[rgba(0,0,0,0.48)] tracking-tight">
              Don&apos;t have an account?{" "}
              <Link href="/school/register" className="text-[#0066cc] hover:text-[#0066cc]/80 transition-colors">
                Register your school
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
