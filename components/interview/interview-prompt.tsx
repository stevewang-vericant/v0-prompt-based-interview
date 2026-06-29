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
  onComplete: (
    promptId: string,
    videoBlob: Blob,
    prepDurationSec: number,
  ) => Promise<void>
}

type Stage = "reading" | "preparing" | "recording"

// 录制码率上限：720p 面试用 1.5 Mbps 视频 + 64 kbps 音频已足够清晰，
// 约 110s 的 prep+response 分段只有 ~20MB，远低于 nginx(100M)/Server Actions(50MB) 限制。
// 不设这些参数时浏览器会用默认高码率（可达 ~10 Mbps），曾导致单段 ~140MB 触发 413 上传失败。
const VIDEO_BITS_PER_SECOND = 1_500_000
const AUDIO_BITS_PER_SECOND = 64_000

// 按优先级挑选当前浏览器支持的 webm 编码，避免在不支持指定 codec 时构造失败。
function buildRecorderOptions(): MediaRecorderOptions {
  const options: MediaRecorderOptions = {
    videoBitsPerSecond: VIDEO_BITS_PER_SECOND,
    audioBitsPerSecond: AUDIO_BITS_PER_SECOND,
  }

  if (typeof MediaRecorder !== "undefined" && typeof MediaRecorder.isTypeSupported === "function") {
    const preferredTypes = [
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,opus",
      "video/webm",
    ]
    const supported = preferredTypes.find((type) => MediaRecorder.isTypeSupported(type))
    if (supported) {
      options.mimeType = supported
    }
  }

  return options
}

