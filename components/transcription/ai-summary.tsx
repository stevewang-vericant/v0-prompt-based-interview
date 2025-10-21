"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  FileText, 
  Sparkles,
  Loader2,
  RefreshCw,
  Copy,
  Download
} from "lucide-react"
import { toast } from "sonner"

interface AISummaryProps {
  summary?: string
  transcription?: string
  className?: string
}

export function AISummary({ summary: initialSummary, transcription, className }: AISummaryProps) {
  const [summary, setSummary] = useState<string | null>(initialSummary || null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateSummary = async () => {
    if (!transcription) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/ai-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transcription }),
      })

      const data = await response.json()

      if (data.success) {
        setSummary(data.summary)
        toast.success("AI summary generated successfully")
      } else {
        setError(data.error || 'Failed to generate summary')
        toast.error("Failed to generate summary")
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      toast.error("Failed to generate summary")
    } finally {
      setLoading(false)
    }
  }

  const handleCopySummary = () => {
    if (summary) {
      navigator.clipboard.writeText(summary)
      toast.success("Summary copied to clipboard")
    }
  }

  const handleDownloadSummary = () => {
    if (summary) {
      const blob = new Blob([summary], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'interview-summary.txt'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success("Summary downloaded")
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-purple-500" />
              <CardTitle className="text-xl">AI Summary</CardTitle>
            </div>
            {summary && (
              <Button
                variant="ghost"
                size="sm"
                onClick={generateSummary}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={summary ? "default" : "secondary"} className="text-xs">
              {summary ? "Summary generated" : "Ready to generate"}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <FileText className="h-4 w-4" />
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        )}

        {!summary && !loading && transcription && (
          <div className="text-center py-8">
            <Sparkles className="h-12 w-12 text-purple-300 mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              Generate an AI-powered summary of the interview transcript
            </p>
            <Button onClick={generateSummary} disabled={loading}>
              <Sparkles className="h-4 w-4 mr-2" />
              Generate Summary
            </Button>
          </div>
        )}

        {!summary && !loading && !transcription && (
          <div className="text-center py-8">
            <Sparkles className="h-12 w-12 text-purple-300 mx-auto mb-4" />
            <p className="text-muted-foreground">
              AI summary will be generated automatically after transcription completes
            </p>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Generating AI summary...</span>
          </div>
        )}

        {summary && (
          <div className="space-y-4">
            {/* 操作按钮 */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopySummary}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy Summary
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadSummary}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>

            {/* 摘要内容 */}
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-4 rounded-lg border border-purple-200">
              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-wrap text-slate-700 leading-relaxed">
                  {summary}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
