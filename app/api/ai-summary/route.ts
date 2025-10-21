import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { transcription } = await request.json()
    
    if (!transcription) {
      return NextResponse.json({ 
        success: false, 
        error: 'Transcription text is required' 
      })
    }

    console.log('[AI Summary] Generating summary for transcription...')
    console.log('[AI Summary] Transcription length:', transcription.length, 'characters')

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
5. Use bullet points or short paragraphs for better readability
6. Keep the summary between 100-200 words

Format the summary in a way that would be useful for admissions officers or hiring managers.`
        },
        {
          role: "user",
          content: `Please provide a summary of this video interview transcript:\n\n${transcription}`
        }
      ],
      max_tokens: 300,
      temperature: 0.3,
    })

    const summary = completion.choices[0]?.message?.content?.trim()
    
    if (!summary) {
      throw new Error('Failed to generate summary')
    }

    console.log('[AI Summary] ✓ Summary generated successfully')
    console.log('[AI Summary] Summary length:', summary.length, 'characters')

    return NextResponse.json({
      success: true,
      summary
    })

  } catch (error) {
    console.error('[AI Summary] ❌ Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate summary'
    })
  }
}
