import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// AssemblyAI API 配置
const ASSEMBLYAI_API_KEY = process.env.ASSEMBLY_AI_API_KEY
const ASSEMBLYAI_API_URL = "https://api.assemblyai.com/v2"

/**
 * 提交视频到 AssemblyAI 进行转录
 */
async function submitToAssemblyAI(videoUrl: string): Promise<{ transcriptId: string }> {
  if (!ASSEMBLYAI_API_KEY) {
    throw new Error("ASSEMBLYAI_API_KEY environment variable not set")
  }

  const response = await fetch(`${ASSEMBLYAI_API_URL}/transcript`, {
    method: 'POST',
    headers: {
      'Authorization': ASSEMBLYAI_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      audio_url: videoUrl,
      language_detection: true,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`AssemblyAI submission failed: ${response.status} - ${errorText}`)
  }

  const data = await response.json()
  return { transcriptId: data.id }
}

/**
 * 轮询 AssemblyAI 获取转录结果
 */
async function pollAssemblyAIResult(transcriptId: string, maxWaitMs: number = 600000): Promise<{
  text: string
  language: string
  duration: number
  words: Array<{ start: number; end: number; text: string; confidence: number }>
}> {
  if (!ASSEMBLYAI_API_KEY) {
    throw new Error("ASSEMBLYAI_API_KEY environment variable not set")
  }

  const startTime = Date.now()
  const pollInterval = 3000 // 3 seconds

  while (Date.now() - startTime < maxWaitMs) {
    const response = await fetch(`${ASSEMBLYAI_API_URL}/transcript/${transcriptId}`, {
      headers: {
        'Authorization': ASSEMBLYAI_API_KEY,
      },
    })

    if (!response.ok) {
      throw new Error(`AssemblyAI polling failed: ${response.status}`)
    }

    const data = await response.json()
    
    if (data.status === 'completed') {
      return {
        text: data.text,
        language: data.language_code,
        duration: data.audio_duration,
        words: data.words || [],
      }
    } else if (data.status === 'error') {
      throw new Error(`AssemblyAI transcription failed: ${data.error}`)
    }

    // Wait before next poll
    console.log(`[Manual Transcription] AssemblyAI status: ${data.status}, waiting...`)
    await new Promise(resolve => setTimeout(resolve, pollInterval))
  }

  throw new Error('AssemblyAI transcription timeout')
}

export async function POST(request: NextRequest) {
  try {
    const { interviewId } = await request.json()

    if (!interviewId) {
      return NextResponse.json({ success: false, error: 'Missing interviewId parameter' }, { status: 400 })
    }

    console.log(`[Manual Transcription] Starting manual transcription for interview: ${interviewId}`)

    // 获取面试记录
    const interview = await prisma.interview.findUnique({
      where: { interview_id: interviewId }
    })

    if (!interview) {
      return NextResponse.json({ success: false, error: 'Interview not found' }, { status: 404 })
    }

    const videoUrl = interview.video_url
    if (!videoUrl) {
      return NextResponse.json({ success: false, error: 'No video URL found for this interview' }, { status: 400 })
    }

    console.log(`[Manual Transcription] Video URL: ${videoUrl}`)

    if (!ASSEMBLYAI_API_KEY) {
      return NextResponse.json({ success: false, error: 'AssemblyAI API key not configured' }, { status: 500 })
    }

    // 更新状态为处理中
    await prisma.interview.update({
      where: { id: interview.id },
      data: { transcription_status: 'processing' }
    })

    // 提交到 AssemblyAI（直接使用 URL，无需下载）
    console.log(`[Manual Transcription] Submitting to AssemblyAI...`)
    const startTime = Date.now()
    const { transcriptId } = await submitToAssemblyAI(videoUrl)
    console.log(`[Manual Transcription] ✓ Submitted, transcript ID: ${transcriptId}`)

    // 轮询获取结果
    console.log(`[Manual Transcription] Polling for results...`)
    const result = await pollAssemblyAIResult(transcriptId)
    const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2)
    console.log(`[Manual Transcription] ✓ Completed in ${elapsedTime} seconds`)

    // 将 words 转换为 segments
    const segments: Array<{ start: number; end: number; text: string; confidence?: number }> = []
    if (result.words && result.words.length > 0) {
      let currentSegment = {
        start: result.words[0].start / 1000,
        end: result.words[0].end / 1000,
        text: result.words[0].text,
        confidenceSum: result.words[0].confidence,
        wordCount: 1
      }
      
      for (let i = 1; i < result.words.length; i++) {
        const word = result.words[i]
        const wordStartSec = word.start / 1000
        const wordEndSec = word.end / 1000
        
        const gap = wordStartSec - currentSegment.end
        const endsWithPunctuation = /[.!?]$/.test(currentSegment.text)
        
        if (gap > 1.0 || endsWithPunctuation) {
          segments.push({
            start: currentSegment.start,
            end: currentSegment.end,
            text: currentSegment.text.trim(),
            confidence: currentSegment.confidenceSum / currentSegment.wordCount
          })
          currentSegment = {
            start: wordStartSec,
            end: wordEndSec,
            text: word.text,
            confidenceSum: word.confidence,
            wordCount: 1
          }
        } else {
          currentSegment.end = wordEndSec
          currentSegment.text += ' ' + word.text
          currentSegment.confidenceSum += word.confidence
          currentSegment.wordCount++
        }
      }
      
      segments.push({
        start: currentSegment.start,
        end: currentSegment.end,
        text: currentSegment.text.trim(),
        confidence: currentSegment.confidenceSum / currentSegment.wordCount
      })
    }
    
    // 准备元数据
    const metadata = {
      language: result.language,
      duration: result.duration,
      confidence: segments.length > 0 
        ? segments.reduce((acc, seg) => acc + (seg.confidence || 0), 0) / segments.length
        : undefined,
      segments: segments,
      createdAt: new Date().toISOString(),
      model: "assemblyai"
    }

    // 生成 AI 摘要
    let aiSummary = null
    try {
      const summaryResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/ai-summary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcription: result.text }),
      })
      const summaryData = await summaryResponse.json()
      if (summaryData.success) aiSummary = summaryData.summary
    } catch (error) {
      console.warn('[Manual Transcription] AI summary generation failed:', error)
    }

    // 更新面试记录
    const updateData: any = {
      transcription_status: 'completed',
      transcription_text: result.text,
      transcription_metadata: metadata as any
    }
    if (aiSummary) updateData.ai_summary = aiSummary

    await prisma.interview.update({
      where: { id: interview.id },
      data: updateData
    })

    console.log(`[Manual Transcription] ✓ Interview record updated`)

    return NextResponse.json({
      success: true,
      transcription: result.text,
      aiSummary: aiSummary,
      metadata: metadata
    })

  } catch (error) {
    console.error('[Manual Transcription] Error:', error)
    
    // 更新转录状态为失败
    try {
      const { interviewId } = await request.clone().json()
      if (interviewId) {
          await prisma.interview.update({
            where: { interview_id: interviewId },
            data: { 
              transcription_status: 'failed',
              transcription_metadata: {
                error: error instanceof Error ? error.message : 'Unknown error occurred',
                failedAt: new Date().toISOString()
              }
            }
          })
      }
    } catch (e) {}
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 })
  }
}
