"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Play, Pause, Volume2, VolumeX, Maximize, SkipForward, SkipBack } from "lucide-react"

interface VideoSegment {
  promptId: string
  videoUrl: string
  sequenceNumber: number
  duration: number
  questionText: string
  category: string
}

interface SubtitleQuestion {
  id: string
  questionNumber: number
  category: string
  text: string
  startTime: number
  endTime: number
  duration: number
  videoUrl: string
}

interface SubtitleMetadata {
  interviewId: string
  totalDuration: number
  createdAt: string
  segments: VideoSegment[]
  questions: SubtitleQuestion[]
}

interface MultiSegmentVideoPlayerProps {
  subtitleUrl: string
  autoPlay?: boolean
}

export function MultiSegmentVideoPlayer({ 
  subtitleUrl,
  autoPlay = false 
}: MultiSegmentVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [globalTime, setGlobalTime] = useState(0) // 全局时间轴
  const [currentSubtitle, setCurrentSubtitle] = useState<SubtitleQuestion | null>(null)
  const [metadata, setMetadata] = useState<SubtitleMetadata | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [videoReady, setVideoReady] = useState(false)

  // 加载元数据
  useEffect(() => {
    const loadMetadata = async () => {
      try {
        console.log("[MultiPlayer] Loading metadata from:", subtitleUrl)
        const response = await fetch(subtitleUrl)
        
        if (!response.ok) {
          throw new Error(`Failed to load metadata: ${response.status}`)
        }
        
        const data = await response.json()
        console.log("[MultiPlayer] Metadata loaded:", data)
        setMetadata(data)
        setLoading(false)
      } catch (err) {
        console.error("[MultiPlayer] Failed to load metadata:", err)
        setError(err instanceof Error ? err.message : "Failed to load metadata")
        setLoading(false)
      }
    }

    loadMetadata()
  }, [subtitleUrl])

  // 更新当前字幕（基于全局时间）
  useEffect(() => {
    if (!metadata) return

    const current = metadata.questions.find(
      (q) => globalTime >= q.startTime && globalTime < q.endTime
    )

    setCurrentSubtitle(current || null)
  }, [globalTime, metadata])

  // 当前分段
  const currentSegment = metadata?.segments[currentSegmentIndex]
  
  // 将 B2 URL 转换为代理 URL 以避免 COEP 限制
  const getProxyVideoUrl = (videoUrl: string) => {
    return `/api/proxy-video?url=${encodeURIComponent(videoUrl)}`
  }

  // 视频事件处理
  const handleTimeUpdate = () => {
    if (videoRef.current && metadata) {
      const localTime = videoRef.current.currentTime
      setCurrentTime(localTime)
      
      // 计算全局时间（前面所有分段的总时长 + 当前分段的时间）
      let accumulatedTime = 0
      for (let i = 0; i < currentSegmentIndex; i++) {
        accumulatedTime += metadata.segments[i].duration
      }
      setGlobalTime(accumulatedTime + localTime)
    }
  }

  const handleLoadedMetadata = () => {
    console.log('[MultiPlayer] Metadata loaded for segment', currentSegmentIndex + 1)
    setVideoReady(true)
  }

  const handleCanPlay = () => {
    console.log('[MultiPlayer] Video can play, segment', currentSegmentIndex + 1)
    setVideoReady(true)
    
    // 如果设置了自动播放，且是第一个分段，自动开始播放
    if (autoPlay && currentSegmentIndex === 0 && videoRef.current) {
      videoRef.current.play().catch(err => {
        console.error('[MultiPlayer] Auto-play error:', err)
      })
    }
  }

  const handleVideoEnded = () => {
    console.log('[MultiPlayer] Segment', currentSegmentIndex + 1, 'ended')
    
    // 如果还有下一个分段，切换到下一个
    if (metadata && currentSegmentIndex < metadata.segments.length - 1) {
      console.log('[MultiPlayer] Switching to next segment...')
      setCurrentSegmentIndex(prev => prev + 1)
      setVideoReady(false)
      // 视频会自动加载新的 src 并继续播放
    } else {
      console.log('[MultiPlayer] All segments completed')
      setIsPlaying(false)
    }
  }

  // 当分段索引改变时，如果正在播放，自动播放新分段
  useEffect(() => {
    if (isPlaying && videoRef.current && videoReady) {
      // 稍微延迟确保视频完全加载
      const timer = setTimeout(() => {
        videoRef.current?.play().catch(err => {
          console.error('[MultiPlayer] Auto-play next segment error:', err)
          // 如果自动播放失败，尝试静音播放
          if (videoRef.current) {
            videoRef.current.muted = true
            videoRef.current.play().catch(console.error)
          }
        })
      }, 100)
      
      return () => clearTimeout(timer)
    }
  }, [currentSegmentIndex, videoReady, isPlaying])

  const togglePlay = async () => {
    if (!videoRef.current || !videoReady) return
    
    const video = videoRef.current
    
    try {
      if (video.paused) {
        console.log('[MultiPlayer] Attempting to play...')
        await video.play()
        console.log('[MultiPlayer] Playing')
      } else {
        console.log('[MultiPlayer] Pausing')
        video.pause()
      }
    } catch (error) {
      console.error('[MultiPlayer] Play error:', error)
      if (error instanceof Error && error.name === 'NotAllowedError') {
        try {
          video.muted = true
          setIsMuted(true)
          await video.play()
          console.log('[MultiPlayer] Playing (muted)')
        } catch (retryError) {
          console.error('[MultiPlayer] Retry play error:', retryError)
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

  const goToNextSegment = () => {
    if (metadata && currentSegmentIndex < metadata.segments.length - 1) {
      setCurrentSegmentIndex(prev => prev + 1)
      setVideoReady(false)
    }
  }

  const goToPreviousSegment = () => {
    if (currentSegmentIndex > 0) {
      setCurrentSegmentIndex(prev => prev - 1)
      setVideoReady(false)
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

  if (loading) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-6">
          <div className="aspect-video bg-black rounded-lg flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-2"></div>
              <p className="text-white">Loading interview...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !metadata || !currentSegment) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-6">
          <div className="aspect-video bg-black rounded-lg flex items-center justify-center">
            <p className="text-white">Failed to load video: {error || 'No segments found'}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* 视频容器 */}
          <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
            <video
              key={currentSegment.videoUrl} // 使用 key 强制重新加载新视频
              ref={videoRef}
              src={getProxyVideoUrl(currentSegment.videoUrl)}
              className="w-full h-full cursor-pointer"
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onCanPlay={handleCanPlay}
              onEnded={handleVideoEnded}
              preload="auto"
              playsInline
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onError={(e) => {
                console.error('[MultiPlayer] Video error:', e)
                setError('Failed to load video segment')
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
            {!videoReady && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-2"></div>
                  <p className="text-white">Loading segment {currentSegmentIndex + 1}...</p>
                </div>
              </div>
            )}

            {/* 分段指示器 */}
            <div className="absolute top-4 right-4 bg-black/80 px-3 py-1.5 rounded-lg">
              <p className="text-white text-sm font-medium">
                Segment {currentSegmentIndex + 1} / {metadata.segments.length}
              </p>
            </div>
          </div>

          {/* 控制栏 */}
          <div className="space-y-2">
            {/* 全局进度条 */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground min-w-[40px]">
                {formatTime(globalTime)}
              </span>
              <div className="flex-1 h-2 bg-gray-200 rounded-lg relative overflow-hidden">
                {/* 分段分界线 */}
                {metadata.segments.map((seg, idx) => {
                  if (idx === 0) return null
                  let accumulatedTime = 0
                  for (let i = 0; i < idx; i++) {
                    accumulatedTime += metadata.segments[i].duration
                  }
                  const position = (accumulatedTime / metadata.totalDuration) * 100
                  return (
                    <div
                      key={idx}
                      className="absolute top-0 bottom-0 w-px bg-gray-400"
                      style={{ left: `${position}%` }}
                    />
                  )
                })}
                {/* 进度填充 */}
                <div 
                  className="absolute top-0 left-0 bottom-0 bg-blue-500 transition-all"
                  style={{ width: `${(globalTime / metadata.totalDuration) * 100}%` }}
                />
              </div>
              <span className="text-sm text-muted-foreground min-w-[40px]">
                {formatTime(metadata.totalDuration)}
              </span>
            </div>

            {/* 控制按钮 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={goToPreviousSegment}
                  disabled={currentSegmentIndex === 0}
                  title="Previous segment"
                >
                  <SkipBack className="h-4 w-4" />
                </Button>

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
                  onClick={goToNextSegment}
                  disabled={currentSegmentIndex === metadata.segments.length - 1}
                  title="Next segment"
                >
                  <SkipForward className="h-4 w-4" />
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


          {/* 面试信息 */}
          <div className="text-sm text-muted-foreground">
            <p>Total Duration: {formatTime(metadata.totalDuration)}</p>
            <p>Total Questions: {metadata.questions.length}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

