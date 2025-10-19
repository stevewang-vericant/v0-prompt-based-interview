"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { InterviewSetup } from "@/components/interview/interview-setup"
import { InterviewPrompt } from "@/components/interview/interview-prompt"
import { InterviewComplete } from "@/components/interview/interview-complete"
import { uploadVideoToB2AndSave } from "@/app/actions/upload-video"
import { uploadJsonToB2 } from "@/app/actions/upload-json"
import { saveInterview } from "@/app/actions/interviews"
import { mergeVideos } from "@/lib/video-merger"

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

export default function InterviewPage() {
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
    studentName?: string
  ) => {
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
      
      // 使用 FFmpeg 合并视频并转换为 MP4（暂时不带字幕）
      const mergeResult = await mergeVideos(
        sortedBlobs, 
        undefined, // 暂时不传递字幕文本
        (progress) => {
          setUploadProgress(Math.floor(progress * 0.7)) // 合并占70%进度
          console.log("[v0] Merge progress:", progress + "%")
        }
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
      setUploadStatus("Uploading merged video to B2...")
      setUploadProgress(75)
      console.log("[v0] Uploading merged MP4 to B2...")
      
      const result = await uploadVideoToB2AndSave(
        mergedBlob, 
        interviewId, 
        "complete-interview", // 使用特殊的 ID 标识完整面试
        0 // 序号设为 0，表示这是完整的面试视频
      )

      if (result.success) {
        console.log("[v0] ✓ Merged MP4 video uploaded successfully:", result.videoUrl)
        
        // 上传字幕元数据
        setUploadStatus("Uploading subtitle metadata...")
        setUploadProgress(90)
        console.log("[v0] Uploading subtitle metadata to B2...")
        
        const subtitleResult = await uploadJsonToB2(
          subtitleMetadata,
          interviewId,
          "complete-interview-subtitles"
        )
        
        if (subtitleResult.success) {
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
              video_url: result.videoUrl!,
              subtitle_url: subtitleResult.url,
              total_duration: mergeResult.totalDuration,
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
            videoUrl: result.videoUrl,
            subtitleUrl: subtitleResult.url,
            interviewId,
            totalDuration: mergeResult.totalDuration,
            completedAt: new Date().toISOString()
          }
          
          localStorage.setItem('latestInterview', JSON.stringify(interviewData))
          console.log("[v0] Interview data saved to localStorage")
          
          setUploadProgress(100)
          setUploadStatus("Upload complete!")
          setTimeout(() => {
            alert("Interview videos merged and uploaded successfully!")
          }, 500)
        } else {
          console.error("[v0] Subtitle upload failed:", subtitleResult.error)
          alert(`Warning: Video uploaded but subtitle metadata failed: ${subtitleResult.error}`)
        }
      } else {
        console.error("[v0] Upload failed:", result.error)
        alert(`Failed to upload merged video: ${result.error}`)
      }
    } catch (error) {
      console.error("[v0] Merge/upload error:", error)
      alert(`Failed to merge or upload videos: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
      setUploadStatus("")
    }
  }

  const handleSubmitInterview = async (studentEmail: string, studentName?: string) => {
    console.log("[v0] Submitting interview with", Object.keys(responses).length, "responses")
    console.log("[v0] Student email:", studentEmail)
    
    // 开始合并和上传视频，传入学生信息
    await mergeAndUploadVideos(responses, studentEmail, studentName)
    
    // 上传完成后重定向到 dashboard
    setTimeout(() => {
      window.location.href = "/student/dashboard"
    }, 2000)
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
            </div>
            {stage === "setup" && (
              <Button variant="outline" onClick={() => (window.location.href = "/student/dashboard")}>
                Exit
              </Button>
            )}
          </div>
        </div>
      </header>

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
          />
        )}
      </main>
    </div>
  )
}
