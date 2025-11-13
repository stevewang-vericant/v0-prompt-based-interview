"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, XCircle, Video, Mic, AlertCircle } from "lucide-react"

interface InterviewSetupProps {
  onComplete: () => void
}

export function InterviewSetup({ onComplete }: InterviewSetupProps) {
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null)
  const [micPermission, setMicPermission] = useState<boolean | null>(null)
  const [isTestingCamera, setIsTestingCamera] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [errorMessage, setErrorMessage] = useState<string>("")

  const testDevices = async () => {
    setIsTestingCamera(true)
    setErrorMessage("")
    
    // 检查是否在安全上下文中（HTTPS 或 localhost）
    const isSecureContext = window.isSecureContext || window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    
    if (!isSecureContext) {
      setCameraPermission(false)
      setMicPermission(false)
      setErrorMessage("⚠️ Camera and microphone access requires HTTPS. The current connection is not secure. Please contact your administrator to set up HTTPS for this application.")
      setIsTestingCamera(false)
      return
    }
    
    // 检查 navigator.mediaDevices 是否可用
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraPermission(false)
      setMicPermission(false)
      setErrorMessage("⚠️ Camera and microphone access is not available. This may be due to:\n1. Using HTTP instead of HTTPS (required for security)\n2. Browser doesn't support media access\n3. Running in an insecure context\n\nPlease use HTTPS or contact your administrator.")
      setIsTestingCamera(false)
      return
    }
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }

      setCameraPermission(true)
      setMicPermission(true)
    } catch (err) {
      console.error("[v0] Device access error:", err)
      setCameraPermission(false)
      setMicPermission(false)
      
      // 提供更详细的错误信息
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setErrorMessage("Permission denied. Please allow camera and microphone access in your browser settings.")
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          setErrorMessage("No camera or microphone found. Please check your device.")
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
          setErrorMessage("Camera is already in use by another application.")
        } else if (err.name === 'OverconstrainedError') {
          setErrorMessage("Camera settings not supported.")
        } else if (err.name === 'SecurityError' || err.message.includes('getUserMedia')) {
          setErrorMessage("⚠️ Security Error: Camera and microphone access requires HTTPS. The current connection (HTTP) is not secure. Please contact your administrator to set up HTTPS.")
        } else {
          setErrorMessage(`Error: ${err.message}`)
        }
      } else {
        setErrorMessage("Unknown error occurred while accessing camera and microphone.")
      }
    } finally {
      setIsTestingCamera(false)
    }
  }

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
  }

  useEffect(() => {
    return () => {
      stopStream()
    }
  }, [])

  const canProceed = cameraPermission && micPermission

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>System Check</CardTitle>
          <CardDescription>
            Before starting your interview, we need to verify your camera and microphone are working properly
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Device Status */}
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
              <div className="flex items-center gap-3">
                <Video className="h-5 w-5 text-slate-600" />
                <div>
                  <p className="font-medium">Camera</p>
                  <p className="text-sm text-muted-foreground">Required for video recording</p>
                </div>
              </div>
              {cameraPermission === null ? (
                <AlertCircle className="h-5 w-5 text-slate-400" />
              ) : cameraPermission ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
            </div>

            <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
              <div className="flex items-center gap-3">
                <Mic className="h-5 w-5 text-slate-600" />
                <div>
                  <p className="font-medium">Microphone</p>
                  <p className="text-sm text-muted-foreground">Required for audio recording</p>
                </div>
              </div>
              {micPermission === null ? (
                <AlertCircle className="h-5 w-5 text-slate-400" />
              ) : micPermission ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
            </div>
          </div>

          {/* Camera Preview */}
          {isTestingCamera && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Camera Preview</p>
              <div className="relative rounded-lg overflow-hidden border border-slate-200 bg-black">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-auto" />
              </div>
            </div>
          )}

          {/* Test Button */}
          {!isTestingCamera && (
            <Button onClick={testDevices} className="w-full" size="lg">
              Test Camera & Microphone
            </Button>
          )}

          {/* Proceed Button */}
          {canProceed && (
            <Button onClick={onComplete} className="w-full" size="lg" variant="default">
              Start Interview
            </Button>
          )}

          {/* Error Message */}
          {cameraPermission === false || micPermission === false ? (
            <div className="space-y-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {errorMessage || "Unable to access your camera or microphone. Please check your browser permissions and try again."}
                </AlertDescription>
              </Alert>
              
              {/* Mobile-specific instructions */}
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-semibold mb-2">📱 How to Fix Camera/Microphone Access:</p>
                  
                  <div className="space-y-3 text-sm">
                    {/* iOS Chrome Instructions */}
                    <div className="border-l-4 border-red-500 pl-3 bg-red-50 p-2 rounded">
                      <p className="font-semibold mb-1">🍎 iPhone Chrome 用户：</p>
                      <p className="text-sm mb-2">
                        iOS 上的 Chrome 权限设置比较特殊，请按以下步骤操作：
                      </p>
                      <ol className="list-decimal list-inside space-y-2 ml-2">
                        <li>
                          <strong>方法1：在地址栏左侧</strong>
                          <ul className="list-disc list-inside ml-4 mt-1">
                            <li>点击地址栏左侧的 <strong>🔒 锁形图标</strong></li>
                            <li>如果看到 "权限" 或 "Permissions"，点击进入</li>
                            <li>允许摄像头和麦克风</li>
                          </ul>
                        </li>
                        <li className="mt-2">
                          <strong>方法2：刷新页面重新授权</strong>
                          <ul className="list-disc list-inside ml-4 mt-1">
                            <li>完全关闭这个标签页</li>
                            <li>重新打开链接</li>
                            <li>当浏览器弹出权限请求时，点击 <strong>"允许"</strong></li>
                          </ul>
                        </li>
                        <li className="mt-2">
                          <strong>方法3：使用 Safari（推荐）</strong>
                          <ul className="list-disc list-inside ml-4 mt-1">
                            <li>在 Safari 中打开此链接</li>
                            <li>点击地址栏的 <strong>aA</strong> 图标</li>
                            <li>选择 "网站设置" → 允许摄像头和麦克风</li>
                          </ul>
                        </li>
                      </ol>
                    </div>
                    
                    {/* iOS Safari Instructions */}
                    <div className="border-l-4 border-blue-500 pl-3">
                      <p className="font-semibold mb-1">🧭 iPhone Safari (推荐)：</p>
                      <ol className="list-decimal list-inside space-y-1 ml-2">
                        <li>点击地址栏左侧的 <strong>aA</strong> 图标</li>
                        <li>点击 <strong>"网站设置"</strong></li>
                        <li>将 <strong>摄像头</strong> 和 <strong>麦克风</strong> 改为 <strong>"允许"</strong></li>
                        <li>点击 <strong>"完成"</strong> 并刷新页面</li>
                      </ol>
                    </div>
                    
                    {/* Android Instructions */}
                    <div className="border-l-4 border-green-500 pl-3">
                      <p className="font-semibold mb-1">🤖 Android (Chrome):</p>
                      <ol className="list-decimal list-inside space-y-1 ml-2">
                        <li>Tap the 🔒 lock icon in address bar</li>
                        <li>Tap <strong>"Permissions"</strong> or <strong>"Site settings"</strong></li>
                        <li>Enable <strong>Camera</strong> and <strong>Microphone</strong></li>
                        <li>Refresh this page</li>
                      </ol>
                    </div>
                    
                    {/* System-level permissions */}
                    <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                      <p className="font-semibold mb-2">⚠️ 还是不行？检查 iPhone 系统设置：</p>
                      <ol className="list-decimal list-inside space-y-1 text-xs ml-2">
                        <li>打开 iPhone <strong>设置</strong> app</li>
                        <li>向下滚动找到 <strong>Chrome</strong> 或 <strong>Safari</strong></li>
                        <li>确保 <strong>摄像头</strong> 和 <strong>麦克风</strong> 开关已打开（绿色）</li>
                        <li>返回浏览器，刷新页面</li>
                      </ol>
                      <p className="text-xs mt-2 text-muted-foreground">
                        💡 提示：如果在系统设置里找不到 Chrome，说明 Chrome 从未请求过权限。请尝试上面的"方法2：刷新页面重新授权"。
                      </p>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
              
              {/* Action buttons */}
              <div className="flex gap-2">
                <Button onClick={testDevices} variant="outline" className="flex-1">
                  重试
                </Button>
                <Button 
                  onClick={() => {
                    // 复制当前 URL 到剪贴板
                    navigator.clipboard.writeText(window.location.href).then(() => {
                      alert('✅ 链接已复制！\n\n请打开 Safari，粘贴链接并访问。\nSafari 对摄像头权限支持更好。')
                    }).catch(() => {
                      // 如果复制失败，直接显示提示
                      alert('请复制当前页面链接，然后在 Safari 中打开')
                    })
                  }}
                  variant="default" 
                  className="flex-1"
                >
                  📋 复制链接用 Safari 打开
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Interview Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-semibold">
              1
            </div>
            <div>
              <p className="font-medium">Read the prompt carefully</p>
              <p className="text-sm text-muted-foreground">
                You'll have 15 seconds to prepare your response after reading each prompt
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-semibold">
              2
            </div>
            <div>
              <p className="font-medium">Record your response</p>
              <p className="text-sm text-muted-foreground">
                You'll have 60 seconds to record your video response to each prompt
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-semibold">
              3
            </div>
            <div>
              <p className="font-medium">Complete all prompts</p>
              <p className="text-sm text-muted-foreground">Answer 3-5 prompts covering different topics and skills</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
