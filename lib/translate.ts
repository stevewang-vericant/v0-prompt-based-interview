import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

/**
 * Translate a short piece of English text (an interview question) into the
 * target language. Returns the original text if the target is English or if the
 * translation fails, so callers can always render something.
 */
export async function translateText(text: string, targetLanguage: string): Promise<string> {
  const trimmed = (text || "").trim()
  if (!trimmed) return text
  if (!targetLanguage || targetLanguage.toLowerCase() === "english") return trimmed

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            `You are a professional translator. Translate the user's text into ${targetLanguage}. ` +
            `Return ONLY the translated text with no quotes, no explanations, and no extra formatting. ` +
            `Preserve the meaning and a natural, polite tone suitable for a school interview question.`,
        },
        { role: "user", content: trimmed },
      ],
      temperature: 0.2,
      max_tokens: 500,
    })

    const translated = response.choices[0]?.message?.content?.trim()
    return translated && translated.length > 0 ? translated : trimmed
  } catch (error) {
    console.error("[Translate] Failed to translate text:", error instanceof Error ? error.message : error)
    return trimmed
  }
}

/**
 * Translate several strings in parallel. Falls back to the original string for
 * any item that fails.
 */
export async function translateMany(texts: string[], targetLanguage: string): Promise<string[]> {
  if (!targetLanguage || targetLanguage.toLowerCase() === "english") return texts
  return Promise.all(texts.map((t) => translateText(t, targetLanguage)))
}
