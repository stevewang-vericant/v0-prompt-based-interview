"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Play, Pause, Volume2, VolumeX, Maximize } from "lucide-react"

interface SubtitleQuestion {
  id: string
  questionNumber: number
  category: string
  text: string
  startTime: number
  endTime: number
  duration: number
}

interface SubtitleMetadata {
  interviewId: string
  totalDuration: number
  createdAt: string
  questions: SubtitleQuestion[]
}

interface VideoPlayerWithSubtitlesProps {
  videoUrl: string
  subtitleUrl?: string
  autoPlay?: boolean
}

export function VideoPlayerWithSubtitles({ 
  videoUrl, 
  subtitleUrl,
  autoPlay = false 
}: VideoPlayerWithSubtitlesProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [currentSubtitle, setCurrentSubtitle] = useState<SubtitleQuestion | null>(null)
  const [subtitles, setSubtitles] = useState<SubtitleMetadata | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [videoReady, setVideoReady] = useState(false)

  // 将 B2 URL 转换为代理 URL 以避免 COEP 限制
  const getProxyVideoUrl = (url: string): string => {
    // 如果已经是代理 URL，直接返回
    if (url.includes('/api/proxy-video')) {
      return url
    }
    // 如果是 B2 URL，通过代理访问
    return `/api/proxy-video?url=${encodeURIComponent(url)}`
  }

  // 检查视频是否已经准备好（处理缓存情况）
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    
    // 如果视频已经加载了元数据，直接设置为准备好
    if (video.readyState >= 2) { // HAVE_CURRENT_DATA or higher
      console.log('[Player] Video already loaded (cached), readyState:', video.readyState)
      setVideoReady(true)
      setLoading(false)
      if (video.duration) {
        setDuration(video.duration)
      }
    }
  }, [])

  // 加载字幕元数据
  useEffect(() => {
    if (!subtitleUrl) {
      setLoading(false)
      return
    }

    const loadSubtitles = async () => {
      try {
        console.log("[Player] Loading subtitles from:", subtitleUrl)
        const response = await fetch(subtitleUrl)
        
        if (!response.ok) {
          throw new Error(`Failed to load subtitles: ${response.status}`)
        }
        
        const data = await response.json()
        console.log("[Player] Subtitles loaded:", data)
        setSubtitles(data)
      } catch (err) {
        console.error("[Player] Failed to load subtitles:", err)
        setError(err instanceof Error ? err.message : "Failed to load subtitles")
      } finally {
        setLoading(false)
      }
    }

    loadSubtitles()
  }, [subtitleUrl])

  // 更新当前字幕
  useEffect(() => {
    if (!subtitles) return

    // 调试信息：显示时间轴数据
    if (Math.floor(currentTime) % 5 === 0 && Math.floor(currentTime) > 0) {
      console.log('[Player] Current time:', currentTime, 'seconds')
      console.log('[Player] Available questions:', subtitles.questions.map(q => ({
        question: q.questionNumber,
        start: q.startTime,
        end: q.endTime,
        text: q.text.substring(0, 30) + '...'
      })))
    }

    const current = subtitles.questions.find(
      (q) => currentTime >= q.startTime && currentTime < q.endTime
    )

    if (current && current !== currentSubtitle) {
      console.log('[Player] Subtitle changed to question', current.questionNumber, 'at', currentTime, 'seconds')
      console.log('[Player] Question text:', current.text.substring(0, 50) + '...')
    }

    setCurrentSubtitle(current || null)
  }, [currentTime, subtitles])

  // 视频事件处理
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime)
    }
  }

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration)
      console.log('[Player] Metadata loaded, duration:', videoRef.current.duration)
      // 视频元数据加载完成，可以播放了
      setVideoReady(true)
      setLoading(false)
    }
  }

  const handleCanPlay = () => {
    console.log('[Player] Video can play')
    setVideoReady(true)
    setLoading(false)
  }
  
  const handleLoadedData = () => {
    console.log('[Player] Video data loaded')
    setVideoReady(true)
    setLoading(false)
  }

  const togglePlay = async () => {
    if (!videoRef.current) return
    
    const video = videoRef.current
    
    try {
      // 检查视频是否已暂停
      if (video.paused) {
        console.log('[Player] Attempting to play...')
        // 先确保视频已加载元数据
        if (video.readyState < 2) {
          console.log('[Player] Waiting for video to load...')
          return
        }
        await video.play()
        console.log('[Player] Playing')
      } else {
        console.log('[Player] Pausing')
        video.pause()
      }
    } catch (error) {
      console.error('[Player] Play error:', error)
      // 如果自动播放被阻止，尝试静音播放
      if (error instanceof Error && error.name === 'NotAllowedError') {
        try {
          video.muted = true
          setIsMuted(true)
          await video.play()
          console.log('[Player] Playing (muted due to browser policy)')
        } catch (retryError) {
          console.error('[Player] Retry play error:', retryError)
        }
      }
    }
  }

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value)
    if (videoRef.current) {
      videoRef.current.currentTime = time
      setCurrentTime(time)
    }
  }

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen()
      } else {
        videoRef.current.requestFullscreen()
      }
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* 视频容器 */}
          <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
            <video
              ref={videoRef}
              src={getProxyVideoUrl(videoUrl)}
              className="w-full h-full cursor-pointer"
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onLoadedData={handleLoadedData}
              onCanPlay={handleCanPlay}
              preload="auto"
              playsInline
              onPlay={() => {
                console.log('[Player] Video play event')
                setIsPlaying(true)
              }}
              onPause={() => {
                console.log('[Player] Video pause event')
                setIsPlaying(false)
              }}
              onError={(e) => {
                console.error('[Player] Video error:', e)
                setError('Failed to load video')
              }}
              onClick={togglePlay}
            />

            {/* 字幕覆盖层 */}
            {currentSubtitle && (
              <div className="absolute bottom-16 left-0 right-0 px-4 pointer-events-none">
                <div className="max-w-3xl mx-auto flex flex-col items-center gap-3">
                  {/* Question 标签 */}
                  <div className="bg-black/80 px-4 py-2 rounded-lg">
                    <p className="text-white text-xl font-bold">
                      Question {currentSubtitle.questionNumber}
                    </p>
                  </div>
                  
                  {/* 问题文本 */}
                  <div className="bg-black/80 px-6 py-3 rounded-lg max-w-full">
                    <p className="text-white text-lg leading-relaxed">
                      {currentSubtitle.text}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 加载状态 */}
            {(loading || !videoReady) && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-2"></div>
                  <p className="text-white">
                    {loading ? 'Loading subtitles...' : 'Loading video...'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* 控制栏 */}
          <div className="space-y-2">
            {/* 进度条 */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground min-w-[40px]">
                {formatTime(currentTime)}
              </span>
              <input
                type="range"
                min="0"
                max={duration || 0}
                value={currentTime}
                onChange={handleSeek}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-sm text-muted-foreground min-w-[40px]">
                {formatTime(duration)}
              </span>
            </div>

            {/* 控制按钮 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={togglePlay}
                  disabled={!videoReady}
                  title={videoReady ? (isPlaying ? 'Pause' : 'Play') : 'Loading...'}
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
                
                <Button
                  variant="outline"
                  size="icon"
                  onClick={toggleMute}
                >
                  {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </Button>
              </div>

              <Button
                variant="outline"
                size="icon"
                onClick={toggleFullscreen}
              >
                <Maximize className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* 字幕信息 */}
          {subtitles && (
            <div className="text-sm text-muted-foreground">
              <p>Total Duration: {formatTime(subtitles.totalDuration)}</p>
              <p>Questions: {subtitles.questions.length}</p>
              {error && <p className="text-red-500">⚠️ {error}</p>}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

