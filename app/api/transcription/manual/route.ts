import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

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

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ success: false, error: 'OpenAI API key not configured' }, { status: 500 })
    }

    // 从 B2 下载视频
    const videoResponse = await fetch(videoUrl)
    if (!videoResponse.ok) {
      return NextResponse.json({
        success: false,
        error: `Failed to download video: ${videoResponse.statusText}`
      }, { status: 500 })
    }

    const videoBuffer = await videoResponse.arrayBuffer()
    const videoBlob = new Blob([videoBuffer], { type: 'video/mp4' })
    
    // 调用 OpenAI Whisper API
    const transcription = await openai.audio.transcriptions.create({
      file: new File([videoBlob], "interview.mp4", { type: "video/mp4" }),
      model: "whisper-1",
      response_format: "verbose_json",
      timestamp_granularities: ["segment"]
    })
    
    // 准备元数据
    const segments = transcription.segments || []
    const metadata = {
      language: transcription.language,
      duration: transcription.duration,
      confidence: segments.length > 0 
        ? segments.reduce((acc, seg) => acc + (seg.avg_logprob || 0), 0) / segments.length
        : undefined,
      segments: segments.map(seg => ({
        start: seg.start,
        end: seg.end,
        text: seg.text,
        confidence: seg.avg_logprob
      })),
      createdAt: new Date().toISOString(),
      model: "whisper-1"
    }

    // 生成 AI 摘要
    let aiSummary = null
    try {
      const summaryResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/ai-summary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcription: transcription.text }),
      })
      const summaryData = await summaryResponse.json()
      if (summaryData.success) aiSummary = summaryData.summary
    } catch (error) {
      console.warn('[Manual Transcription] AI summary generation failed:', error)
    }

    // 更新面试记录
    const updateData: any = {
      transcription_status: 'completed',
      transcription_text: transcription.text,
      transcription_metadata: metadata as any
    }
    if (aiSummary) updateData.ai_summary = aiSummary

    await prisma.interview.update({
      where: { id: interview.id },
      data: updateData
    })

    return NextResponse.json({
      success: true,
      transcription: transcription.text,
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
