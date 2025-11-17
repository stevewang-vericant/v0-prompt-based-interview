"use client"

import { useState, Suspense, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle, Upload } from "lucide-react"
import { 
  getPendingSegments, 
  getAllSegments,
  markSegmentAsUploaded,
  clearUploadedSegments,
  type VideoSegment
} from "@/lib/indexeddb"
import { uploadVideoToB2AndSave } from "@/app/actions/upload-video"
import { saveInterview } from "@/app/actions/interviews"

const mockPrompts = [
  {
    id: "1",
    category: "Conversational Fluency",
    text: "Tell me about your favorite hobby and why you enjoy it.",
    preparationTime: 5,
    responseTime: 60,
  },
  {
    id: "2",
    category: "Critical Thinking",
    text: "Describe a time when you had to solve a complex problem. What approach did you take and what was the outcome?",
    preparationTime: 5,
    responseTime: 60,
  },
  {
    id: "3",
    category: "General Knowledge",
    text: "What do you think is the most important global challenge facing our generation?",
    preparationTime: 5,
    responseTime: 60,
  },
  {
    id: "4",
    category: "Critical Thinking",
    text: "Describe a situation where you had to work with someone whose perspective was very different from yours. How did you handle it?",
    preparationTime: 5,
    responseTime: 60,
  },
]

