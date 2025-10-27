"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

export default function TestFFmpegPage() {
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null)
  const [convertedBlob, setConvertedBlob] = useState<Blob | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [level, setLevel] = useState<number | null>(null)

  // 录制视频
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: true,
      })

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm',
        videoBitsPerSecond: 2500000,
      })

      const chunks: Blob[] = []

      mediaRecorder.ondataavailable = (e) => {
        chunks.push(e.data)
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' })
        setVideoBlob(blob)
      }

      mediaRecorder.start()
      stream.getTracks().forEach((track) => track.stop())

      // 5 秒后停止录制
      setTimeout(() => {
        mediaRecorder.stop()
      }, 5000)

      alert('Recording started! It will stop in 5 seconds.')
    } catch (err) {
      console.error('Error recording:', err)
      setError(err instanceof Error ? err.message : 'Failed to record')
    }
  }

  // 转换视频
  const convertVideo = async () => {
    if (!videoBlob) return

    setLoading(true)
    setError(null)

    try {
      const { load } = await import('@ffmpeg/ffmpeg')
      const { toBlobURL } = await import('@ffmpeg/util')
      const { fetchFile } = await import('@ffmpeg/util')
      const { FFmpeg } = await import('@ffmpeg/ffmpeg')

      const ffmpeg = new FFmpeg()
      const CORE_VERSION = '0.12.6'

      await ffmpeg.load({
        coreURL: await toBlobURL(
          `https://cdn.jsdelivr.net/npm/@ffmpeg/core@${CORE_VERSION}/dist/umd/ffmpeg-core.js`,
          'text/javascript'
        ),
        wasmURL: await toBlobURL(
          `https://cdn.jsdelivr.net/npm/@ffmpeg/core@${CORE_VERSION}/dist/umd/ffmpeg-core.wasm`,
          'application/wasm'
        ),
      })

      console.log('FFmpeg loaded')

      // 写入输入文件
      await ffmpeg.writeFile('input.webm', await fetchFile(videoBlob))
      console.log('Input file written')

      // 执行转换（使用 Level 4.1 参数）
      const command = [
        '-i', 'input.webm',
        '-c:v', 'libx264',
        '-preset', 'slow',
        '-crf', '23',
        '-profile:v', 'high',
        '-level', '41',          // Level 4.1
        '-pix_fmt', 'yuv420p',
        '-c:a', 'aac',
        '-b:a', '128k',
        '-maxrate', '2M',
        '-bufsize', '4M',
        '-movflags', '+faststart',
        'output.mp4'
      ]

      console.log('Executing command:', command.join(' '))
      await ffmpeg.exec(command)
      console.log('Conversion complete')

      // 读取输出
      const data = await ffmpeg.readFile('output.mp4')
      const blob = new Blob([data], { type: 'video/mp4' })
      setConvertedBlob(blob)

      // 检查 level
      await checkLevel(blob)

      // 清理
      await ffmpeg.deleteFile('input.webm').catch(() => {})
      await ffmpeg.deleteFile('output.mp4').catch(() => {})
    } catch (err) {
      console.error('Conversion error:', err)
      setError(err instanceof Error ? err.message : 'Conversion failed')
    } finally {
      setLoading(false)
    }
  }

  // 检查视频 level
  const checkLevel = async (blob: Blob) => {
    const url = URL.createObjectURL(blob)
    const video = document.createElement('video')
    video.src = url

    await new Promise((resolve) => {
      video.addEventListener('loadedmetadata', () => {
        console.log('Video loaded, duration:', video.duration)
        // 这里无法直接获取 level，需要在服务器端检查
        URL.revokeObjectURL(url)
        resolve(null)
      })
    })

    // 创建表单上传到服务器检查
    const formData = new FormData()
    formData.append('video', blob, 'test.mp4')

    const response = await fetch('/api/check-video-level', {
      method: 'POST',
      body: formData,
    })

    const result = await response.json()
    setLevel(result.level)
    console.log('Video level:', result)
  }

  return (
    <div className="container mx-auto p-8">
      <Card>
        <CardHeader>
          <CardTitle>FFmpeg Level Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-x-2">
            <Button onClick={startRecording} disabled={loading || !!videoBlob}>
              Record Video (5s)
            </Button>
            {videoBlob && (
              <Button onClick={convertVideo} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Converting...
                  </>
                ) : (
                  'Convert with FFmpeg'
                )}
              </Button>
            )}
          </div>

          {videoBlob && (
            <div>
              <p>Original video size: {(videoBlob.size / 1024 / 1024).toFixed(2)} MB</p>
              <video
                src={URL.createObjectURL(videoBlob)}
                controls
                className="max-w-2xl"
              />
            </div>
          )}

          {convertedBlob && (
            <div>
              <p>Converted video size: {(convertedBlob.size / 1024 / 1024).toFixed(2)} MB</p>
              <p className="font-bold">
                Level: {level !== null ? level : 'Checking...'}
              </p>
              <video
                src={URL.createObjectURL(convertedBlob)}
                controls
                className="max-w-2xl"
              />
              <Button
                className="mt-2"
                onClick={() => {
                  const url = URL.createObjectURL(convertedBlob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = 'test-level41.mp4'
                  a.click()
                  URL.revokeObjectURL(url)
                }}
              >
                Download
              </Button>
            </div>
          )}

          {error && <p className="text-red-500">Error: {error}</p>}
        </CardContent>
      </Card>
    </div>
  )
}

