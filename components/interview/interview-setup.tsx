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
        } else if (err.name === 'SecurityError') {
          setErrorMessage("Access denied due to security restrictions. Make sure you're using HTTPS.")
        } else {
          setErrorMessage(`Error: ${err.message}`)
        }
      }
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
                    {/* iOS/Safari Instructions */}
                    <div className="border-l-4 border-blue-500 pl-3">
                      <p className="font-semibold mb-1">🍎 iPhone/iPad (Safari or Chrome):</p>
                      <ol className="list-decimal list-inside space-y-1 ml-2">
                        <li>Tap the <strong>aA</strong> icon (or 🔒) in the address bar at the top</li>
                        <li>Tap <strong>"Website Settings"</strong></li>
                        <li>Change <strong>Camera</strong> and <strong>Microphone</strong> to <strong>"Allow"</strong></li>
                        <li>Tap <strong>"Done"</strong> and refresh this page</li>
                      </ol>
                      <p className="mt-2 text-xs text-muted-foreground">
                        Alternative: Settings app → Safari → Camera/Microphone → Allow
                      </p>
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
                    <div className="mt-3 p-2 bg-yellow-50 rounded">
                      <p className="text-xs font-semibold">⚠️ Still not working?</p>
                      <p className="text-xs mt-1">
                        Check your phone's system settings: <strong>Settings → Privacy & Security → Camera/Microphone</strong> → Make sure Safari/Chrome is allowed.
                      </p>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
              
              {/* Retry button */}
              <Button onClick={testDevices} variant="outline" className="w-full">
                Try Again
              </Button>
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
                You'll have 60-90 seconds to record your video response to each prompt
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
