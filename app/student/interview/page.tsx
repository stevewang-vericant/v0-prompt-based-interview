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
import { getB2PresignedUrl } from "@/app/actions/get-b2-presigned-url"
import { saveVideoMetadata } from "@/app/actions/save-video-metadata"
import { mergeVideos } from "@/lib/video-merger"
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
    responseTime: 90,
  },
  {
    id: "2",
    category: "Critical Thinking",
    text: "Describe a time when you had to solve a complex problem. What approach did you take and what was the outcome?",
    preparationTime: 5, // TODO: 测试完成后改回 15
    responseTime: 90,
  },
  {
    id: "3",
    category: "General Knowledge",
    text: "What do you think is the most important global challenge facing our generation?",
    preparationTime: 5, // TODO: 测试完成后改回 15
    responseTime: 90,
  },
  {
    id: "4",
    category: "Critical Thinking",
    text: "Describe a situation where you had to work with someone whose perspective was very different from yours. How did you handle it?",
    preparationTime: 5, // TODO: 测试完成后改回 15
    responseTime: 90,
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

  const mergeAndUploadVideos = async (
    allResponses: Record<string, Blob>,
    studentEmail?: string,
    studentName?: string,
    schoolCode?: string | null
  ): Promise<{ success: boolean; error?: string }> => {
    setIsUploading(true)
    setUploadProgress(0)
    
    try {
      console.log("[v0] Merging", Object.keys(allResponses).length, "video segments...")
      setUploadStatus("Preparing videos for merge...")
      
      // 按顺序合并视频
      const sortedBlobs = mockPrompts
        .map(prompt => allResponses[prompt.id])
        .filter(blob => blob !== undefined)
      
      // 提取问题文本，用于添加字幕
      // TODO: 字幕功能暂时禁用，因为 Canvas 音频处理比较复杂
      // const questionTexts = mockPrompts.map(prompt => prompt.text)
      
      if (sortedBlobs.length === 0) {
        throw new Error("No video segments to merge")
      }

      console.log("[v0] Starting FFmpeg merge and MP4 conversion...")
      setUploadStatus("Merging videos and converting to MP4...")
      
      // 准备估算的视频时长（用于 iOS Safari 兼容）
      const estimatedDurations = mockPrompts.map(prompt => prompt.responseTime)
      console.log("[v0] Using estimated durations:", estimatedDurations)
      
      // 使用 FFmpeg 合并视频并转换为 MP4（暂时不带字幕）
      const mergeResult = await mergeVideos(
        sortedBlobs, 
        undefined, // 暂时不传递字幕文本
        (progress) => {
          setUploadProgress(Math.floor(progress * 0.7)) // 合并占70%进度
          console.log("[v0] Merge progress:", progress + "%")
        },
        estimatedDurations // 传递估算时长，iOS Safari 回退方案
      )
      
      const mergedBlob = mergeResult.videoBlob
      const mergedSize = mergedBlob.size
      console.log("[v0] Videos merged successfully, MP4 size:", mergedSize, "bytes")
      console.log("[v0] Total duration:", mergeResult.totalDuration.toFixed(2), "seconds")
      
      // 生成字幕元数据
      const subtitleMetadata = {
        interviewId,
        totalDuration: mergeResult.totalDuration,
        createdAt: new Date().toISOString(),
        questions: mockPrompts.map((prompt, index) => ({
          id: prompt.id,
          questionNumber: index + 1,
          category: prompt.category,
          text: prompt.text,
          startTime: mergeResult.segments[index].startTime,
          endTime: mergeResult.segments[index].endTime,
          duration: mergeResult.segments[index].duration
        }))
      }
      
      console.log("[v0] Subtitle metadata generated:", subtitleMetadata)

      // 上传合并后的视频
      // 注意：本地开发时可能因 CORS 限制无法直接上传到 B2
      // 临时使用服务器端上传进行测试
      setUploadStatus("Uploading merged video to B2...")
      setUploadProgress(75)
      console.log("[v0] Uploading merged MP4 to B2...")
      console.log("[v0] Merged video size:", mergedBlob.size, "bytes (", (mergedBlob.size / 1024 / 1024).toFixed(2), "MB)")
      
      // 仅在本地开发环境使用服务器端上传（为绕过本地 CORS 调试）
      // 在预览/生产环境一律使用直传 B2，避免 Vercel 对请求体大小/执行时间的限制
      const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
      const useLegacyUpload = isLocalhost && mergedBlob.size < 10 * 1024 * 1024
      
      let videoUrl: string
      
      if (useLegacyUpload) {
        console.log("[v0] Using server-side upload (legacy method for local testing)")
        const result = await uploadVideoToB2AndSave(
          mergedBlob,
          interviewId,
          "complete-interview",
          0,
          schoolCode,
          studentEmail,
          studentName
        )
        
        if (!result.success) {
          throw new Error(`Failed to upload video: ${result.error}`)
        }
        
        videoUrl = result.videoUrl!
        console.log("[v0] ✓ Video uploaded via server")
      } else {
        console.log("[v0] Using client-side direct upload to B2")
        const timestamp = Date.now()
        const filename = `interviews/${interviewId}/complete-interview-${timestamp}.mp4`
        
        // 步骤 1: 获取预签名 URL
        console.log("[v0] Requesting presigned URL...")
        const presignedResult = await getB2PresignedUrl(filename, 'video/mp4')
        
        if (!presignedResult.success || !presignedResult.presignedUrl || !presignedResult.publicUrl) {
          throw new Error(`Failed to get presigned URL: ${presignedResult.error}`)
        }
        
        console.log("[v0] ✓ Presigned URL obtained")
        
        // 步骤 2: 直接上传到 B2
        setUploadStatus("Uploading to B2...")
        setUploadProgress(80)
        console.log("[v0] Uploading directly to B2...")
        
        const uploadResponse = await fetch(presignedResult.presignedUrl, {
          method: 'PUT',
          body: mergedBlob,
          headers: {
            'Content-Type': 'video/mp4',
          },
        })
        
        if (!uploadResponse.ok) {
          throw new Error(`B2 upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`)
        }
        
        console.log("[v0] ✓ Video uploaded to B2 successfully")
        
        // 步骤 3: 保存元数据
        setUploadStatus("Saving to database...")
        setUploadProgress(85)
        const metadataResult = await saveVideoMetadata(
          presignedResult.publicUrl,
          interviewId,
          "complete-interview",
          0,
          schoolCode,
          studentEmail,
          studentName
        )
        
        if (!metadataResult.success) {
          console.warn("[v0] ⚠️ Failed to save metadata:", metadataResult.error)
        }
        
        videoUrl = presignedResult.publicUrl
      }
      
      console.log("[v0] ✓ Merged MP4 video uploaded successfully:", videoUrl)
        
        // 上传字幕元数据
        setUploadStatus("Uploading subtitle metadata...")
        setUploadProgress(90)
        console.log("[v0] Uploading subtitle metadata to B2...")
      
      const subtitleResult = await uploadJsonToB2(
        subtitleMetadata,
        interviewId,
        "complete-interview-subtitles"
      )
      
      if (!subtitleResult.success) {
        throw new Error(`Failed to upload subtitle metadata: ${subtitleResult.error}`)
      }
      
      console.log("[v0] ✓ Subtitle metadata uploaded successfully:", subtitleResult.url)
      
      // 保存到数据库（如果提供了学生邮箱）
      if (studentEmail) {
        setUploadStatus("Saving to database...")
        setUploadProgress(95)
        console.log("[v0] Saving interview to database...")
        
        const dbResult = await saveInterview({
          interview_id: interviewId,
          student_email: studentEmail,
          student_name: studentName,
          video_url: videoUrl,
          subtitle_url: subtitleResult.url,
          total_duration: mergeResult.totalDuration,
          school_code: schoolCode || undefined,
          metadata: {
            questions: subtitleMetadata.questions,
            completedAt: new Date().toISOString()
          }
        })
        
        if (dbResult.success) {
          console.log("[v0] ✓ Interview saved to database:", dbResult.interview?.id)
        } else {
          console.error("[v0] Database save failed:", dbResult.error)
          // 不阻止用户流程，只记录错误
        }
      }
      
      // 保存视频 URL 和字幕 URL 到 localStorage，供 dashboard 使用
      const interviewData = {
        videoUrl: videoUrl,
        subtitleUrl: subtitleResult.url,
        interviewId,
        totalDuration: mergeResult.totalDuration,
        completedAt: new Date().toISOString()
      }
      
      localStorage.setItem('latestInterview', JSON.stringify(interviewData))
      console.log("[v0] Interview data saved to localStorage")
      
      setUploadProgress(100)
      setUploadStatus("Upload complete!")
      console.log("[v0] ✓ All operations completed successfully!")
      return { success: true }
    } catch (error) {
      console.error("[v0] Merge/upload error:", error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      return { success: false, error: `Failed to process video: ${errorMessage}` }
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
    
    // 开始合并和上传视频，传入学生信息和学校代码
    const result = await mergeAndUploadVideos(responses, studentEmail, studentName, schoolCode)
    
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
