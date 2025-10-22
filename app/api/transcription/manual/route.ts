import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import OpenAI from 'openai'

// 初始化 OpenAI 客户端
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { interviewId } = await request.json()

    if (!interviewId) {
      return NextResponse.json({
        success: false,
        error: 'Missing interviewId parameter'
      }, { status: 400 })
    }

    console.log(`[Manual Transcription] Starting manual transcription for interview: ${interviewId}`)

    const supabase = createAdminClient()

    // 获取面试记录
    const { data: interview, error: interviewError } = await supabase
      .from('interviews')
      .select('id, video_url, interview_id')
      .eq('interview_id', interviewId)
      .single()

    if (interviewError || !interview) {
      console.error('[Manual Transcription] Interview not found:', interviewError)
      return NextResponse.json({
        success: false,
        error: 'Interview not found'
      }, { status: 404 })
    }

    const videoUrl = interview.video_url
    if (!videoUrl) {
      return NextResponse.json({
        success: false,
        error: 'No video URL found for this interview'
      }, { status: 400 })
    }

    console.log(`[Manual Transcription] Video URL: ${videoUrl}`)

    // 检查 OpenAI API Key
    if (!process.env.OPENAI_API_KEY) {
      console.error('[Manual Transcription] OPENAI_API_KEY not configured')
      return NextResponse.json({
        success: false,
        error: 'OpenAI API key not configured'
      }, { status: 500 })
    }

    // 从 B2 下载视频
    console.log('[Manual Transcription] Downloading video from B2...')
    const videoResponse = await fetch(videoUrl)
    
    if (!videoResponse.ok) {
      console.error('[Manual Transcription] Failed to download video:', videoResponse.status)
      return NextResponse.json({
        success: false,
        error: `Failed to download video: ${videoResponse.statusText}`
      }, { status: 500 })
    }

    const videoBuffer = await videoResponse.arrayBuffer()
    const videoBlob = new Blob([videoBuffer], { type: 'video/mp4' })
    
    console.log(`[Manual Transcription] Video downloaded, size: ${videoBlob.size} bytes`)

    // 调用 OpenAI Whisper API
    console.log('[Manual Transcription] Calling OpenAI Whisper API...')
    const startTime = Date.now()
    
    const transcription = await openai.audio.transcriptions.create({
      file: new File([videoBlob], "interview.mp4", { type: "video/mp4" }),
      model: "whisper-1",
      response_format: "verbose_json",
      timestamp_granularities: ["segment"]
    })
    
    const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2)
    console.log(`[Manual Transcription] Whisper API completed in ${elapsedTime}s`)

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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transcription: transcription.text }),
      })
      
      const summaryData = await summaryResponse.json()
      
      if (summaryData.success) {
        aiSummary = summaryData.summary
        console.log('[Manual Transcription] AI summary generated')
      } else {
        console.warn('[Manual Transcription] AI summary generation failed:', summaryData.error)
      }
    } catch (error) {
      console.warn('[Manual Transcription] AI summary generation failed:', error)
    }

    // 更新面试记录
    console.log('[Manual Transcription] Updating interview record...')
    const updateData: any = {
      transcription_status: 'completed',
      transcription_text: transcription.text,
      transcription_metadata: metadata
    }
    
    if (aiSummary) {
      updateData.ai_summary = aiSummary
    }

    const { error: updateError } = await supabase
      .from('interviews')
      .update(updateData)
      .eq('id', interview.id)

    if (updateError) {
      console.error('[Manual Transcription] Failed to update interview:', updateError)
      return NextResponse.json({
        success: false,
        error: 'Failed to save transcription to database'
      }, { status: 500 })
    }

    console.log('[Manual Transcription] ✓ Transcription completed successfully')

    return NextResponse.json({
      success: true,
      transcription: transcription.text,
      aiSummary: aiSummary,
      metadata: metadata
    })

  } catch (error) {
    console.error('[Manual Transcription] Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 })
  }
}
