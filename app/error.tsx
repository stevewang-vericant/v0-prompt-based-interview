"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[App Error Boundary]", error)
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5f5f7] px-4">
      <div className="w-full max-w-md rounded-2xl border border-black/[0.06] bg-white p-8 text-center shadow-sm">
        <h1 className="text-xl font-semibold text-[#1d1d1f]">Something went wrong</h1>
        <p className="mt-2 text-sm text-[#6e6e73]">
          An unexpected error occurred. Please try again. If the problem persists, contact support.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button onClick={() => reset()}>Try again</Button>
          <Button variant="outline" onClick={() => (window.location.href = "/")}>
            Go home
          </Button>
        </div>
      </div>
    </div>
  )
}
