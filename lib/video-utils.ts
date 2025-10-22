/**
 * 视频工具函数
 */

/**
 * 获取视频 Blob 的时长（兼容 iOS Safari）
 */
export async function getVideoDuration(videoBlob: Blob): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    
    // iOS Safari 需要这些属性
    video.playsInline = true
    video.muted = true
    video.preload = 'metadata'
    
    // 超时保护（30秒）
    const timeout = setTimeout(() => {
      cleanup()
      reject(new Error('Video metadata loading timeout after 30s'))
    }, 30000)
    
    const cleanup = () => {
      clearTimeout(timeout)
      if (video.src) {
        URL.revokeObjectURL(video.src)
      }
      video.onloadedmetadata = null
      video.onerror = null
      video.onloadeddata = null
    }
    
    video.onloadedmetadata = () => {
      console.log(`[Video] Metadata loaded, duration: ${video.duration}s`)
      if (video.duration && isFinite(video.duration)) {
        cleanup()
        resolve(video.duration)
      } else {
        // 如果 duration 还没准备好，等待 loadeddata 事件
        console.log('[Video] Duration not ready, waiting for loadeddata...')
      }
    }
    
    video.onloadeddata = () => {
      console.log(`[Video] Data loaded, duration: ${video.duration}s`)
      if (video.duration && isFinite(video.duration)) {
        cleanup()
        resolve(video.duration)
      }
    }
    
    video.onerror = (e) => {
      console.error('[Video] Error loading video:', e)
      cleanup()
      reject(new Error('Failed to load video metadata'))
    }
    
    // 创建 Object URL 并设置
    const url = URL.createObjectURL(videoBlob)
    video.src = url
    
    // iOS Safari 可能需要主动触发 load
    video.load()
    
    console.log(`[Video] Loading video metadata, blob size: ${videoBlob.size} bytes`)
  })
}
