"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, XCircle, Upload, Video } from 'lucide-react'

export default function TestUploadPage() {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStatus, setUploadStatus] = useState('')
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const testCloudinaryConfig = async () => {
    try {
      const response = await fetch('/api/test-cloudinary')
      const data = await response.json()
      setResult(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setResult(null)
    }
  }

  const testVideoUpload = async () => {
    setIsUploading(true)
    setUploadProgress(0)
    setUploadStatus('Preparing test video...')
    setError(null)
    setResult(null)

    try {
      // 创建一个简单的测试视频（1秒的黑色视频）
      const canvas = document.createElement('canvas')
      canvas.width = 640
      canvas.height = 480
      const ctx = canvas.getContext('2d')
      
      if (!ctx) {
        throw new Error('Could not get canvas context')
      }

      // 绘制黑色背景
      ctx.fillStyle = 'black'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      // 添加文字
      ctx.fillStyle = 'white'
      ctx.font = '24px Arial'
      ctx.textAlign = 'center'
      ctx.fillText('Test Video', canvas.width / 2, canvas.height / 2)
      ctx.fillText(new Date().toLocaleTimeString(), canvas.width / 2, canvas.height / 2 + 30)

      // 创建视频流
      const stream = canvas.captureStream(30) // 30 FPS
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp8'
      })

      const chunks: Blob[] = []
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data)
        }
      }

      return new Promise<void>((resolve, reject) => {
        mediaRecorder.onstop = async () => {
          try {
            const videoBlob = new Blob(chunks, { type: 'video/webm' })
            console.log('Test video created, size:', videoBlob.size, 'bytes')

            setUploadStatus('Uploading test video to Cloudinary...')
            setUploadProgress(30)

            // 测试客户端上传到Cloudinary
            const formData = new FormData()
            formData.append('file', videoBlob, 'test-video.webm')
            formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!)
            formData.append('folder', 'test-uploads')
            formData.append('public_id', `test-${Date.now()}`)
            formData.append('resource_type', 'video')

            const response = await fetch(
              `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/video/upload`,
              {
                method: 'POST',
                body: formData
              }
            )

            if (!response.ok) {
              const errorText = await response.text()
              throw new Error(`Cloudinary upload failed: ${response.status} ${errorText}`)
            }

            const uploadResult = await response.json()
            console.log('Upload result:', uploadResult)

            setUploadProgress(100)
            setUploadStatus('Upload complete!')
            setResult({
              success: true,
              message: 'Test video uploaded successfully',
              uploadResult: {
                public_id: uploadResult.public_id,
                secure_url: uploadResult.secure_url,
                bytes: uploadResult.bytes,
                duration: uploadResult.duration
              }
            })

            resolve()
          } catch (err) {
            reject(err)
          }
        }

        mediaRecorder.onerror = (event) => {
          reject(new Error('MediaRecorder error: ' + event))
        }

        // 录制1秒视频
        mediaRecorder.start()
        setTimeout(() => {
          mediaRecorder.stop()
        }, 1000)
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setUploadStatus('Upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Upload Test Page</h1>
          <p className="text-gray-600 mt-2">Test Cloudinary configuration and video upload</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Configuration Test */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Configuration Test
              </CardTitle>
              <CardDescription>
                Check if all required environment variables are configured
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={testCloudinaryConfig}
                className="w-full"
                variant="outline"
              >
                Test Configuration
              </Button>
              
              {result && (
                <div className="space-y-2">
                  <h4 className="font-medium">Configuration Status:</h4>
                  <div className="space-y-1 text-sm">
                    {Object.entries(result.recommendations || {}).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-2">
                        <span className="font-medium capitalize">{key}:</span>
                        <span className={typeof value === 'string' && value.includes('✅') ? 'text-green-600' : 'text-red-600'}>
                          {typeof value === 'string' ? value : JSON.stringify(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Video Upload Test */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5" />
                Video Upload Test
              </CardTitle>
              <CardDescription>
                Test uploading a video directly to Cloudinary
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={testVideoUpload}
                disabled={isUploading}
                className="w-full"
              >
                {isUploading ? (
                  <>
                    <Upload className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Test Video Upload
                  </>
                )}
              </Button>

              {isUploading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>{uploadStatus}</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="w-full" />
                </div>
              )}

              {result && result.success && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Upload successful! Video URL: {result.uploadResult?.secure_url}
                  </AlertDescription>
                </Alert>
              )}

              {error && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>
                    Error: {error}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Environment Variables Info */}
        <Card>
          <CardHeader>
            <CardTitle>Environment Variables Required</CardTitle>
            <CardDescription>
              Make sure these are configured in your .env.local file
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium mb-2">Cloudinary (Client)</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME</li>
                  <li>• NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Cloudinary (Server)</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• CLOUDINARY_CLOUD_NAME</li>
                  <li>• CLOUDINARY_API_KEY</li>
                  <li>• CLOUDINARY_API_SECRET</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
