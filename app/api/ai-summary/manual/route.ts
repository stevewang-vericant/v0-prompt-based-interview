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

    console.log(`[Manual AI Summary] Starting manual summary generation for interview: ${interviewId}`)

    const supabase = createAdminClient()

    // 获取面试记录
    const { data: interview, error: interviewError } = await supabase
      .from('interviews')
      .select('id, transcription_text, interview_id')
      .eq('interview_id', interviewId)
      .single()

    if (interviewError || !interview) {
      console.error('[Manual AI Summary] Interview not found:', interviewError)
      return NextResponse.json({
        success: false,
        error: 'Interview not found'
      }, { status: 404 })
    }

    const transcriptionText = interview.transcription_text
    if (!transcriptionText) {
      return NextResponse.json({
        success: false,
        error: 'No transcription text found for this interview. Please complete transcription first.'
      }, { status: 400 })
    }

    console.log(`[Manual AI Summary] Transcription text length: ${transcriptionText.length} characters`)

    // 检查 OpenAI API Key
    if (!process.env.OPENAI_API_KEY) {
      console.error('[Manual AI Summary] OPENAI_API_KEY not configured')
      return NextResponse.json({
        success: false,
        error: 'OpenAI API key not configured'
      }, { status: 500 })
    }

    // 调用 OpenAI GPT API 生成摘要
    console.log('[Manual AI Summary] Calling OpenAI GPT API...')
    const startTime = Date.now()
    
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are an AI assistant that creates concise, professional summaries of video interview transcripts.

Your task is to:
1. Summarize the key points discussed in the interview
2. Highlight the candidate's main responses and insights
3. Keep the summary clear, structured, and professional
4. Focus on the most important content and avoid repetition
5. Write exactly 4-5 sentences only
6. Keep the summary between 50-100 words

Format the summary in a way that would be useful for admissions officers or hiring managers.`
        },
        {
          role: "user",
          content: `Please provide a summary of this video interview transcript:\n\n${transcriptionText}`
        }
      ],
      max_tokens: 300,
      temperature: 0.3,
    })
    
    const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2)
    console.log(`[Manual AI Summary] GPT API completed in ${elapsedTime}s`)

    const summary = completion.choices[0]?.message?.content?.trim()
    
    if (!summary) {
      throw new Error('Failed to generate summary')
    }

    console.log(`[Manual AI Summary] Summary generated, length: ${summary.length} characters`)

    // 更新面试记录
    console.log('[Manual AI Summary] Updating interview record...')
    const { error: updateError } = await supabase
      .from('interviews')
      .update({
        ai_summary: summary
      })
      .eq('id', interview.id)

    if (updateError) {
      console.error('[Manual AI Summary] Failed to update interview:', updateError)
      return NextResponse.json({
        success: false,
        error: 'Failed to save summary to database'
      }, { status: 500 })
    }

    console.log('[Manual AI Summary] ✓ Summary generated and saved successfully')

    return NextResponse.json({
      success: true,
      summary: summary
    })

  } catch (error) {
    console.error('[Manual AI Summary] Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 })
  }
}