function ResumeUploadContent() {
  const searchParams = useSearchParams()
  const interviewId = searchParams.get("interviewId")
  const schoolCode = searchParams.get("school")
  
  const [loading, setLoading] = useState(true)
  const [pendingSegments, setPendingSegments] = useState<VideoSegment[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStatus, setUploadStatus] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const checkPendingSegments = async () => {
      if (!interviewId) {
        setError("Interview ID is missing")
        setLoading(false)
        return
      }

      try {
        const segments = await getPendingSegments(interviewId)
        setPendingSegments(segments)
        
        if (segments.length === 0) {
          // 检查是否有已上传的片段
          const allSegments = await getAllSegments(interviewId)
          if (allSegments.length === 0) {
            setError("No video segments found in local storage. Please record the interview again.")
          } else {
            setError("All segments have been uploaded. The video may still be processing on the server.")
          }
        }
      } catch (err) {
        console.error('[Resume] Failed to check pending segments:', err)
        setError(err instanceof Error ? err.message : 'Failed to check pending segments')
      } finally {
        setLoading(false)
      }
    }

    checkPendingSegments()
  }, [interviewId])

  const handleResumeUpload = async () => {
    if (!interviewId || pendingSegments.length === 0) {
      return
    }

    setUploading(true)
    setUploadProgress(0)
    setError(null)
    setSuccess(false)

    try {
      console.log(`[Resume] Resuming upload for ${pendingSegments.length} segments...`)
      setUploadStatus("Preparing to upload video segments...")

      const uploadedSegments: Array<{
        promptId: string
        videoUrl: string
        sequenceNumber: number
        duration: number
        questionText: string
        category: string
      }> = []

      let totalDuration = 0

      // 上传每个片段
      for (let i = 0; i < pendingSegments.length; i++) {
        const segment = pendingSegments[i]
        const progressBase = (i / pendingSegments.length) * 70
        setUploadProgress(Math.floor(progressBase))
        setUploadStatus(`Uploading segment ${i + 1}/${pendingSegments.length}...`)

        console.log(`[Resume] Uploading segment ${i + 1}/${pendingSegments.length}: ${segment.questionText.substring(0, 50)}...`)

        // 只在第一个分段时传递学生信息（从数据库获取）
        // 这里我们需要从 URL 或 localStorage 获取学生信息
        // 为了简化，我们假设第一个分段会创建 interview 记录
        const result = await uploadVideoToB2AndSave(
          segment.blob,
          interviewId,
          segment.promptId,
          segment.sequenceNumber,
          i === 0 ? schoolCode : null,
          undefined, // studentEmail - 需要从数据库获取
          undefined, // studentName - 需要从数据库获取
          segment.questionText,
          segment.category,
          segment.responseTime
        )

        if (!result.success) {
          throw new Error(`Failed to upload segment ${i + 1}: ${result.error}`)
        }

        // 标记为已上传
        try {
          await markSegmentAsUploaded(interviewId, segment.promptId, result.videoUrl!)
          console.log(`[Resume] ✓ Marked segment ${i + 1} as uploaded`)
        } catch (error) {
          console.warn(`[Resume] ⚠️ Failed to mark segment as uploaded:`, error)
        }

        // 计算实际录制时长
        const actualDuration = Math.max(30, Math.min(60, Math.round(segment.blob.size / 20000)))

        uploadedSegments.push({
          promptId: segment.promptId,
          videoUrl: result.videoUrl!,
          sequenceNumber: segment.sequenceNumber,
          duration: actualDuration,
          questionText: segment.questionText,
          category: segment.category
        })

        totalDuration += actualDuration
        console.log(`[Resume] ✓ Segment ${i + 1} uploaded:`, result.videoUrl)
      }

      console.log(`[Resume] ✓ All ${pendingSegments.length} segments uploaded successfully`)

      // 触发异步服务端合并
      setUploadStatus("Starting video processing...")
      setUploadProgress(70)

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

      if (!mergeResult.ok) {
        const errorText = await mergeResult.text()
        throw new Error(`Failed to start video merge: ${mergeResult.status} ${errorText}`)
      }

      const mergeData = await mergeResult.json()

      if (!mergeData.success) {
        throw new Error(`Failed to start video merge: ${mergeData.error}`)
      }

      console.log(`[Resume] ✓ Video merge task created:`, mergeData.taskId)

      // 清理已上传的片段
      try {
        await clearUploadedSegments(interviewId)
        console.log(`[Resume] ✓ Cleared uploaded segments`)
      } catch (error) {
        console.warn(`[Resume] ⚠️ Failed to clear uploaded segments:`, error)
      }

      setUploadProgress(100)
      setUploadStatus("Upload complete! Video processing will continue in the background.")
      setSuccess(true)

      // 3秒后跳转到 dashboard
      setTimeout(() => {
        window.location.href = '/school/dashboard'
      }, 3000)

    } catch (error) {
      console.error('[Resume] Upload error:', error)
      setError(error instanceof Error ? error.message : 'Unknown error occurred')
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto"></div>
          <p className="mt-2 text-sm text-slate-600">Checking for pending uploads...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-slate-900">Resume Upload</h1>
          <p className="text-sm text-slate-600 mt-1">
            Interview ID: <span className="font-mono">{interviewId}</span>
          </p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-900">Upload Complete</AlertTitle>
            <AlertDescription className="text-green-700">
              All video segments have been uploaded successfully. Video processing will continue in the background.
              Redirecting to dashboard...
            </AlertDescription>
          </Alert>
        )}

        {pendingSegments.length > 0 && !success && (
          <div className="space-y-6">
            <Alert className="bg-blue-50 border-blue-200">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertTitle className="text-blue-900">Pending Uploads Found</AlertTitle>
              <AlertDescription className="text-blue-700">
                Found {pendingSegments.length} video segment{pendingSegments.length !== 1 ? 's' : ''} that need to be uploaded.
                Click the button below to resume the upload.
              </AlertDescription>
            </Alert>

            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-lg font-semibold mb-4">Pending Segments</h2>
              <div className="space-y-2">
                {pendingSegments.map((segment, index) => (
                  <div key={segment.id} className="flex items-center justify-between p-3 bg-slate-50 rounded">
                    <div>
                      <p className="font-medium text-sm">Segment {segment.sequenceNumber}</p>
                      <p className="text-xs text-slate-600 truncate">{segment.questionText}</p>
                    </div>
                    <div className="text-xs text-slate-500">
                      {(segment.blob.size / 1024 / 1024).toFixed(2)} MB
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {uploading && (
              <div className="bg-white rounded-lg border p-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Upload Progress</span>
                    <span className="text-sm text-slate-600">{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  {uploadStatus && (
                    <p className="text-sm text-slate-600">{uploadStatus}</p>
                  )}
                </div>
              </div>
            )}

            <Button
              onClick={handleResumeUpload}
              disabled={uploading || success}
              size="lg"
              className="w-full"
            >
              <Upload className="h-4 w-4 mr-2" />
              {uploading ? 'Uploading...' : success ? 'Upload Complete' : 'Resume Upload'}
            </Button>
          </div>
        )}

        {pendingSegments.length === 0 && !error && !success && (
          <div className="text-center py-12">
            <p className="text-slate-600">No pending uploads found.</p>
          </div>
        )}
      </main>
    </div>
  )
}

export default function ResumeUploadPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto"></div>
          <p className="mt-2 text-sm text-slate-600">Loading...</p>
        </div>
      </div>
    }>
      <ResumeUploadContent />
    </Suspense>
  )
}

