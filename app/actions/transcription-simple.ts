"use server"

import { prisma } from "@/lib/prisma"
import { TranscriptionMetadata, TranscriptionStatus } from "./transcription"
import OpenAI from "openai"

// AssemblyAI API 配置
const ASSEMBLYAI_API_KEY = process.env.ASSEMBLY_AI_API_KEY
const ASSEMBLYAI_API_URL = "https://api.assemblyai.com/v2"

// OpenAI 用于生成 AI Summary
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

/**
 * 提交视频到 AssemblyAI 进行转录
 */
async function submitToAssemblyAI(videoUrl: string): Promise<{ transcriptId: string }> {
  if (!ASSEMBLYAI_API_KEY) {
    throw new Error("ASSEMBLY_AI_API_KEY environment variable not set")
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
    throw new Error("ASSEMBLY_AI_API_KEY environment variable not set")
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
    console.log(`[Transcription] AssemblyAI status: ${data.status}, waiting...`)
    await new Promise(resolve => setTimeout(resolve, pollInterval))
  }

  throw new Error('AssemblyAI transcription timeout')
}

/**
 * 生成 AI Summary（带重试逻辑）
 */
async function generateAISummary(transcriptionText: string, maxRetries: number = 3): Promise<string | null> {
  console.log("[AI Summary] Generating summary for transcription...")
  console.log("[AI Summary] Transcription length:", transcriptionText.length, "characters")
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[AI Summary] Attempt ${attempt}/${maxRetries}...`)
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are an expert at analyzing interview transcripts. Provide a concise, professional summary of the interview that highlights:
1. Main topics discussed
2. Key points and insights from the interviewee
3. Notable quotes or statements
4. Overall impression and communication style

Format the summary in clear sections with headers. Keep it professional and objective.`
          },
          {
            role: "user",
            content: `Please analyze and summarize this interview transcript:\n\n${transcriptionText}`
          }
        ],
        max_tokens: 1500,
        temperature: 0.7
      })

      const summary = response.choices[0]?.message?.content
      console.log("[AI Summary] ✓ Summary generated successfully")
      return summary || null
    } catch (error) {
      console.error(`[AI Summary] Attempt ${attempt} failed:`, error instanceof Error ? error.message : error)
      
      if (attempt < maxRetries) {
        // 等待后重试（指数退避）
        const waitTime = attempt * 2000
        console.log(`[AI Summary] Waiting ${waitTime/1000}s before retry...`)
        await new Promise(resolve => setTimeout(resolve, waitTime))
      }
    }
  }
  
  console.error("[AI Summary] All retries failed")
  return null
}

/**
 * 简单的转录函数 - 使用 AssemblyAI，直接处理，不创建任务表
 */
export async function transcribeVideo(
  interviewId: string,
  videoUrl: string
): Promise<{
  success: boolean
  transcription?: string
  metadata?: TranscriptionMetadata
  error?: string
}> {
  try {
    console.log("[Transcription] ========== START SIMPLE TRANSCRIPTION (AssemblyAI) ==========")
    
    // 检查 API Key
    if (!ASSEMBLYAI_API_KEY) {
      throw new Error("ASSEMBLY_AI_API_KEY environment variable not set")
    }
    
    // 1. 更新状态为处理中
    await prisma.interview.update({
      where: { interview_id: interviewId },
      data: { transcription_status: 'processing' }
    })
    
    // 2. 提交到 AssemblyAI（直接使用 URL，无需下载）
    console.log("[Transcription] Submitting to AssemblyAI...")
    const startTime = Date.now()
    const { transcriptId } = await submitToAssemblyAI(videoUrl)
    console.log("[Transcription] ✓ Submitted, transcript ID:", transcriptId)
    
    // 3. 轮询获取结果
    console.log("[Transcription] Polling for results...")
    const result = await pollAssemblyAIResult(transcriptId)
    console.log("[Transcription] ✓ AssemblyAI completed! Time:", ((Date.now() - startTime)/1000).toFixed(2), "seconds")
    
    // 4. 转换 words 为 segments 格式
    const segments = result.words.length > 0 ? [{
      start: result.words[0].start / 1000,
      end: result.words[result.words.length - 1].end / 1000,
      text: result.text,
      confidence: result.words.reduce((acc, w) => acc + w.confidence, 0) / result.words.length
    }] : []
    
    const metadata: TranscriptionMetadata = {
      model: "assemblyai",
      language: result.language,
      duration: result.duration,
      segments: segments,
      createdAt: new Date().toISOString()
    }
    
    // 5. 生成 AI Summary
    let aiSummary: string | null = null
    if (result.text && result.text.length > 50) {
      aiSummary = await generateAISummary(result.text)
    }
    
    // 6. 更新数据库
    const updateData: any = {
      transcription_status: 'completed',
      transcription_text: result.text,
      transcription_metadata: metadata as any
    }
    
    if (aiSummary) {
      updateData.ai_summary = aiSummary
    }
    
    await prisma.interview.update({
      where: { interview_id: interviewId },
      data: updateData
    })
    
    console.log("[Transcription] ========== TRANSCRIPTION COMPLETED SUCCESSFULLY ==========")
    
    return {
      success: true,
      transcription: result.text,
      metadata
    }
    
  } catch (error) {
    console.error("[Transcription] ========== TRANSCRIPTION FAILED ==========")
    console.error(error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    // 更新状态为失败，并保存错误信息
    try {
      await prisma.interview.update({
        where: { interview_id: interviewId },
        data: { 
          transcription_status: 'failed',
          transcription_metadata: {
            error: errorMessage,
            failedAt: new Date().toISOString()
          }
        }
      })
    } catch (e) {
      console.error("Failed to update status to failed:", e)
    }
    
    return {
      success: false,
      error: errorMessage
    }
  }
}

export async function getTranscriptionStatus(interviewId: string): Promise<{
  success: boolean
  status?: TranscriptionStatus
  transcription?: string
  aiSummary?: string
  metadata?: TranscriptionMetadata
  error?: string
}> {
  try {
    const interview = await prisma.interview.findUnique({
      where: { interview_id: interviewId },
      select: {
        transcription_status: true,
        transcription_text: true,
        ai_summary: true,
        transcription_metadata: true
      }
    })
    
    if (!interview) {
      return { success: false, error: 'Interview not found' }
    }
    
    return {
      success: true,
      status: interview.transcription_status as TranscriptionStatus,
      transcription: interview.transcription_text || undefined,
      aiSummary: interview.ai_summary || undefined,
      metadata: interview.transcription_metadata as unknown as TranscriptionMetadata
    }
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
