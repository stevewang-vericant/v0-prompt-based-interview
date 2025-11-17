"use client"

import { useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { InterviewSetup } from "@/components/interview/interview-setup"
import { InterviewPrompt } from "@/components/interview/interview-prompt"
import { InterviewComplete } from "@/components/interview/interview-complete"
import { uploadVideoToB2AndSave } from "@/app/actions/upload-video"
import { uploadJsonToB2 } from "@/app/actions/upload-json"
import { saveInterview } from "@/app/actions/interviews"
import { startTranscription } from '@/app/actions/transcription'
import { getVideoDuration } from '@/lib/video-utils'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

interface Prompt {
  id: string
  category: string
  text: string
  preparationTime: number
  responseTime: number
}

const mockPrompts: Prompt[] = [
  {
    id: "1",
    category: "Conversational Fluency",
    text: "Tell me about your favorite hobby and why you enjoy it.",
    preparationTime: 5, // TODO: 测试完成后改回 15
    responseTime: 60,
  },
  {
    id: "2",
    category: "Critical Thinking",
    text: "Describe a time when you had to solve a complex problem. What approach did you take and what was the outcome?",
    preparationTime: 5, // TODO: 测试完成后改回 15
    responseTime: 60,
  },
  {
    id: "3",
    category: "General Knowledge",
    text: "What do you think is the most important global challenge facing our generation?",
    preparationTime: 5, // TODO: 测试完成后改回 15
    responseTime: 60,
  },
  {
    id: "4",
    category: "Critical Thinking",
    text: "Describe a situation where you had to work with someone whose perspective was very different from yours. How did you handle it?",
    preparationTime: 5, // TODO: 测试完成后改回 15
    responseTime: 60,
  },
]

type InterviewStage = "setup" | "interview" | "complete"

function InterviewPageContent() {
  const searchParams = useSearchParams()
  const schoolCode = searchParams.get("school")
  
  const [stage, setStage] = useState<InterviewStage>("setup")
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0)
  const [responses, setResponses] = useState<Record<string, Blob>>({})
  const [interviewId] = useState(() => `interview-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`)
  const [isUploading, setIsUploading] = useState(false)
  const [interviewCompleted, setInterviewCompleted] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStatus, setUploadStatus] = useState("")

  const handleSetupComplete = () => {
    setStage("interview")
  }

  const handlePromptComplete = async (promptId: string, videoBlob: Blob) => {
    // 防止重复上传：如果面试已完成，忽略后续录制
    if (interviewCompleted) {
      console.log("[v0] Interview already completed, ignoring duplicate upload")
      return
    }

    console.log("[v0] Prompt completed:", promptId, "Blob size:", videoBlob.size)
    setResponses((prev) => ({ ...prev, [promptId]: videoBlob }))

    if (currentPromptIndex < mockPrompts.length - 1) {
      // 还有更多问题，继续下一题
      setCurrentPromptIndex((prev) => prev + 1)
    } else {
      // 所有问题完成，切换到 complete 阶段，等待用户输入邮箱
      console.log("[v0] All prompts completed, waiting for student information...")
      setInterviewCompleted(true)
      setStage("complete")
    }
  }

  const uploadSegmentVideos = async (
    allResponses: Record<string, Blob>,
    studentEmail?: string,
    studentName?: string,
    schoolCode?: string | null
  ): Promise<{ success: boolean; error?: string }> => {
    setIsUploading(true)
    setUploadProgress(0)
    
    try {
      console.log("[v0] Uploading", Object.keys(allResponses).length, "video segments separately...")
      setUploadStatus("Preparing to upload video segments...")
      
      // 按顺序排列视频
      const segments = mockPrompts
        .map((prompt, index) => ({
          prompt,
          blob: allResponses[prompt.id],
          index
        }))
        .filter(seg => seg.blob !== undefined)
      
      if (segments.length === 0) {
        throw new Error("No video segments to upload")
      }

      console.log("[v0] Uploading", segments.length, "video segments...")
      
      const uploadedSegments: Array<{
        promptId: string
        videoUrl: string
        sequenceNumber: number
        duration: number
        questionText: string
        category: string
      }> = []
      
      let totalDuration = 0
      
      // 分别上传每个分段视频（小文件，无需合并，避免 413 错误）
      for (let i = 0; i < segments.length; i++) {
        const { prompt, blob, index } = segments[i]
        const progressBase = (i / segments.length) * 70 // 0-70% 用于上传
        setUploadProgress(Math.floor(progressBase))
        setUploadStatus(`Uploading segment ${i + 1}/${segments.length}...`)
        
        console.log(`[v0] Uploading segment ${i + 1}/${segments.length}: ${prompt.text.substring(0, 50)}...`)
        
        // 只在第一个分段时传递学生信息（创建 interview 记录）
        // 后续分段只上传视频，不重复创建记录
        const result = await uploadVideoToB2AndSave(
          blob,
          interviewId,
          prompt.id,
          i + 1, // sequence number (1-based)
          i === 0 ? schoolCode : null, // 只在第一个分段传递
          i === 0 ? studentEmail : undefined, // 只在第一个分段传递
          i === 0 ? studentName : undefined, // 只在第一个分段传递
          // 传入文本和分类，便于服务端解析真实 prompts UUID
          prompt.text,
          prompt.category,
          prompt.responseTime
        )
        
        if (!result.success) {
          throw new Error(`Failed to upload segment ${i + 1}: ${result.error}`)
        }
        
        // 计算实际录制时长（从 blob 大小估算，或使用默认值）
        const actualDuration = Math.max(30, Math.min(60, Math.round(blob.size / 20000))) // 粗略估算：20KB/秒
        
        uploadedSegments.push({
          promptId: prompt.id,
          videoUrl: result.videoUrl!,
          sequenceNumber: i + 1,
          duration: actualDuration, // 使用实际估算时长
          questionText: prompt.text,
          category: prompt.category
        })
        
        totalDuration += actualDuration
        console.log(`[v0] ✓ Segment ${i + 1} uploaded:`, result.videoUrl)
      }
      
      console.log("[v0] ✓ All", segments.length, "segments uploaded successfully")
      console.log("[v0] Total estimated duration:", totalDuration, "seconds")
      
      // 触发异步服务端合并（不等待完成）
      setUploadStatus("Starting video processing...")
      setUploadProgress(70)
      console.log("[v0] Triggering async server-side video merge...")
      
      console.log("[v0] Calling merge-videos API...")
      console.log("[v0] Merge request data:", {
        interviewId,
        segmentsCount: uploadedSegments.length,
        segments: uploadedSegments.map(seg => ({
          url: seg.videoUrl,
          sequenceNumber: seg.sequenceNumber,
          duration: seg.duration
        }))
      })
      
      const mergeResult = await fetch('/api/merge-videos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          interviewId,
          segments: uploadedSegments.map(seg => ({
            url: seg.videoUrl,
            sequenceNumber: seg.sequenceNumber,
            duration: seg.duration,
            promptId: seg.promptId,
            questionText: seg.questionText,
            category: seg.category
          }))
        })
      })
      
      console.log("[v0] Merge API response status:", mergeResult.status)
      
      if (!mergeResult.ok) {
        const errorText = await mergeResult.text()
        console.error("[v0] Merge API error response:", errorText)
        throw new Error(`Failed to start video merge: ${mergeResult.status} ${mergeResult.statusText}`)
      }
      
      const mergeData = await mergeResult.json()
      console.log("[v0] Merge API response data:", mergeData)
      
      if (!mergeData.success) {
        console.error("[v0] Merge API returned error:", mergeData.error)
        throw new Error(`Failed to start video merge: ${mergeData.error}`)
      }
      
      console.log("[v0] ✓ Video merge task created:", mergeData.taskId)
      console.log("[v0] Video processing will continue in the background")
      
      // 保存基本信息到数据库（如果提供了学生邮箱）
      // 注意：video_url 和 subtitle_url 将在后台处理完成后更新
      if (studentEmail) {
        setUploadStatus("Saving interview information...")
        setUploadProgress(80)
        console.log("[v0] Saving interview to database (video processing in background)...")
        
        const dbResult = await saveInterview({
          interview_id: interviewId,
          student_email: studentEmail,
          student_name: studentName,
          video_url: null, // 将在后台处理完成后更新
          subtitle_url: null, // 将在后台处理完成后更新
          total_duration: totalDuration, // 估算时长，将在后台处理完成后更新
          school_code: schoolCode || undefined,
          metadata: {
            taskId: mergeData.taskId,
            status: 'processing',
            segmentCount: uploadedSegments.length,
            segments: uploadedSegments.map(seg => ({
              promptId: seg.promptId,
              questionText: seg.questionText,
              category: seg.category,
              sequenceNumber: seg.sequenceNumber,
              videoUrl: seg.videoUrl,
              duration: seg.duration
            })),
            submittedAt: new Date().toISOString()
          }
        })
        
        if (dbResult.success) {
          console.log("[v0] ✓ Interview saved to database:", dbResult.interview?.id)
        } else {
          console.error("[v0] Database save failed:", dbResult.error)
          // 不阻止用户流程，只记录错误
        }
      }
      
      // 保存基本信息到 localStorage
      const interviewData = {
        interviewId,
        taskId: mergeData.taskId,
        status: 'processing',
        totalDuration: totalDuration,
        segmentCount: uploadedSegments.length,
        completedAt: new Date().toISOString()
      }
      
      localStorage.setItem('latestInterview', JSON.stringify(interviewData))
      console.log("[v0] Interview data saved to localStorage")
      
      setUploadProgress(100)
      setUploadStatus("Upload complete! Video processing will continue in the background.")
      console.log("[v0] ✓ All segments uploaded successfully! Video merge will complete in the background.")
      return { success: true }
    } catch (error) {
      console.error("[v0] Upload error:", error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      return { success: false, error: `Failed to upload videos: ${errorMessage}` }
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
      setUploadStatus("")
    }
  }

  const handleSubmitInterview = async (studentEmail: string, studentName?: string) => {
    console.log("[v0] Submitting interview with", Object.keys(responses).length, "responses")
    console.log("[v0] Student email:", studentEmail)
    console.log("[v0] School code:", schoolCode || "Not specified")
    
    // 上传所有视频分段到 B2，然后在服务端使用 FFmpeg 合并
    const result = await uploadSegmentVideos(responses, studentEmail, studentName, schoolCode)
    
    // 根据结果跳转到完成页面
    const params = new URLSearchParams({
      status: result.success ? 'success' : 'error',
      email: studentEmail,
      interviewId: interviewId,
    })
    
    if (schoolCode) {
      params.append('school', schoolCode)
    }
    
    if (!result.success && result.error) {
      params.append('error', result.error)
    }
    
    // 稍微延迟跳转，让用户看到上传完成的动画
    setTimeout(() => {
      window.location.href = `/student/interview/complete?${params.toString()}`
    }, result.success ? 1000 : 500)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Video Interview Assessment</h1>
              <p className="text-sm text-slate-600">
                {stage === "setup" && "System check and preparation"}
                {stage === "interview" && `Question ${currentPromptIndex + 1} of ${mockPrompts.length}`}
                {stage === "complete" && "Interview completed"}
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 mt-1">
                {schoolCode && (
                  <p>
                    School: <span className="font-medium">{schoolCode}</span>
                  </p>
                )}
                <p className="font-mono">
                  ID: <span className="font-medium">{interviewId}</span>
                </p>
              </div>
            </div>
            {stage === "setup" && (
              <Button variant="outline" onClick={() => (window.location.href = "/")}>
                Exit
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Warning if no school code */}
      {!schoolCode && stage === "setup" && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Warning: No School Code</AlertTitle>
            <AlertDescription>
              This interview link is missing a school code parameter. The interview will be saved but may not be visible to any school.
              Please use the link provided by your school (e.g., <code>/student/interview?school=harvard</code>).
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {stage === "setup" && <InterviewSetup onComplete={handleSetupComplete} />}

        {stage === "interview" && (
          <InterviewPrompt
            prompt={mockPrompts[currentPromptIndex]}
            promptNumber={currentPromptIndex + 1}
            totalPrompts={mockPrompts.length}
            onComplete={handlePromptComplete}
          />
        )}

        {stage === "complete" && (
          <InterviewComplete 
            responsesCount={Object.keys(responses).length} 
            onSubmit={handleSubmitInterview}
            isUploading={isUploading}
            uploadProgress={uploadProgress}
            uploadStatus={uploadStatus}
            interviewId={interviewId}
          />
        )}
      </main>
    </div>
  )
}

export default function InterviewPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto"></div>
          <p className="mt-2 text-sm text-slate-600">Loading interview...</p>
        </div>
      </div>
    }>
      <InterviewPageContent />
    </Suspense>
  )
}
