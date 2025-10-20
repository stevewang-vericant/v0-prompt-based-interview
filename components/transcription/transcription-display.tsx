"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  Loader2,
  Copy,
  Download
} from "lucide-react"
import { toast } from "sonner"

interface TranscriptionDisplayProps {
  interviewId: string
  className?: string
}

interface TranscriptionData {
  status: 'pending' | 'processing' | 'completed' | 'failed'
  transcription?: string
  metadata?: {
    language?: string
    duration?: number
    confidence?: number
    segments?: Array<{
      start: number
      end: number
      text: string
      confidence?: number
    }>
    createdAt: string
    model: string
  }
}

export function TranscriptionDisplay({ interviewId, className }: TranscriptionDisplayProps) {
  const [transcriptionData, setTranscriptionData] = useState<TranscriptionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchTranscriptionStatus = async () => {
    try {
      const response = await fetch(`/api/transcription/status?interviewId=${interviewId}`)
      const data = await response.json()
      
      if (data.success) {
        setTranscriptionData({
          status: data.status,
          transcription: data.transcription,
          metadata: data.metadata
        })
      } else {
        console.error('Failed to fetch transcription status:', data.error)
      }
    } catch (error) {
      console.error('Error fetching transcription status:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchTranscriptionStatus()
    
    // 如果状态是 pending 或 processing，定期刷新
    const interval = setInterval(() => {
      if (transcriptionData?.status === 'pending' || transcriptionData?.status === 'processing') {
        fetchTranscriptionStatus()
      }
    }, 5000) // 每5秒刷新一次
    
    return () => clearInterval(interval)
  }, [interviewId, transcriptionData?.status])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchTranscriptionStatus()
  }

  const handleCopyTranscription = () => {
    if (transcriptionData?.transcription) {
      navigator.clipboard.writeText(transcriptionData.transcription)
      toast.success("Transcription copied to clipboard")
    }
  }

  const handleDownloadTranscription = () => {
    if (transcriptionData?.transcription) {
      const blob = new Blob([transcriptionData.transcription], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `interview-${interviewId}-transcription.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success("Transcription downloaded")
    }
  }

  const getStatusIcon = () => {
    switch (transcriptionData?.status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'processing':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <FileText className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusText = () => {
    switch (transcriptionData?.status) {
      case 'pending':
        return 'Transcription pending'
      case 'processing':
        return 'Transcription in progress...'
      case 'completed':
        return 'Transcription completed'
      case 'failed':
        return 'Transcription failed'
      default:
        return 'Unknown status'
    }
  }

  const getStatusBadgeVariant = () => {
    switch (transcriptionData?.status) {
      case 'pending':
        return 'secondary'
      case 'processing':
        return 'default'
      case 'completed':
        return 'default'
      case 'failed':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Loading transcription status...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-primary" />
              <CardTitle className="text-xl">AI Transcription</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={getStatusBadgeVariant()} className="text-xs">
              {getStatusIcon()}
              <span className="ml-1.5">{getStatusText()}</span>
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {transcriptionData?.status === 'failed' && (
          <Alert variant="destructive" className="mb-4">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              Transcription failed. Please try refreshing or contact support if the issue persists.
            </AlertDescription>
          </Alert>
        )}

        {transcriptionData?.status === 'processing' && (
          <Alert className="mb-4">
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertDescription>
              AI is processing the video and generating transcription. This may take a few minutes.
            </AlertDescription>
          </Alert>
        )}

        {transcriptionData?.status === 'pending' && (
          <Alert className="mb-4">
            <Clock className="h-4 w-4" />
            <AlertDescription>
              Transcription is queued and will start processing shortly.
            </AlertDescription>
          </Alert>
        )}

        {transcriptionData?.status === 'completed' && transcriptionData.transcription && (
          <div className="space-y-4">
            {/* 操作按钮 */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyTranscription}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy Text
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadTranscription}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>

            {/* 转录文本 */}
            <div className="bg-muted p-4 rounded-lg max-h-[500px] overflow-y-auto">
              <div className="whitespace-pre-wrap text-sm leading-relaxed">
                {transcriptionData.transcription}
              </div>
            </div>
          </div>
        )}

        {!transcriptionData && (
          <div className="text-center text-muted-foreground py-8">
            No transcription data available
          </div>
        )}
      </CardContent>
    </Card>
  )
}
