/**
 * 使用 FFmpeg.wasm 在浏览器中合并视频并转换为 MP4
 * 使用 Canvas API 添加字幕（更可靠，不依赖 FFmpeg 字体支持）
 */

import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'

let ffmpeg: FFmpeg | null = null

/**
 * 获取视频 Blob 的时长
 */
async function getVideoDuration(videoBlob: Blob): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.preload = 'metadata'
    
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src)
      resolve(video.duration)
    }
    
    video.onerror = () => {
      URL.revokeObjectURL(video.src)
      reject(new Error('Failed to load video metadata'))
    }
    
    video.src = URL.createObjectURL(videoBlob)
  })
}

/**
 * 使用 Canvas 为视频添加字幕（简化版：只处理视频帧，音频由原视频保留）
 */
async function addSubtitleToVideo(
  videoBlob: Blob,
  titleText: string,
  subtitleText: string,
  onProgress?: (progress: number) => void
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    if (!ctx) {
      reject(new Error('Failed to get canvas context'))
      return
    }

    video.src = URL.createObjectURL(videoBlob)
    video.muted = false // 保留音频
    
    let mediaRecorder: MediaRecorder | null = null
    const chunks: Blob[] = []
    
    video.onloadedmetadata = () => {
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      
      // 创建 MediaStream 来捕获 canvas + 原视频音频
      const canvasStream = canvas.captureStream(30) // 30 FPS
      
      // 创建 MediaStream 包含视频和音频
      const stream = new MediaStream()
      
      // 添加 canvas 的视频轨道
      canvasStream.getVideoTracks().forEach(track => stream.addTrack(track))
      
      // 尝试从原视频获取音频流
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const source = audioContext.createMediaElementSource(video)
      const dest = audioContext.createMediaStreamDestination()
      source.connect(dest)
      source.connect(audioContext.destination) // 也连接到输出，以便播放
      
      // 添加音频轨道
      dest.stream.getAudioTracks().forEach(track => stream.addTrack(track))
      
      mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9,opus',
        videoBitsPerSecond: 2500000
      })
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data)
        }
      }
      
      mediaRecorder.onstop = () => {
        const outputBlob = new Blob(chunks, { type: 'video/webm' })
        URL.revokeObjectURL(video.src)
        resolve(outputBlob)
      }
      
      // 开始录制
      mediaRecorder.start(100)
      video.play()
    }
    
    // 绘制每一帧
    const drawFrame = () => {
      if (video.paused || video.ended) {
        if (mediaRecorder && mediaRecorder.state === 'recording') {
          mediaRecorder.stop()
        }
        return
      }
      
      // 绘制视频帧
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      
      // 绘制字幕背景和文字
      const padding = 10
      const lineHeight = 40
      const bottomMargin = 80
      
      // 绘制标题 (Question 1)
      ctx.font = 'bold 32px Arial, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      
      const titleY = canvas.height - bottomMargin - lineHeight
      const titleMetrics = ctx.measureText(titleText)
      const titleWidth = titleMetrics.width + padding * 2
      
      // 标题背景
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
      ctx.fillRect(
        (canvas.width - titleWidth) / 2,
        titleY - 20,
        titleWidth,
        40
      )
      
      // 标题文字
      ctx.fillStyle = 'white'
      ctx.fillText(titleText, canvas.width / 2, titleY)
      
      // 绘制字幕文本
      ctx.font = '24px Arial, sans-serif'
      const subtitleY = canvas.height - bottomMargin + lineHeight
      
      // 自动换行处理
      const maxWidth = canvas.width - 100
      const words = subtitleText.split(' ')
      const lines: string[] = []
      let currentLine = words[0]
      
      for (let i = 1; i < words.length; i++) {
        const testLine = currentLine + ' ' + words[i]
        const metrics = ctx.measureText(testLine)
        
        if (metrics.width > maxWidth) {
          lines.push(currentLine)
          currentLine = words[i]
        } else {
          currentLine = testLine
        }
      }
      lines.push(currentLine)
      
      // 绘制每一行字幕
      lines.forEach((line, index) => {
        const lineY = subtitleY + index * 30
        const lineMetrics = ctx.measureText(line)
        const lineWidth = lineMetrics.width + padding * 2
        
        // 字幕背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
        ctx.fillRect(
          (canvas.width - lineWidth) / 2,
          lineY - 15,
          lineWidth,
          30
        )
        
        // 字幕文字
        ctx.fillStyle = 'white'
        ctx.fillText(line, canvas.width / 2, lineY)
      })
      
      // 更新进度
      if (video.duration > 0) {
        const progress = (video.currentTime / video.duration) * 100
        onProgress?.(Math.floor(progress))
      }
      
      requestAnimationFrame(drawFrame)
    }
    
    video.onplay = () => {
      drawFrame()
    }
    
    video.onerror = (e) => {
      reject(new Error('Video loading error'))
    }
  })
}

