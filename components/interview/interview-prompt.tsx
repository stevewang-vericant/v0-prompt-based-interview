"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Circle, Square } from "lucide-react"

interface Prompt {
  id: string
  category: string
  text: string
  preparationTime: number
  responseTime: number
}

interface InterviewPromptProps {
  prompt: Prompt
  promptNumber: number
  totalPrompts: number
  onComplete: (promptId: string, videoBlob: Blob) => void
}

type Stage = "reading" | "preparing" | "recording" | "review"

export function InterviewPrompt({ prompt, promptNumber, totalPrompts, onComplete }: InterviewPromptProps) {
  const [stage, setStage] = useState<Stage>("reading")
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    let interval: NodeJS.Timeout

    if (stage === "preparing" || stage === "recording") {
      interval = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            if (stage === "preparing") {
              startRecording()
            } else if (stage === "recording") {
              stopRecording()
            }
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => clearInterval(interval)
  }, [stage])

  const startPreparation = () => {
    setStage("preparing")
    setTimeRemaining(prompt.preparationTime)
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }

      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" })
        setRecordedBlob(blob)
        setRecordedUrl(URL.createObjectURL(blob))
        setStage("review")

        // Stop stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop())
        }
      }

      mediaRecorder.start()
      setStage("recording")
      setTimeRemaining(prompt.responseTime)
    } catch (err) {
      console.error("[v0] Recording error:", err)
      alert("Unable to start recording. Please check your permissions.")
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop()
    }
  }

  const handleRetake = () => {
    setRecordedBlob(null)
    setRecordedUrl(null)
    setStage("reading")
  }

  const handleContinue = () => {
    if (recordedBlob) {
      onComplete(prompt.id, recordedBlob)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const getProgressPercentage = () => {
    const maxTime = stage === "preparing" ? prompt.preparationTime : prompt.responseTime
    return ((maxTime - timeRemaining) / maxTime) * 100
  }

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">
              Question {promptNumber} of {totalPrompts}
            </span>
            <Badge variant="secondary">{prompt.category}</Badge>
          </div>
          <Progress value={(promptNumber / totalPrompts) * 100} className="h-2" />
        </CardContent>
      </Card>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl text-balance">{prompt.text}</CardTitle>
          {stage === "reading" && (
            <CardDescription>Read the prompt carefully and click "Start Preparation" when ready</CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Reading Stage */}
          {stage === "reading" && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                <p className="text-sm font-medium text-blue-900">What to expect:</p>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                  <li>Preparation time: {prompt.preparationTime} seconds</li>
                  <li>Recording time: {prompt.responseTime} seconds</li>
                  <li>You can retake your response if needed</li>
                </ul>
              </div>
              <Button onClick={startPreparation} className="w-full" size="lg">
                Start Preparation
              </Button>
            </div>
          )}

          {/* Preparing Stage */}
          {stage === "preparing" && (
            <div className="space-y-4">
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-blue-100 mb-4">
                  <span className="text-4xl font-bold text-blue-600">{timeRemaining}</span>
                </div>
                <p className="text-lg font-medium">Preparation Time</p>
                <p className="text-sm text-muted-foreground">Think about your response</p>
              </div>
              <Progress value={getProgressPercentage()} className="h-2" />
            </div>
          )}

          {/* Recording Stage */}
          {stage === "recording" && (
            <div className="space-y-4">
              <div className="relative rounded-lg overflow-hidden border-2 border-red-500 bg-black">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-auto" />
                <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-600 text-white px-3 py-1.5 rounded-full">
                  <Circle className="h-3 w-3 fill-current animate-pulse" />
                  <span className="text-sm font-medium">Recording</span>
                </div>
                <div className="absolute top-4 right-4 bg-black/75 text-white px-4 py-2 rounded-full">
                  <span className="text-2xl font-bold">{formatTime(timeRemaining)}</span>
                </div>
              </div>
              <Progress value={getProgressPercentage()} className="h-2" />
              <Button onClick={stopRecording} variant="destructive" className="w-full" size="lg">
                <Square className="h-4 w-4 mr-2 fill-current" />
                Stop Recording
              </Button>
            </div>
          )}

          {/* Review Stage */}
          {stage === "review" && recordedUrl && (
            <div className="space-y-4">
              <div className="relative rounded-lg overflow-hidden border border-slate-200 bg-black">
                <video src={recordedUrl} controls className="w-full h-auto" />
              </div>
              <div className="flex gap-3">
                <Button onClick={handleRetake} variant="outline" className="flex-1 bg-transparent" size="lg">
                  Retake Response
                </Button>
                <Button onClick={handleContinue} className="flex-1" size="lg">
                  {promptNumber === totalPrompts ? "Complete Interview" : "Next Question"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
