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
  debug?: boolean
}

interface VideoStats {
  readyState: number
  networkState: number
  paused: boolean
  ended: boolean
  errorCode: number | null
  errorMessage: string | null
  bufferedRanges: string
  currentSrc: string
}

export function VideoPlayerWithSubtitles({ 
  videoUrl, 
  subtitleUrl,
  autoPlay = false,
  debug = false,
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
  const [videoStats, setVideoStats] = useState<VideoStats>({
    readyState: 0,
    networkState: 0,
    paused: true,
    ended: false,
    errorCode: null,
    errorMessage: null,
    bufferedRanges: '',
    currentSrc: videoUrl,
  })

  const updateVideoStats = () => {
    const video = videoRef.current
    if (!video) return

    try {
      let bufferedRanges = ''
      for (let i = 0; i < video.buffered.length; i++) {
        bufferedRanges += `[${video.buffered.start(i).toFixed(2)}-${video.buffered.end(i).toFixed(2)}] `
      }

      setVideoStats({
        readyState: video.readyState,
        networkState: video.networkState,
        paused: video.paused,
        ended: video.ended,
        errorCode: video.error?.code ?? null,
        errorMessage: video.error?.message ?? null,
        bufferedRanges: bufferedRanges.trim(),
        currentSrc: video.currentSrc,
      })
    } catch (statsError) {
      console.warn('[Player] Failed to update video stats:', statsError)
    }
  }

  // 检查视频是否已经准备好（处理缓存情况）
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    
    console.log('[Player] Video element created, src:', video.src)
    
    // 如果视频已经加载了元数据，直接设置为准备好
    if (video.readyState >= 2) { // HAVE_CURRENT_DATA or higher
      console.log('[Player] Video already loaded (cached), readyState:', video.readyState)
      setVideoReady(true)
      setLoading(false)
      if (video.duration) {
        setDuration(video.duration)
      }
    }

    updateVideoStats()
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
      if (debug) {
        updateVideoStats()
      }
    }
  }

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration)
      console.log('[Player] Metadata loaded, duration:', videoRef.current.duration)
      // 视频元数据加载完成，可以播放了
      setVideoReady(true)
      setLoading(false)
      updateVideoStats()
    }
  }

  const handleCanPlay = () => {
    console.log('[Player] Video can play')
    setVideoReady(true)
    setLoading(false)
    updateVideoStats()
  }
  
  const handleLoadedData = () => {
    console.log('[Player] Video data loaded')
    setVideoReady(true)
    setLoading(false)
    updateVideoStats()
  }

  const togglePlay = async () => {
    if (!videoRef.current) return
    
    const video = videoRef.current
    
    try {
      // 检查视频是否已暂停
      if (video.paused) {
        console.log('[Player] Attempting to play...')
        console.log('[Player] Current readyState:', video.readyState)
        
        // iOS 上，如果只有元数据（readyState < 2），需要调用 load() 开始加载视频数据
        if (video.readyState < 2) {
          console.log('[Player] Only metadata loaded, calling load() to start loading video data...')
          setLoading(true)
          video.load() // 强制开始加载视频数据
          
          // 等待视频数据开始加载
          return new Promise<void>((resolve) => {
            const onCanPlay = () => {
              console.log('[Player] Video data loaded, ready to play')
              video.removeEventListener('canplay', onCanPlay)
              video.removeEventListener('error', onError)
              video.play().then(() => {
                console.log('[Player] Playing after load()')
                updateVideoStats()
                resolve()
              }).catch((playError) => {
                console.error('[Player] Play error after load():', playError)
                updateVideoStats()
                resolve()
              })
            }
            
            const onError = () => {
              console.error('[Player] Error loading video data')
              video.removeEventListener('canplay', onCanPlay)
              video.removeEventListener('error', onError)
              updateVideoStats()
              resolve()
            }
            
            video.addEventListener('canplay', onCanPlay, { once: true })
            video.addEventListener('error', onError, { once: true })
            
            // 超时保护
            setTimeout(() => {
              video.removeEventListener('canplay', onCanPlay)
              video.removeEventListener('error', onError)
              console.log('[Player] Load timeout, attempting to play anyway...')
              video.play().catch((err) => {
                console.error('[Player] Play error after timeout:', err)
              })
              updateVideoStats()
              resolve()
            }, 10000) // 10秒超时
          })
        }
        
        // 如果已经有足够的数据，直接播放
        await video.play()
        console.log('[Player] Playing')
      } else {
        console.log('[Player] Pausing')
        video.pause()
      }
      updateVideoStats()
    } catch (error) {
      console.error('[Player] Play error:', error)
      // 如果自动播放被阻止，尝试静音播放
      if (error instanceof Error && error.name === 'NotAllowedError') {
        try {
          video.muted = true
          setIsMuted(true)
          await video.play()
          console.log('[Player] Playing (muted due to browser policy)')
          updateVideoStats()
        } catch (retryError) {
          console.error('[Player] Retry play error:', retryError)
          updateVideoStats()
        }
      } else {
        updateVideoStats()
      }
    }
  }

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
      updateVideoStats()
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
              src={videoUrl}
              className="w-full h-full cursor-pointer"
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onLoadedData={handleLoadedData}
              onCanPlay={handleCanPlay}
              onProgress={() => {
                // 追踪视频数据加载进度
                if (debug) {
                  updateVideoStats()
                }
              }}
              onWaiting={() => {
                console.log('[Player] Video waiting for data...')
                if (debug) {
                  updateVideoStats()
                }
              }}
              onStalled={() => {
                console.log('[Player] Video stalled (network issue?)')
                if (debug) {
                  updateVideoStats()
                }
              }}
              preload="metadata"
              playsInline
              // @ts-ignore - webkit-playsinline for iOS Safari
              webkit-playsinline="true"
              // @ts-ignore - x5-playsinline for Android browsers
              x5-playsinline="true"
              controls={false}
              crossOrigin="anonymous"
              onPlay={() => {
                console.log('[Player] Video play event')
                setIsPlaying(true)
                updateVideoStats()
              }}
              onPause={() => {
                console.log('[Player] Video pause event')
                setIsPlaying(false)
                updateVideoStats()
              }}
              onError={(e) => {
                const video = e.currentTarget
                console.error('[Player] Video error:', {
                  error: e,
                  errorCode: video.error?.code,
                  errorMessage: video.error?.message,
                  networkState: video.networkState,
                  readyState: video.readyState,
                  src: video.src,
                })
                setError(`Failed to load video: ${video.error?.message || 'Unknown error'}`)
                updateVideoStats()
              }}
              onClick={togglePlay}
            />

            {/* 字幕覆盖层 */}
            {currentSubtitle && (
              <div className="absolute bottom-16 left-0 right-0 px-4 pointer-events-none">
                <div className="max-w-3xl mx-auto flex flex-col items-center gap-2">
                  {/* Question 标签 */}
                  <div className="bg-black/80 px-3 py-1 rounded">
                    <p className="text-white text-xs font-semibold">
                      Question {currentSubtitle.questionNumber}
                    </p>
                  </div>
                  
                  {/* 问题文本 */}
                  <div className="bg-black/80 px-4 py-2 rounded max-w-full">
                    <p className="text-white text-sm leading-snug">
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

          {debug && (
            <div className="mt-4 p-4 border border-dashed rounded-lg bg-slate-50 text-xs font-mono text-slate-700 space-y-1">
              <p className="font-semibold">Debug Info</p>
              <p>readyState: {videoStats.readyState}</p>
              <p>networkState: {videoStats.networkState}</p>
              <p>paused: {videoStats.paused ? 'true' : 'false'} | ended: {videoStats.ended ? 'true' : 'false'}</p>
              <p>buffered: {videoStats.bufferedRanges || 'N/A'}</p>
              <p>errorCode: {videoStats.errorCode ?? 'N/A'}</p>
              <p>errorMessage: {videoStats.errorMessage ?? 'N/A'}</p>
              <p>currentSrc: {videoStats.currentSrc}</p>
              <p>userAgent: {typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A'}</p>
            </div>
          )}

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