/**
 * 初始化 FFmpeg
 */
async function loadFFmpeg() {
  if (ffmpeg) return ffmpeg

  console.log('[FFmpeg] Loading FFmpeg...')
  ffmpeg = new FFmpeg()

  // 加载 FFmpeg 核心文件
  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd'
  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
  })

  console.log('[FFmpeg] FFmpeg loaded successfully')
  return ffmpeg
}

/**
 * 视频段时长信息
 */
export interface VideoSegmentInfo {
  index: number
  duration: number
  startTime: number
  endTime: number
}

/**
 * 视频合并结果
 */
export interface MergeResult {
  videoBlob: Blob
  totalDuration: number
  segments: VideoSegmentInfo[]
}

/**
 * 合并视频并转换为 MP4
 * @param videoBlobs 按顺序排列的视频 Blob 数组
 * @param questionTexts 每个视频段对应的问题文本（可选）
 * @param onProgress 进度回调函数 (0-100)
 * @returns 合并后的 MP4 Blob 和时长信息
 */
export async function mergeVideos(
  videoBlobs: Blob[],
  questionTexts?: string[],
  onProgress?: (progress: number) => void
): Promise<MergeResult> {
  if (videoBlobs.length === 0) {
    throw new Error('No videos to merge')
  }

  // 如果只有一个视频，直接转换为 MP4
  if (videoBlobs.length === 1) {
    const duration = await getVideoDuration(videoBlobs[0])
    const videoBlob = await convertToMP4(videoBlobs[0], onProgress)
    return {
      videoBlob,
      totalDuration: duration,
      segments: [{
        index: 0,
        duration,
        startTime: 0,
        endTime: duration
      }]
    }
  }

  console.log(`[FFmpeg] Merging ${videoBlobs.length} videos...`)
  onProgress?.(5)

  const ffmpeg = await loadFFmpeg()

  // 监听 FFmpeg 进度
  let lastProgress = 5
  ffmpeg.on('progress', ({ progress }) => {
    const currentProgress = Math.min(5 + Math.floor(progress * 90), 95)
    if (currentProgress > lastProgress) {
      lastProgress = currentProgress
      onProgress?.(currentProgress)
    }
  })

  try {
    // 首先获取每个视频的时长信息
    console.log('[Video] Getting duration for each video segment...')
    const segments: VideoSegmentInfo[] = []
    let currentTime = 0
    
    for (let i = 0; i < videoBlobs.length; i++) {
      const duration = await getVideoDuration(videoBlobs[i])
      segments.push({
        index: i,
        duration: duration,
        startTime: currentTime,
        endTime: currentTime + duration
      })
      currentTime += duration
      console.log(`[Video] Segment ${i + 1} duration: ${duration.toFixed(2)}s`)
    }
    
    const totalDuration = currentTime
    console.log(`[Video] Total duration: ${totalDuration.toFixed(2)}s`)
    
    // 如果提供了问题文本，先使用 Canvas 为每个视频添加字幕
    let blobsToMerge = videoBlobs
    if (questionTexts && questionTexts.length === videoBlobs.length) {
      console.log('[Canvas] Adding subtitles to each video segment using Canvas...')
      const subtitledBlobs: Blob[] = []
      
      for (let i = 0; i < videoBlobs.length; i++) {
        const questionNumber = i + 1
        const questionText = questionTexts[i]
        console.log(`[Canvas] Processing video ${questionNumber} with subtitle...`)
        
        const subtitledBlob = await addSubtitleToVideo(
          videoBlobs[i], 
          `Question ${questionNumber}`, 
          questionText,
          (segmentProgress) => {
            const totalProgress = 5 + (i / videoBlobs.length) * 40 + (segmentProgress / videoBlobs.length) * 40
            onProgress?.(Math.floor(totalProgress))
          }
        )
        
        subtitledBlobs.push(subtitledBlob)
        console.log(`[Canvas] Video ${questionNumber} processed with subtitle`)
      }
      
      blobsToMerge = subtitledBlobs
      onProgress?.(50)
    }

    // 将所有视频写入 FFmpeg 虚拟文件系统
    console.log('[FFmpeg] Writing input files...')
    const inputFiles: string[] = []
    
    for (let i = 0; i < blobsToMerge.length; i++) {
      const inputName = `input${i}.webm`
      await ffmpeg.writeFile(inputName, await fetchFile(blobsToMerge[i]))
      inputFiles.push(inputName)
      console.log(`[FFmpeg] Written ${inputName}, size: ${blobsToMerge[i].size} bytes`)
    }

    // 创建 concat 文件列表
    const concatList = inputFiles.map(file => `file '${file}'`).join('\n')
    await ffmpeg.writeFile('concat.txt', concatList)
    console.log('[FFmpeg] Concat list created')

    // 执行合并和转换命令
    console.log('[FFmpeg] Executing merge command...')
    await ffmpeg.exec([
      '-f', 'concat',
      '-safe', '0',
      '-i', 'concat.txt',
      '-c:v', 'libx264',      // 使用 H.264 视频编码
      '-preset', 'fast',      // 快速编码预设
      '-crf', '23',           // 质量控制
      '-c:a', 'aac',          // 使用 AAC 音频编码
      '-b:a', '128k',         // 音频比特率
      '-movflags', '+faststart', // 优化 Web 播放
      'output.mp4'
    ])

    console.log('[FFmpeg] Merge completed, reading output...')
    onProgress?.(95)

    // 读取输出文件
    const data = await ffmpeg.readFile('output.mp4')
    const outputBlob = new Blob([data], { type: 'video/mp4' })
    
    console.log(`[FFmpeg] Output MP4 size: ${outputBlob.size} bytes`)

    // 清理临时文件
    console.log('[FFmpeg] Cleaning up...')
    for (const file of inputFiles) {
      try {
        await ffmpeg.deleteFile(file)
      } catch (e) {
        // 忽略删除错误
      }
    }
    try {
      await ffmpeg.deleteFile('concat.txt')
      await ffmpeg.deleteFile('output.mp4')
    } catch (e) {
      // 忽略删除错误
    }

    onProgress?.(100)
    
    return {
      videoBlob: outputBlob,
      totalDuration,
      segments
    }

  } catch (error) {
    console.error('[FFmpeg] Merge error:', error)
    throw new Error(`Failed to merge videos: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * 将单个 WebM 视频转换为 MP4
 */
async function convertToMP4(videoBlob: Blob, onProgress?: (progress: number) => void): Promise<Blob> {
  console.log('[FFmpeg] Converting single video to MP4...')
  onProgress?.(10)

  const ffmpeg = await loadFFmpeg()

  ffmpeg.on('progress', ({ progress }) => {
    const currentProgress = Math.min(10 + Math.floor(progress * 85), 95)
    onProgress?.(currentProgress)
  })

  try {
    await ffmpeg.writeFile('input.webm', await fetchFile(videoBlob))
    
    await ffmpeg.exec([
      '-i', 'input.webm',
      '-c:v', 'libx264',
      '-preset', 'fast',
      '-crf', '23',
      '-c:a', 'aac',
      '-b:a', '128k',
      '-movflags', '+faststart',
      'output.mp4'
    ])

    const data = await ffmpeg.readFile('output.mp4')
    const outputBlob = new Blob([data], { type: 'video/mp4' })

    // 清理
    await ffmpeg.deleteFile('input.webm').catch(() => {})
    await ffmpeg.deleteFile('output.mp4').catch(() => {})

    onProgress?.(100)
    return outputBlob

  } catch (error) {
    console.error('[FFmpeg] Conversion error:', error)
    throw new Error(`Failed to convert video: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

