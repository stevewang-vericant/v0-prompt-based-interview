"use client"

import { useState, Suspense, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { InterviewSetup } from "@/components/interview/interview-setup"
import { InterviewStudentInfo } from "@/components/interview/interview-student-info"
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
  getAllSegments,
  markSegmentAsUploaded, 
  clearUploadedSegments,
  clearAllSegments,
  getInterviewsWithPendingUploads
} from "@/lib/indexeddb"

interface Prompt {
  id: string
  category: string
  text: string
  preparationTime: number
  responseTime: number
}

type InterviewStage = "setup" | "student-info" | "interview" | "complete"

function InterviewPageContent() {
  const searchParams = useSearchParams()
  const schoolCode = searchParams.get("school")
  const [isUnsupportedDevice, setIsUnsupportedDevice] = useState(false)
  
  const [stage, setStage] = useState<InterviewStage>("student-info")
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
  const [isResumeUpload, setIsResumeUpload] = useState(false)
  const [pendingUploadCount, setPendingUploadCount] = useState(0)
  // Student info collected before interview
  const [studentInfo, setStudentInfo] = useState<{
    email: string
    name: string
    gender?: string | null
    currentGrade?: string | null
    residencyCity?: string | null
    residenceCountry: string
    needFinancialAid?: boolean | null
    usesCbo: boolean
    cboOrganization?: string | null
  } | null>(null)

  useEffect(() => {
    if (typeof window === "undefined") return

    const userAgent = navigator.userAgent || ""
    const isPhone = /iPhone|iPod|Android.*Mobile|Windows Phone|IEMobile|Opera Mini/i.test(userAgent)
    const isTablet = /iPad|Tablet|PlayBook|Silk/i.test(userAgent) || (/Android/i.test(userAgent) && !/Mobile/i.test(userAgent))
    // iPadOS 13+ may report itself as MacIntel; touch points help identify iPad.
    const isIPadOS = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1

    setIsUnsupportedDevice(isPhone || isTablet || isIPadOS)
  }, [])

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

  // Check for unfinished interview data when page loads.
  // Waits for both interviewId and prompts to be ready to avoid race conditions.
  useEffect(() => {
    if (!interviewId) return
    if (promptsLoading || prompts.length === 0) return

    const checkPendingUploads = async () => {
      try {
        const totalPrompts = prompts.length

        // Clean up old interview and start a fresh one
        const startFresh = async (oldId: string) => {
          console.log('[v0] Starting fresh, cleaning up:', oldId)
          await clearAllSegments(oldId)
          try {
            const { deleteIncompleteInterview } = await import('@/app/actions/interviews')
            await deleteIncompleteInterview(oldId)
          } catch (err) {
            console.warn('[v0] Could not delete incomplete interview from DB:', err)
          }
          localStorage.removeItem('currentInterviewId')
          const newId = `interview-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
          localStorage.setItem('currentInterviewId', newId)
          setInterviewId(newId)
          setResponses({})
          setHasPending(false)
          console.log('[v0] Fresh start with new interviewId:', newId)
        }

        // Restore student info from the database
        const restoreStudentInfo = async (targetId: string): Promise<boolean> => {
          try {
            const { getInterviewById } = await import('@/app/actions/interviews')
            const result = await getInterviewById(targetId)
            if (result.success && result.interview) {
              const iv = result.interview
              setStudentInfo({
                email: iv.student_email || '',
                name: iv.student_name || '',
                gender: iv.student_gender,
                currentGrade: iv.student_grade,
                residencyCity: iv.student_city,
                residenceCountry: 'Unknown',
                needFinancialAid: iv.student_financial_aid,
                usesCbo: iv.student_uses_cbo || false,
                cboOrganization: iv.student_cbo_organization
              })
              console.log('[v0] Restored student info from database')
              return true
            }
          } catch (err) {
            console.warn('[v0] Could not restore student info:', err)
          }
          return false
        }

        // Core resume handler for a given interviewId
        const handleResume = async (targetId: string): Promise<boolean> => {
          const allSegs = await getAllSegments(targetId)
          const pendingSegs = await getPendingSegments(targetId)
          const totalRecorded = allSegs.length
          const totalPending = pendingSegs.length

          if (totalRecorded === 0) return false

          // Determine the correct expected prompt count for this interview.
          // For the current interviewId we trust the page's prompts; for other
          // interviews (possibly from a different school) we look up the DB
          // metadata first and fall back to treating recorded count as total.
          let expectedTotal = totalPrompts
          if (targetId !== interviewId) {
            try {
              const { getInterviewById } = await import('@/app/actions/interviews')
              const result = await getInterviewById(targetId)
              if (result.success && result.interview?.metadata) {
                const meta = result.interview.metadata as Record<string, any>
                if (typeof meta.segmentCount === 'number' && meta.segmentCount > 0) {
                  expectedTotal = meta.segmentCount
                }
              }
            } catch (err) {
              console.warn('[v0] Could not fetch interview metadata for prompt count:', err)
            }
            if (totalRecorded > expectedTotal) {
              expectedTotal = totalRecorded
            }
          }

          console.log(`[v0] Interview ${targetId}: recorded=${totalRecorded}, pending=${totalPending}, expectedTotal=${expectedTotal}`)

          // Case C: fully recorded & fully uploaded — stale data, just clean up
          if (totalRecorded >= expectedTotal && totalPending === 0) {
            console.log('[v0] All segments already uploaded, cleaning up stale data')
            await clearAllSegments(targetId)
            return false
          }

          // Case A: partially recorded (not all questions answered yet)
          if (totalRecorded < expectedTotal) {
            setHasPending(true)
            const shouldContinue = confirm(
              `You have an incomplete interview (recorded ${totalRecorded} of ${expectedTotal} questions). ` +
              `Would you like to continue recording from question ${totalRecorded + 1}?\n\n` +
              `Click OK to continue, or Cancel to start a new interview.`
            )

            if (shouldContinue) {
              if (targetId !== interviewId) {
                setInterviewId(targetId)
                localStorage.setItem('currentInterviewId', targetId)
              }
              await restoreStudentInfo(targetId)
              const restored: Record<string, Blob> = {}
              allSegs.forEach(seg => { restored[seg.promptId] = seg.blob })
              setResponses(restored)
              setCurrentPromptIndex(totalRecorded)
              setStage("interview")
              console.log(`[v0] Resuming recording from question ${totalRecorded + 1}`)
            } else {
              await startFresh(targetId)
            }
            return true
          }

          // Case B: fully recorded, partially uploaded
          const uploaded = totalRecorded - totalPending
          setHasPending(true)
          const shouldContinue = confirm(
            `Your interview recording is complete (${uploaded} of ${expectedTotal} videos uploaded). ` +
            `Would you like to continue uploading the remaining ${totalPending} videos?\n\n` +
            `Click OK to continue uploading, or Cancel to start a new interview.`
          )

          if (shouldContinue) {
            if (targetId !== interviewId) {
              setInterviewId(targetId)
              localStorage.setItem('currentInterviewId', targetId)
            }
            const restored = await restoreStudentInfo(targetId)
            if (!restored) {
              alert('Unable to restore student information. Please re-enter your details.')
              setStage("student-info")
              return true
            }
            const pendingResponses: Record<string, Blob> = {}
            pendingSegs.forEach(seg => { pendingResponses[seg.promptId] = seg.blob })
            setResponses(pendingResponses)
            setIsResumeUpload(true)
            setPendingUploadCount(totalPending)
            setStage("complete")
            console.log(`[v0] Resuming upload: ${totalPending} segments remaining`)
          } else {
            await startFresh(targetId)
          }
          return true
        }

        // 1. Check current interviewId first
        const handled = await handleResume(interviewId)
        if (handled) return

        // 2. Check other interviews stored in IndexedDB
        const otherInterviews = await getInterviewsWithPendingUploads()
        if (otherInterviews.length > 0) {
          console.log(`[v0] Found ${otherInterviews.length} other interviews with pending data:`, otherInterviews)
          await handleResume(otherInterviews[0])
        }
      } catch (error) {
        console.error('[v0] Failed to check pending uploads:', error)
      }
    }

    checkPendingUploads()
  }, [interviewId, prompts, promptsLoading])

  const handleStudentInfoComplete = (info: {
    email: string
    name: string
    gender?: string | null
    currentGrade?: string | null
    residencyCity?: string | null
    residenceCountry: string
    needFinancialAid?: boolean | null
    usesCbo: boolean
    cboOrganization?: string | null
  }) => {
    console.log('[v0] Student info collected:', info)
    setStudentInfo(info)
    // 确保 interviewId 已保存到 localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('currentInterviewId', interviewId)
      console.log('[v0] Saved interviewId to localStorage:', interviewId)
    }
    setStage("setup")
  }

  const handleSetupComplete = () => {
    setStage("interview")
  }

  const handlePromptComplete = async (
    promptId: string,
    videoBlob: Blob,
    prepDurationSec: number,
  ) => {
    // 防止重复上传：如果面试已完成，忽略后续录制
    if (interviewCompleted) {
      console.log("[v0] Interview already completed, ignoring duplicate upload")
      return
    }

    console.log(
      "[v0] Prompt completed:",
      promptId,
      "Blob size:",
      videoBlob.size,
      "prepDuration:",
      prepDurationSec,
    )

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
          prompt.responseTime,
          prepDurationSec,
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

      // prepDuration: 优先用 IndexedDB 里记录的实际值；缺失时回退到 prompt 配置的 preparationTime
      // （客户端录制时使用的就是 prompt.preparationTime，所以这是合理的兜底）。
      let segments: Array<{
        prompt: Prompt
        blob: Blob
        index: number
        prepDuration: number
      }>
      
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
              index: seg.sequenceNumber - 1,
              prepDuration:
                typeof seg.prepDuration === 'number' ? seg.prepDuration : prompt.preparationTime,
            }
          })
      } else {
        // 使用内存中的数据
        console.log("[v0] No stored segments found, using in-memory data")
        segments = prompts
          .map((prompt, index) => ({
            prompt,
            blob: allResponses[prompt.id],
            index,
            prepDuration: prompt.preparationTime,
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
        prepDuration: number
        questionText: string
        category: string
      }> = []
      
      let totalDuration = 0
      
      // 分别上传每个分段视频（小文件，无需合并，避免 413 错误）
      for (let i = 0; i < segments.length; i++) {
        const { prompt, blob, index, prepDuration } = segments[i]
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
          prompt.responseTime,
          prepDuration,
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
          prepDuration,
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
      
      // 保存基本信息到数据库（如果提供了学生邮箱）
      // 注意：video_url 和 subtitle_url 将在后台处理完成后更新
      if (studentEmail) {
        setUploadStatus("Saving interview information...")
        setUploadProgress(90)
        console.log("[v0] Saving interview to database...")
        
        const dbResult = await saveInterview({
          interview_id: interviewId,
          student_email: studentEmail,
          student_name: studentName,
          video_url: undefined, // 将在后台处理完成后更新
          subtitle_url: undefined, // 将在后台处理完成后更新
          total_duration: totalDuration, // 估算时长，将在后台处理完成后更新
          school_code: schoolCode || undefined,
          metadata: {
            status: 'uploaded',
            segmentCount: uploadedSegments.length,
            segments: uploadedSegments.map(seg => ({
              promptId: seg.promptId,
              questionText: seg.questionText,
              category: seg.category,
              sequenceNumber: seg.sequenceNumber,
              videoUrl: seg.videoUrl,
              duration: seg.duration,
              prepDuration: seg.prepDuration,
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
      
      // 触发异步服务端合并（不等待完成，在后台进行）
      setUploadStatus("Starting background video processing...")
      setUploadProgress(95)
      console.log("[v0] Triggering async server-side video merge...")
      
      // 异步触发合并任务，不等待结果
      fetch('/api/merge-videos', {
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
            prepDuration: seg.prepDuration,
            promptId: seg.promptId,
            questionText: seg.questionText,
            category: seg.category
          }))
        })
      })
      .then(async (response) => {
        if (!response.ok) {
          const errorText = await response.text()
          console.error("[v0] Merge API error response:", errorText)
          throw new Error(`Failed to start video merge: ${response.status}`)
        }
        return response.json()
      })
      .then((mergeData) => {
        if (mergeData.success) {
          console.log("[v0] ✓ Video merge task created:", mergeData.taskId)
          console.log("[v0] Video processing will continue in the background")
          
          // 更新数据库中的taskId（如果之前保存成功）
          if (studentEmail) {
            // 异步更新，不阻塞
            import('@/app/actions/interviews').then(({ updateInterviewMetadata }) => {
              // 如果这个函数存在，更新metadata
              // 否则在processVideoMergeTask中更新
            }).catch(() => {
              // 忽略错误，processVideoMergeTask会处理
            })
          }
        } else {
          console.error("[v0] Merge API returned error:", mergeData.error)
          // 不抛出错误，让用户知道上传成功，合并会在后台重试
        }
      })
      .catch((error) => {
        console.error("[v0] Failed to start video merge task:", error)
        // 不抛出错误，让用户知道上传成功，合并会在后台重试
      })
      
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
      setUploadStatus("Upload complete! You can now close this window. Video processing will continue in the background.")
      console.log("[v0] ✓ All segments uploaded successfully! Video merge will complete in the background.")
      
      // 上传完成，立即返回成功，不等待合并
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

  const handleSubmitInterview = async () => {
    if (!studentInfo) {
      console.error("[v0] Student info not available")
      return
    }

    console.log("[v0] Submitting interview with", Object.keys(responses).length, "responses")
    console.log("[v0] Student email:", studentInfo.email)
    console.log("[v0] School code:", schoolCode || "Not specified")
    console.log("[v0] Student info:", studentInfo)
    
    // 上传所有视频分段到 B2，然后在服务端使用 FFmpeg 合并
    const result = await uploadSegmentVideos(responses, studentInfo.email, studentInfo.name, schoolCode)
    
    // 更新学生信息
    const { updateStudentInfo } = await import('@/app/actions/update-student-info')
    await updateStudentInfo(studentInfo.email, {
      gender: studentInfo.gender,
      currentGrade: studentInfo.currentGrade,
      residencyCity: studentInfo.residencyCity,
      residenceCountry: studentInfo.residenceCountry,
      needFinancialAid: studentInfo.needFinancialAid,
      usesCbo: studentInfo.usesCbo,
      cboOrganization: studentInfo.cboOrganization
    })
    
    // 根据结果跳转到完成页面
    const params = new URLSearchParams({
      status: result.success ? 'success' : 'error',
      email: studentInfo.email,
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
    <div className="min-h-screen bg-[#f5f5f7]">
      {/* Header */}
      <header className="bg-white border-b border-black/[0.06]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-[#1d1d1f]">Video Interview Assessment</h1>
              <p className="text-sm text-[rgba(0,0,0,0.56)]">
                {stage === "student-info" && "Student information"}
                {stage === "setup" && "System check and preparation"}
                {stage === "interview" && prompts.length > 0 && `Question ${currentPromptIndex + 1} of ${prompts.length}`}
                {stage === "complete" && "Interview completed"}
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[rgba(0,0,0,0.48)] mt-1">
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
            <div className="flex items-center gap-4">
              {(stage === "student-info" || stage === "setup") && (
                <Image
                  src="/RGB Logo Verified Video Interviews.png"
                  alt="Vericant Logo"
                  width={210}
                  height={40}
                  className="h-10 w-auto"
                  priority
                />
              )}
              {(stage === "student-info" || stage === "setup") && (
                <Button variant="outline" onClick={() => (window.location.href = "/")}>
                  Exit
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Warning if no school code */}
      {!schoolCode && (stage === "student-info" || stage === "setup") && (
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
        {isUnsupportedDevice && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Device Not Supported for Student Recording</AlertTitle>
            <AlertDescription>
              Interview recording is only available on PC or Mac. Please reopen this interview link on a desktop or laptop computer.
            </AlertDescription>
          </Alert>
        )}

        {promptsLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#0071e3] border-t-transparent mx-auto"></div>
              <p className="mt-2 text-sm text-[rgba(0,0,0,0.56)]">Loading interview questions...</p>
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

        {!isUnsupportedDevice && !promptsLoading && !promptsError && prompts.length > 0 && (
          <>
        {stage === "student-info" && (
          <InterviewStudentInfo 
            onSubmit={handleStudentInfoComplete}
          />
        )}

        {stage === "setup" && (
          <InterviewSetup 
            onComplete={handleSetupComplete}
            preparationTime={prompts[0]?.preparationTime}
            responseTime={prompts[0]?.responseTime}
          />
        )}

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
            responsesCount={isResumeUpload ? prompts.length : Object.keys(responses).length} 
            onSubmit={handleSubmitInterview}
            isUploading={isUploading}
            uploadProgress={uploadProgress}
            uploadStatus={uploadStatus}
            interviewId={interviewId}
            isResumeUpload={isResumeUpload}
            pendingCount={isResumeUpload ? pendingUploadCount : 0}
          />
        )}
      </main>
    </div>
  )
}

export default function InterviewPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-[#f5f5f7]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#0071e3] border-t-transparent mx-auto"></div>
          <p className="mt-2 text-sm text-[rgba(0,0,0,0.56)]">Loading interview...</p>
        </div>
      </div>
    }>
      <InterviewPageContent />
    </Suspense>
  )
}
