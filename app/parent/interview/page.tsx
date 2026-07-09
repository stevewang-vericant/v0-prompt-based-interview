"use client"

import { useState, Suspense, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { InterviewSetup } from "@/components/interview/interview-setup"
import { InterviewParentInfo, type ParentInfo } from "@/components/interview/interview-parent-info"
import { InterviewPrompt } from "@/components/interview/interview-prompt"
import { InterviewComplete } from "@/components/interview/interview-complete"
import { InterviewIntro } from "@/components/interview/interview-intro"
import { uploadParentVideoToB2AndSave, saveParentInterview } from "@/app/actions/parent-interviews"
import { getParentPromptsBySchoolCode } from "@/app/actions/parent-prompts"
import { getSchoolBrandingByCode } from "@/app/actions/school-branding"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

interface ParentPrompt {
  id: string
  category: string
  text: string
  translatedText: string
  preparationTime: number
  responseTime: number
}

type Stage = "parent-info" | "setup" | "interview" | "complete"

function ParentInterviewContent() {
  const searchParams = useSearchParams()
  const schoolCode = searchParams.get("school")

  const [isUnsupportedDevice, setIsUnsupportedDevice] = useState(false)
  const [stage, setStage] = useState<Stage>("parent-info")
  const [branding, setBranding] = useState<{ logoUrl: string | null; introVideoUrl: string | null; name: string | null }>({
    logoUrl: null,
    introVideoUrl: null,
    name: null,
  })
  const [introAcknowledged, setIntroAcknowledged] = useState(false)
  const [brandingLoading, setBrandingLoading] = useState(true)

  const [parentInfo, setParentInfo] = useState<ParentInfo | null>(null)
  const [prompts, setPrompts] = useState<ParentPrompt[]>([])
  const [promptsLoading, setPromptsLoading] = useState(false)
  const [promptsError, setPromptsError] = useState<string | null>(null)

  const [currentPromptIndex, setCurrentPromptIndex] = useState(0)
  const [responses, setResponses] = useState<Record<string, { blob: Blob; prepDuration: number }>>({})
  const [interviewCompleted, setInterviewCompleted] = useState(false)
  const [interviewId, setInterviewId] = useState("")

  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStatus, setUploadStatus] = useState("")

  useEffect(() => {
    if (typeof window === "undefined") return
    const ua = navigator.userAgent || ""
    const isPhone = /iPhone|iPod|Android.*Mobile|Windows Phone|IEMobile|Opera Mini/i.test(ua)
    const isTablet = /iPad|Tablet|PlayBook|Silk/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua))
    const isIPadOS = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1
    setIsUnsupportedDevice(isPhone || isTablet || isIPadOS)
  }, [])

  useEffect(() => {
    if (!interviewId) {
      setInterviewId(`parent-interview-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`)
    }
  }, [interviewId])

  useEffect(() => {
    if (!schoolCode) {
      setBrandingLoading(false)
      return
    }
    const loadBranding = async () => {
      try {
        setBrandingLoading(true)
        const result = await getSchoolBrandingByCode(schoolCode)
        if (result.success && result.branding) {
          setBranding({
            logoUrl: result.branding.logoUrl,
            introVideoUrl: result.branding.introVideoUrl,
            name: result.branding.name,
          })
        }
      } finally {
        setBrandingLoading(false)
      }
    }
    loadBranding()
  }, [schoolCode])

  const handleParentInfoComplete = async (info: ParentInfo) => {
    setParentInfo(info)
    if (!schoolCode) {
      setPromptsError("This interview link is missing a school code.")
      return
    }

    setPromptsLoading(true)
    setPromptsError(null)
    try {
      const result = await getParentPromptsBySchoolCode(schoolCode, info.preferredLanguage)
      if (!result.success || !result.prompts || result.prompts.length === 0) {
        setPromptsError(result.error || "This school has not configured parent interview questions yet.")
        return
      }
      setPrompts(result.prompts)
      setStage("setup")
    } catch (err) {
      setPromptsError(err instanceof Error ? err.message : "Failed to load questions")
    } finally {
      setPromptsLoading(false)
    }
  }

  const handleSetupComplete = () => setStage("interview")

  const handlePromptComplete = async (promptId: string, videoBlob: Blob, prepDurationSec: number) => {
    if (interviewCompleted) return
    setResponses((prev) => ({ ...prev, [promptId]: { blob: videoBlob, prepDuration: prepDurationSec } }))

    if (currentPromptIndex < prompts.length - 1) {
      setCurrentPromptIndex((prev) => prev + 1)
    } else {
      setInterviewCompleted(true)
      setStage("complete")
    }
  }

  const handleSubmit = async () => {
    if (!parentInfo) return

    setIsUploading(true)
    setUploadProgress(0)
    setUploadStatus("Preparing to upload...")

    try {
      const uploadedSegments: Array<{
        url: string
        sequenceNumber: number
        duration: number
        prepDuration: number
        promptId: string
        questionText: string
        category: string
      }> = []

      for (let i = 0; i < prompts.length; i++) {
        const prompt = prompts[i]
        const recorded = responses[prompt.id]
        if (!recorded) continue

        setUploadProgress(Math.floor((i / prompts.length) * 80))
        setUploadStatus(`Uploading response ${i + 1} of ${prompts.length}...`)

        const result = await uploadParentVideoToB2AndSave(
          recorded.blob,
          interviewId,
          i + 1,
          prompt.text,
          prompt.category,
          prompt.responseTime,
          recorded.prepDuration,
          i === 0 ? schoolCode : null,
          i === 0
            ? {
                parentName: parentInfo.parentName,
                parentEmail: parentInfo.parentEmail,
                parentPhone: parentInfo.parentPhone,
                relationship: parentInfo.relationship,
                preferredLanguage: parentInfo.preferredLanguage,
                studentName: parentInfo.studentName,
                studentEmail: parentInfo.studentEmail,
                studentDateOfBirth: parentInfo.studentDateOfBirth,
              }
            : undefined,
        )

        if (!result.success) {
          throw new Error(`Failed to upload response ${i + 1}: ${result.error}`)
        }

        const estimatedDuration = Math.max(30, Math.min(120, Math.round(recorded.blob.size / 20000)))
        uploadedSegments.push({
          url: result.videoUrl!,
          sequenceNumber: i + 1,
          duration: estimatedDuration,
          prepDuration: recorded.prepDuration,
          promptId: prompt.id,
          questionText: prompt.text,
          category: prompt.category,
        })
      }

      if (uploadedSegments.length === 0) {
        throw new Error("No responses to upload")
      }

      setUploadProgress(90)
      setUploadStatus("Saving interview...")
      await saveParentInterview({
        interview_id: interviewId,
        total_duration: uploadedSegments.reduce((sum, s) => sum + s.duration, 0),
        metadata: {
          status: "uploaded",
          segmentCount: uploadedSegments.length,
          segments: uploadedSegments.map((s) => ({
            promptId: s.promptId,
            questionText: s.questionText,
            category: s.category,
            sequenceNumber: s.sequenceNumber,
            videoUrl: s.url,
            duration: s.duration,
            prepDuration: s.prepDuration,
          })),
          submittedAt: new Date().toISOString(),
        },
      })

      setUploadProgress(95)
      setUploadStatus("Starting background video processing...")
      fetch("/api/merge-videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interviewId, segments: uploadedSegments }),
      }).catch((err) => console.error("[ParentInterview] Failed to start merge:", err))

      setUploadProgress(100)
      setUploadStatus("Upload complete! You can now close this window.")

      const params = new URLSearchParams({ status: "success", email: parentInfo.parentEmail })
      setTimeout(() => {
        window.location.href = `/parent/interview/complete?${params.toString()}`
      }, 1000)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error"
      const params = new URLSearchParams({ status: "error", error: message })
      window.location.href = `/parent/interview/complete?${params.toString()}`
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <header className="bg-white border-b border-black/[0.06]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-[#1d1d1f]">Parent Video Interview</h1>
              <p className="text-sm text-[rgba(0,0,0,0.56)]">
                {stage === "parent-info" && "Parent information"}
                {stage === "setup" && "System check and preparation"}
                {stage === "interview" && prompts.length > 0 && `Question ${currentPromptIndex + 1} of ${prompts.length}`}
                {stage === "complete" && "Interview completed"}
              </p>
              {schoolCode && (
                <p className="text-xs text-[rgba(0,0,0,0.48)] mt-1">
                  School: <span className="font-medium">{schoolCode}</span>
                </p>
              )}
            </div>
            {branding.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`/api/proxy-video?url=${encodeURIComponent(branding.logoUrl)}`}
                alt={branding.name ? `${branding.name} logo` : "School logo"}
                className="h-12 w-auto max-w-[220px] object-contain"
              />
            ) : (
              (stage === "parent-info" || stage === "setup") && (
                <Image
                  src="/RGB Logo Verified Video Interviews.png"
                  alt="Vericant Logo"
                  width={210}
                  height={40}
                  className="h-10 w-auto"
                  priority
                />
              )
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!schoolCode && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Missing School Code</AlertTitle>
            <AlertDescription>
              This interview link is missing a school code. Please use the link provided by the school.
            </AlertDescription>
          </Alert>
        )}

        {isUnsupportedDevice && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Device Not Supported for Recording</AlertTitle>
            <AlertDescription>
              Video recording is only available on a PC or Mac. Please reopen this link on a desktop or laptop computer.
            </AlertDescription>
          </Alert>
        )}

        {promptsError && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Unable to Start Interview</AlertTitle>
            <AlertDescription>{promptsError}</AlertDescription>
          </Alert>
        )}

        {brandingLoading && stage === "parent-info" && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#0071e3] border-t-transparent"></div>
          </div>
        )}

        {!isUnsupportedDevice && !brandingLoading && (
          <>
            {stage === "parent-info" && branding.introVideoUrl && !introAcknowledged && (
              <InterviewIntro
                videoUrl={branding.introVideoUrl}
                schoolName={branding.name}
                onContinue={() => setIntroAcknowledged(true)}
              />
            )}

            {stage === "parent-info" && (!branding.introVideoUrl || introAcknowledged) && (
              <>
                {promptsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#0071e3] border-t-transparent mx-auto"></div>
                      <p className="mt-2 text-sm text-[rgba(0,0,0,0.56)]">Loading interview questions...</p>
                    </div>
                  </div>
                ) : (
                  <InterviewParentInfo onSubmit={handleParentInfoComplete} schoolName={branding.name} />
                )}
              </>
            )}

            {stage === "setup" && (
              <InterviewSetup
                onComplete={handleSetupComplete}
                preparationTime={prompts[0]?.preparationTime}
                responseTime={prompts[0]?.responseTime}
                totalPrompts={prompts.length}
                showFreeSpeech={false}
                promptNoun="question"
              />
            )}

            {stage === "interview" && prompts[currentPromptIndex] && (
              <InterviewPrompt
                prompt={prompts[currentPromptIndex]}
                promptNumber={currentPromptIndex + 1}
                totalPrompts={prompts.length}
                onComplete={handlePromptComplete}
              />
            )}

            {stage === "complete" && (
              <InterviewComplete
                responsesCount={Object.keys(responses).length}
                onSubmit={handleSubmit}
                isUploading={isUploading}
                uploadProgress={uploadProgress}
                uploadStatus={uploadStatus}
                interviewId={interviewId}
              />
            )}
          </>
        )}
      </main>
    </div>
  )
}

export default function ParentInterviewPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-[#f5f5f7]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#0071e3] border-t-transparent mx-auto"></div>
            <p className="mt-2 text-sm text-[rgba(0,0,0,0.56)]">Loading interview...</p>
          </div>
        </div>
      }
    >
      <ParentInterviewContent />
    </Suspense>
  )
}
