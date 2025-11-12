"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"

export default function DebugMergePage() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [segmentIds, setSegmentIds] = useState("temp-interviews/interview-1761122490867-8r6y0z0yn/segment-1,temp-interviews/interview-1761122490867-8r6y0z0yn/segment-2,temp-interviews/interview-1761122490867-8r6y0z0yn/segment-3,temp-interviews/interview-1761122490867-8r6y0z0yn/segment-4")
  const [interviewId, setInterviewId] = useState("interview-1761122490867-8r6y0z0yn")

  const testMergeAPI = async () => {
    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      console.log("[Debug] Testing merge API with:", { segmentIds, interviewId })
      
      const response = await fetch('/api/merge-videos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          segmentIds: segmentIds.split(',').map(id => id.trim()),
          interviewId
        })
      })

      const data = await response.json()
      
      if (response.ok) {
        setResult(data)
        console.log("[Debug] ✓ Merge successful:", data)
      } else {
        setError(`API Error ${response.status}: ${data.error || 'Unknown error'}`)
        console.error("[Debug] ✗ Merge failed:", data)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(`Network Error: ${errorMessage}`)
      console.error("[Debug] ✗ Network error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const testWithDifferentIds = () => {
    // 使用当前时间戳生成新的测试 ID
    const newInterviewId = `debug-interview-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    setInterviewId(newInterviewId)
    setSegmentIds(`temp-interviews/${newInterviewId}/segment-1,temp-interviews/${newInterviewId}/segment-2,temp-interviews/${newInterviewId}/segment-3,temp-interviews/${newInterviewId}/segment-4`)
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">视频合并 API 调试页面</h1>
          <p className="text-slate-600 mt-2">测试服务端 FFmpeg 视频合并 API 的功能和参数</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>API 测试参数</CardTitle>
            <CardDescription>配置测试用的视频片段 ID 和面试 ID</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="interviewId">Interview ID</Label>
              <Input
                id="interviewId"
                value={interviewId}
                onChange={(e) => setInterviewId(e.target.value)}
                placeholder="interview-xxx"
              />
            </div>
            
            <div>
              <Label htmlFor="segmentIds">Segment IDs (逗号分隔)</Label>
              <Input
                id="segmentIds"
                value={segmentIds}
                onChange={(e) => setSegmentIds(e.target.value)}
                placeholder="segment1,segment2,segment3,segment4"
                className="font-mono text-sm"
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={testMergeAPI} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    测试中...
                  </>
                ) : (
                  "测试合并 API"
                )}
              </Button>
              
              <Button variant="outline" onClick={testWithDifferentIds}>
                生成新的测试 ID
              </Button>
            </div>
          </CardContent>
        </Card>

        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>错误:</strong> {error}
            </AlertDescription>
          </Alert>
        )}

        {result && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                API 调用成功
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">响应数据:</Label>
                  <pre className="mt-2 p-4 bg-slate-100 rounded-md text-sm overflow-auto">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
                
                {result.success && result.public_id && (
                  <div className="space-y-2">
                    <div>
                      <Label className="text-sm font-medium">合并后的视频 ID:</Label>
                      <p className="font-mono text-sm">{result.public_id}</p>
                    </div>
                    
                    {result.secure_url && (
                      <div>
                        <Label className="text-sm font-medium">视频 URL:</Label>
                        <a 
                          href={result.secure_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm break-all"
                        >
                          {result.secure_url}
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>调试说明</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-600">
            <p>• 这个页面用于测试服务端 FFmpeg 视频合并 API</p>
            <p>• 使用之前上传到 B2 的视频片段进行测试</p>
            <p>• 查看浏览器控制台获取详细的调试信息</p>
            <p>• 如果成功，会显示合并后的视频 URL</p>
            <p>• 如果失败，会显示具体的错误信息</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