export function InterviewPrompt({ prompt, promptNumber, totalPrompts, onComplete }: InterviewPromptProps) {
  const [stage, setStage] = useState<Stage>("reading")
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [streamInitialized, setStreamInitialized] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const shouldProcessUploadRef = useRef(true)
  // 记录这一题实际使用的 prep 时长（秒），用于服务端在合成"仅 response"视频时
  // 知道要从片段开头裁掉多少秒。即使 prompt 对象变化也保留启动时的值。
  const prepDurationRef = useRef<number>(0)

  useEffect(() => {
    const initializeStream = async () => {
      try {
        console.log("[v0] Initializing media stream...")
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720, facingMode: "user" },
          audio: true,
        })
        streamRef.current = stream
        setStreamInitialized(true)
        console.log("[v0] Stream initialized successfully")
      } catch (err) {
        console.error("[v0] Stream initialization error:", err)
        alert("Unable to access camera and microphone. Please check your permissions.")
      }
    }

    if (!streamRef.current) {
      initializeStream()
    }

    return () => {
      console.log("[v0] Cleaning up on unmount")
      shouldProcessUploadRef.current = false
      
      // 先清空 chunks，防止累积
      chunksRef.current = []
      
      // 停止并清理 MediaRecorder
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        console.log("[v0] Stopping active MediaRecorder without processing")
        mediaRecorderRef.current.stop()
        mediaRecorderRef.current = null
      }
      
      // 然后清理 stream
      if (streamRef.current) {
        console.log("[v0] Stopping stream tracks")
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (
      streamInitialized &&
      streamRef.current &&
      videoRef.current &&
      (stage === "preparing" || stage === "recording")
    ) {
      console.log("[v0] Attaching stream to video element for stage:", stage)
      videoRef.current.srcObject = streamRef.current
      videoRef.current.play().catch((err) => console.error("[v0] Play error:", err))
    }
  }, [streamInitialized, stage])

  useEffect(() => {
    console.log("[v0] Prompt changed:", prompt.id, "Question:", promptNumber)
    shouldProcessUploadRef.current = true // 重置标记，允许新问题上传
    setStage("reading")
    setRecordedBlob(null)
    setTimeRemaining(0)

    if (promptNumber > 1) {
      setTimeout(() => {
        console.log("[v0] Auto-starting preparation for question", promptNumber)
        startPreparation()
      }, 100)
    }
  }, [prompt.id, promptNumber])

  useEffect(() => {
    let interval: NodeJS.Timeout

    if (stage === "preparing" || stage === "recording") {
      interval = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            if (stage === "preparing") {
              // prep 倒计时结束 → UI 进入 response 阶段，但 MediaRecorder 不重启，
              // 整段 prep + response 是一次连续录制
              transitionToResponse()
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

  const startPreparation = async () => {
    try {
      console.log("[v0] Starting preparation (recording prep + response continuously)")

      if (!streamRef.current) {
        console.error("[v0] No stream available")
        alert("Camera not ready. Please refresh and try again.")
        return
      }

      if (videoRef.current) {
        videoRef.current.srcObject = streamRef.current
        videoRef.current.muted = true
        await videoRef.current.play().catch(() => {})
      }

      // 一开始就启动录像，覆盖整段 prep + response
      // 显式限制码率，避免浏览器默认高码率把单个分段撑到 100MB+ 触发上传 413。
      const mediaRecorder = new MediaRecorder(streamRef.current, buildRecorderOptions())
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []
      prepDurationRef.current = prompt.preparationTime

      const currentChunks: Blob[] = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          currentChunks.push(event.data)
          console.log("[v0] Data chunk received:", event.data.size, "bytes")
        }
      }

      mediaRecorder.onstop = async () => {
        console.log("[v0] Recording stopped, creating blob")

        if (!shouldProcessUploadRef.current) {
          console.log("[v0] Component unmounting, ignoring onstop event")
          return
        }

        if (currentChunks.length === 0) {
          console.log("[v0] No chunks recorded, ignoring onstop event")
          return
        }

        const blob = new Blob(currentChunks, { type: "video/webm" })
        console.log(
          "[v0] Blob created, size:",
          blob.size,
          "bytes (includes prep + response)",
        )
        setRecordedBlob(blob)

        try {
          console.log("[v0] Calling onComplete to upload video")
          await onComplete(prompt.id, blob, prepDurationRef.current)
          console.log("[v0] onComplete finished successfully")
        } catch (error) {
          console.error("[v0] Error in onComplete:", error)
          alert("Failed to process video. Please try again.")
        }
      }

      mediaRecorder.start()
      console.log("[v0] MediaRecorder started for prep phase")

      setStage("preparing")
      setTimeRemaining(prompt.preparationTime)
    } catch (err) {
      console.error("[v0] Recording error:", err)
      alert("Unable to start recording. Please check your camera and microphone permissions.")
    }
  }

  // prep -> response 仅切换 UI；MediaRecorder 持续运行
  const transitionToResponse = () => {
    console.log("[v0] Transition: preparing -> recording (recorder keeps running)")
    setStage("recording")
    setTimeRemaining(prompt.responseTime)
  }

  const stopRecording = () => {
    console.log("[v0] Stopping recording")
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop()
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
          {stage !== "reading" && <CardTitle className="text-sm sm:text-base font-medium text-balance">{prompt.text}</CardTitle>}
          {stage === "reading" && (
            <CardDescription className="text-sm sm:text-base">Read the prompt carefully and click "Start Preparation" when ready</CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Reading Stage - Only show for first question */}
          {stage === "reading" && (
            <div className="space-y-4">
              <div className="bg-[#0071e3]/5 border border-blue-200 rounded-lg p-4 space-y-2">
                <p className="text-sm font-medium text-blue-900">What to expect:</p>
                <ul className="text-sm text-[#0071e3] space-y-1 list-disc list-inside">
                  <li>Preparation time: {prompt.preparationTime} seconds (recorded)</li>
                  <li>Recording time: {prompt.responseTime} seconds</li>
                </ul>
                <p className="text-xs text-blue-900/80 pt-1">
                  Recording starts as soon as you click below. Both your preparation and your response
                  are saved and shared with the school.
                </p>
              </div>
              <Button onClick={startPreparation} className="w-full" size="lg">
                Start Preparation (recording begins)
              </Button>
            </div>
          )}

          {/* Preparing Stage — recorder is running, show camera preview */}
          {stage === "preparing" && (
            <div className="space-y-4">
              <div className="bg-[#0071e3]/5 border border-blue-200 rounded-lg p-4 space-y-2 mb-4">
                <p className="text-sm font-medium text-blue-900">Preparation Phase (recording)</p>
                <ul className="text-sm text-[#0071e3] space-y-1 list-disc list-inside">
                  <li>Use this time to think about your response</li>
                  <li>You are being recorded — the school will see this preparation segment</li>
                  <li>Response phase will start automatically when prep time is up</li>
                  <li>You'll have {prompt.responseTime} seconds to respond</li>
                </ul>
              </div>
              <div className="relative rounded-lg overflow-hidden border-2 border-amber-500 bg-[#1d1d1f]">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-auto min-h-[250px] sm:min-h-[400px] bg-[#1d1d1f]"
                />
                <div className="absolute top-2 left-2 sm:top-4 sm:left-4 flex items-center gap-1 sm:gap-2 bg-amber-600 text-white px-2 py-1 sm:px-3 sm:py-1.5 rounded-full text-xs sm:text-sm">
                  <Circle className="h-2 w-2 sm:h-3 sm:w-3 fill-current animate-pulse" />
                  <span className="font-medium">Recording (Preparation)</span>
                </div>
                <div className="absolute top-2 right-2 sm:top-4 sm:right-4 bg-black/75 text-white px-2 py-1 sm:px-4 sm:py-2 rounded-full">
                  <span className="text-lg sm:text-2xl font-bold">{formatTime(timeRemaining)}</span>
                </div>
              </div>
              <Progress value={getProgressPercentage()} className="h-2" />
              <p className="text-xs text-center text-muted-foreground">
                Preparation time remaining — response phase starts automatically
              </p>
            </div>
          )}

          {/* Recording Stage */}
          {stage === "recording" && (
            <div className="space-y-4">
              <div className="relative rounded-lg overflow-hidden border-2 border-red-500 bg-[#1d1d1f]">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-auto min-h-[250px] sm:min-h-[400px] bg-[#1d1d1f]" />
                <div className="absolute top-2 left-2 sm:top-4 sm:left-4 flex items-center gap-1 sm:gap-2 bg-red-600 text-white px-2 py-1 sm:px-3 sm:py-1.5 rounded-full text-xs sm:text-sm">
                  <Circle className="h-2 w-2 sm:h-3 sm:w-3 fill-current animate-pulse" />
                  <span className="font-medium">Recording (Response)</span>
                </div>
                <div className="absolute top-2 right-2 sm:top-4 sm:right-4 bg-black/75 text-white px-2 py-1 sm:px-4 sm:py-2 rounded-full">
                  <span className="text-lg sm:text-2xl font-bold">{formatTime(timeRemaining)}</span>
                </div>
              </div>
              <Progress value={getProgressPercentage()} className="h-2" />
              <Button onClick={stopRecording} variant="destructive" className="w-full" size="lg">
                <Square className="h-4 w-4 mr-2 fill-current" />
                {promptNumber < totalPrompts ? "Done — Next Question" : "Done"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
