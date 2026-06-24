"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlayCircle } from "lucide-react"

interface InterviewIntroProps {
  videoUrl: string
  schoolName?: string | null
  onContinue: () => void
}

// B2-hosted media must be served same-origin because the app sends a
// Cross-Origin-Embedder-Policy: require-corp header.
const toProxyUrl = (url: string) => `/api/proxy-video?url=${encodeURIComponent(url)}`

export function InterviewIntro({ videoUrl, schoolName, onContinue }: InterviewIntroProps) {
  const [ended, setEnded] = useState(false)

  return (
    <Card className="mx-auto max-w-3xl">
      <CardHeader>
        <div className="flex items-center gap-2">
          <PlayCircle className="h-5 w-5 text-[#0071e3]" />
          <div>
            <CardTitle>
              {schoolName ? `Welcome from ${schoolName}` : "Welcome"}
            </CardTitle>
            <CardDescription>
              Please watch this short introduction before you begin your interview.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="overflow-hidden rounded-lg border border-black/[0.06] bg-black">
          <video
            key={videoUrl}
            src={toProxyUrl(videoUrl)}
            controls
            autoPlay
            playsInline
            className="w-full max-h-[60vh]"
            onEnded={() => setEnded(true)}
          />
        </div>
        <div className="flex items-center justify-end gap-3">
          {!ended && (
            <span className="text-xs text-[rgba(0,0,0,0.48)]">
              You can continue at any time.
            </span>
          )}
          <Button size="lg" onClick={onContinue}>
            Continue to Interview
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
