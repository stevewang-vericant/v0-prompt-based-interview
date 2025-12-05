"use client"

import { useState, Suspense, useEffect } from "react"
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
import { 
  saveVideoSegment, 
  getPendingSegments, 
  markSegmentAsUploaded, 
  clearUploadedSegments,
  hasPendingUploads,
  getInterviewsWithPendingUploads,
  type VideoSegment
} from "@/lib/indexeddb"

interface Prompt {
  id: string
  category: string
  text: string
  preparationTime: number
  responseTime: number
}

type InterviewStage = "setup" | "interview" | "complete"

function InterviewPageContent() {
  const searchParams = useSearchParams()
  const schoolCode = searchParams.get("school")
  
  const [stage, setStage] = useState<InterviewStage>("setup")
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0)
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [promptsLoading, setPromptsLoading] = useState(true)
  const [promptsError, setPromptsError] = useState<string | null>(null)
  const [responses, setResponses] = useState<Record<string, Blob>>({})
  // 从 localStorage 恢复 interviewId，如果没有则生成新的
  const [interviewId, setInterviewId] = useState<string>('')
  const [isUploading, setIsUploading] = useState(false)
  const [interviewCompleted, setInterviewCompleted] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStatus, setUploadStatus] = useState("")
  const [hasPending, setHasPending] = useState(false)

  // 加载 prompts
  useEffect(() => {
    const loadPrompts = async () => {
      if (!schoolCode) {
        setPromptsError("School code is required")
        setPromptsLoading(false)
        return
      }

      try {
        setPromptsLoading(true)
        setPromptsError(null)
        
        const { getPromptsBySchoolCode } = await import('@/app/actions/prompts')
        const result = await getPromptsBySchoolCode(schoolCode)
        
        if (!result.success || !result.prompts) {
          setPromptsError(result.error || "Failed to load prompts")
          return
        }

        // 转换为 Prompt 格式
        const formattedPrompts: Prompt[] = result.prompts.map((p, index) => ({
          id: p.id,
          category: p.category,
          text: p.text,
          preparationTime: p.preparationTime,
          responseTime: p.responseTime
        }))

        setPrompts(formattedPrompts)
      } catch (err) {
        console.error('[Interview] Error loading prompts:', err)
        setPromptsError(err instanceof Error ? err.message : "Unknown error")
      } finally {
        setPromptsLoading(false)
      }
    }

    loadPrompts()
  }, [schoolCode])

  // 初始化 interviewId（仅在客户端）
  useEffect(() => {
    if (typeof window !== 'undefined' && !interviewId) {
      // 尝试从 localStorage 恢复
      const saved = localStorage.getItem('currentInterviewId')
      if (saved) {
        console.log('[v0] Restored interviewId from localStorage:', saved)
        setInterviewId(saved)
      } else {
        // 生成新的 interviewId
        const newId = `interview-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        localStorage.setItem('currentInterviewId', newId)
        console.log('[v0] Generated new interviewId:', newId)
        setInterviewId(newId)
      }
    }
  }, [])

  // 页面加载时检查是否有未完成的上传
  useEffect(() => {
    if (!interviewId) return // 等待 interviewId 初始化完成
    
    const checkPendingUploads = async () => {
      try {
        // 首先检查当前 interviewId 是否有未完成的上传
        const pending = await hasPendingUploads(interviewId)
        if (pending) {
          setHasPending(true)
          const pendingSegments = await getPendingSegments(interviewId)
          console.log(`[v0] Found ${pendingSegments.length} pending segments for ${interviewId}`)
          
          // 检查是否所有问题都已录制完成
          const totalPrompts = prompts.length
          const recordedPrompts = pendingSegments.length
          
          if (recordedPrompts < totalPrompts) {
            // 面试未完成，需要继续录制
            const shouldResume = confirm(
              `检测到未完成的面试（已录制 ${recordedPrompts}/${totalPrompts} 个问题）。是否继续完成面试？`
            )
            
            if (shouldResume) {
              // 恢复已录制的片段
              const allResponses: Record<string, Blob> = {}
              pendingSegments.forEach(seg => {
                allResponses[seg.promptId] = seg.blob
              })
              setResponses(allResponses)
              
              // 设置当前问题索引为已录制的问题数量
              setCurrentPromptIndex(recordedPrompts)
              
              // 继续面试流程（从下一个问题开始）
              setStage("interview")
              console.log(`[v0] Resuming interview from question ${recordedPrompts + 1}`)
            }
          } else {
            // 所有问题都已录制完成，可以上传
            const shouldResume = confirm(
              `检测到 ${recordedPrompts} 个未上传的视频片段，是否继续上传？`
            )
            
            if (shouldResume) {
              // 自动继续上传
              const allResponses: Record<string, Blob> = {}
              pendingSegments.forEach(seg => {
                allResponses[seg.promptId] = seg.blob
              })
              setResponses(allResponses)
              setStage("complete")
              // 注意：这里不自动触发上传，需要用户点击提交按钮
            }
          }
        } else {
          // 如果没有当前 interviewId 的未完成上传，检查是否有其他未完成的上传
          const allPendingInterviews = await getInterviewsWithPendingUploads()
          if (allPendingInterviews.length > 0) {
            console.log(`[v0] Found ${allPendingInterviews.length} interviews with pending uploads:`, allPendingInterviews)
            
            // 如果有其他未完成的上传，询问用户是否恢复
            const shouldResume = confirm(
              `检测到 ${allPendingInterviews.length} 个未完成的面试，是否恢复最近的面试？`
            )
            
            if (shouldResume && allPendingInterviews.length > 0) {
              // 使用最近的 interviewId
              const resumeInterviewId = allPendingInterviews[0]
              setInterviewId(resumeInterviewId)
              localStorage.setItem('currentInterviewId', resumeInterviewId)
              
              const pendingSegments = await getPendingSegments(resumeInterviewId)
              const totalPrompts = prompts.length
              const recordedPrompts = pendingSegments.length
              
              if (recordedPrompts < totalPrompts) {
                // 面试未完成，需要继续录制
                const allResponses: Record<string, Blob> = {}
                pendingSegments.forEach(seg => {
                  allResponses[seg.promptId] = seg.blob
                })
                setResponses(allResponses)
                setCurrentPromptIndex(recordedPrompts)
                setStage("interview")
                console.log(`[v0] Resuming interview from question ${recordedPrompts + 1}`)
              } else {
                // 所有问题都已录制完成，可以上传
                const allResponses: Record<string, Blob> = {}
                pendingSegments.forEach(seg => {
                  allResponses[seg.promptId] = seg.blob
                })
                setResponses(allResponses)
                setStage("complete")
              }
            }
          }
        }
      } catch (error) {
        console.error('[v0] Failed to check pending uploads:', error)
      }
    }
    
    checkPendingUploads()
  }, [interviewId])

  const handleSetupComplete = () => {
    // 确保 interviewId 已保存到 localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('currentInterviewId', interviewId)
      console.log('[v0] Saved interviewId to localStorage:', interviewId)
    }
    setStage("interview")
  }

  const handlePromptComplete = async (promptId: string, videoBlob: Blob) => {
    // 防止重复上传：如果面试已完成，忽略后续录制
    if (interviewCompleted) {
      console.log("[v0] Interview already completed, ignoring duplicate upload")
      return
    }

    console.log("[v0] Prompt completed:", promptId, "Blob size:", videoBlob.size)
    
    // 立即保存到 IndexedDB（持久化存储）
    try {
      const prompt = prompts.find(p => p.id === promptId)
      if (prompt) {
        await saveVideoSegment(
          interviewId,
          promptId,
          currentPromptIndex + 1,
          videoBlob,
          prompt.text,
          prompt.category,
          prompt.responseTime
        )
        console.log(`[v0] ✓ Saved segment to IndexedDB: ${promptId}`)
      }
    } catch (error) {
      console.error("[v0] Failed to save segment to IndexedDB:", error)
      // 即使保存失败，也继续流程（视频仍在内存中）
    }
    
    setResponses((prev) => ({ ...prev, [promptId]: videoBlob }))

    // 检查是否所有问题都已完成
    const allPromptsRecorded = Object.keys({ ...responses, [promptId]: videoBlob }).length >= prompts.length
    
    if (currentPromptIndex < prompts.length - 1) {
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
      // 优先从 IndexedDB 读取（如果存在），否则使用内存中的数据
      console.log("[v0] Checking IndexedDB for stored segments...")
      const storedSegments = await getPendingSegments(interviewId)
      
      let segments: Array<{ prompt: Prompt; blob: Blob; index: number }>
      
      if (storedSegments.length > 0) {
        // 使用 IndexedDB 中的数据
        console.log(`[v0] Found ${storedSegments.length} segments in IndexedDB, using stored data`)
        segments = storedSegments
          .sort((a, b) => a.sequenceNumber - b.sequenceNumber)
          .map(seg => {
            const prompt = prompts.find(p => p.id === seg.promptId)
            if (!prompt) {
              throw new Error(`Prompt not found: ${seg.promptId}`)
            }
            return {
              prompt,
              blob: seg.blob,
              index: seg.sequenceNumber - 1
            }
          })
      } else {
        // 使用内存中的数据
        console.log("[v0] No stored segments found, using in-memory data")
        segments = prompts
          .map((prompt, index) => ({
            prompt,
            blob: allResponses[prompt.id],
            index
          }))
          .filter(seg => seg.blob !== undefined)
      }
      
      if (segments.length === 0) {
        throw new Error("No video segments to upload")
      }
      
      console.log("[v0] Uploading", segments.length, "video segments separately...")
      setUploadStatus("Preparing to upload video segments...")

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
        
        // 标记为已上传（更新 IndexedDB）
        try {
          await markSegmentAsUploaded(interviewId, prompt.id, result.videoUrl!)
          console.log(`[v0] ✓ Marked segment ${i + 1} as uploaded in IndexedDB`)
        } catch (error) {
          console.warn(`[v0] ⚠️ Failed to mark segment as uploaded:`, error)
          // 继续流程，即使标记失败
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
      
      // 上传完成后，清理已上传的片段（可选，保留一段时间以便恢复）
      // await clearUploadedSegments(interviewId)
      
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
          video_url: undefined, // 将在后台处理完成后更新
          subtitle_url: undefined, // 将在后台处理完成后更新
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
      
      // 清理已上传的片段（上传成功后）
      try {
        await clearUploadedSegments(interviewId)
        console.log("[v0] ✓ Cleared uploaded segments from IndexedDB")
      } catch (error) {
        console.warn("[v0] ⚠️ Failed to clear uploaded segments:", error)
      }
      
      // 清理 localStorage 中的 interviewId（上传完成后）
      if (typeof window !== 'undefined') {
        localStorage.removeItem('currentInterviewId')
        console.log("[v0] ✓ Cleared interviewId from localStorage")
      }
      
      setHasPending(false)
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

  const handleSubmitInterview = async (
    studentEmail: string, 
    studentName?: string, 
    additionalInfo?: {
      gender?: string | null
      currentGrade?: string | null
      residencyCity?: string | null
      needFinancialAid?: boolean | null
    }
  ) => {
    console.log("[v0] Submitting interview with", Object.keys(responses).length, "responses")
    console.log("[v0] Student email:", studentEmail)
    console.log("[v0] School code:", schoolCode || "Not specified")
    console.log("[v0] Additional info:", additionalInfo)
    
    // 上传所有视频分段到 B2，然后在服务端使用 FFmpeg 合并
    const result = await uploadSegmentVideos(responses, studentEmail, studentName, schoolCode)
    
    // 更新学生信息（总是调用，即使没有提供额外信息，也会清除旧数据）
    if (additionalInfo) {
      const { updateStudentInfo } = await import('@/app/actions/update-student-info')
      await updateStudentInfo(studentEmail, additionalInfo)
    }
    
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
                {stage === "interview" && prompts.length > 0 && `Question ${currentPromptIndex + 1} of ${prompts.length}`}
                {stage === "complete" && "Interview completed"}
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 mt-1">
                {schoolCode && (
                  <p>
                    School: <span className="font-medium">{schoolCode}</span>
                  </p>
                )}
                {interviewId && (
                <p className="font-mono">
                  ID: <span className="font-medium">{interviewId}</span>
                </p>
                )}
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
        {promptsLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto"></div>
              <p className="mt-2 text-sm text-slate-600">Loading interview questions...</p>
            </div>
          </div>
        )}

        {promptsError && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Loading Questions</AlertTitle>
            <AlertDescription>{promptsError}</AlertDescription>
          </Alert>
        )}

        {!promptsLoading && !promptsError && prompts.length === 0 && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No Questions Available</AlertTitle>
            <AlertDescription>
              This school has not configured interview questions yet. Please contact the school administrator.
            </AlertDescription>
          </Alert>
        )}

        {!promptsLoading && !promptsError && prompts.length > 0 && (
          <>
        {stage === "setup" && <InterviewSetup onComplete={handleSetupComplete} />}

        {stage === "interview" && (
          <InterviewPrompt
                prompt={prompts[currentPromptIndex]}
            promptNumber={currentPromptIndex + 1}
                totalPrompts={prompts.length}
            onComplete={handlePromptComplete}
          />
            )}
          </>
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
