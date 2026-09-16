import OpenAI from "openai"

/**
 * Shared AI summary generation used by API routes and transcription workers.
 * Call this directly from server code — do not HTTP self-call `/api/ai-summary`.
 */
export async function generateInterviewAiSummary(
  transcription: string
): Promise<{ success: true; summary: string } | { success: false; error: string }> {
  if (!transcription?.trim()) {
    return { success: false, error: "Transcription text is required" }
  }

  if (!process.env.OPENAI_API_KEY) {
    return { success: false, error: "OPENAI_API_KEY is not configured" }
  }

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })

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

Format the summary in a way that would be useful for admissions officers or hiring managers.`,
      },
      {
        role: "user",
        content: `Please provide a summary of this video interview transcript:\n\n${transcription}`,
      },
    ],
    max_tokens: 300,
    temperature: 0.3,
  })

  const summary = completion.choices[0]?.message?.content?.trim()
  if (!summary) {
    return { success: false, error: "Failed to generate summary" }
  }

  return { success: true, summary }
}
