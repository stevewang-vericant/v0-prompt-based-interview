import OpenAI from "openai"
import { exec } from "child_process"
import { promisify } from "util"
import { createReadStream, existsSync, unlinkSync, statSync } from "fs"
import { join } from "path"
import { tmpdir } from "os"

const execAsync = promisify(exec)

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface CaptionSegment {
  start: number
  end: number
  text: string
}

export interface EnglishCaptions {
  language: string // caption language, always "en"
  sourceLanguage: string | null // detected spoken language, if available
  totalDuration: number
  segments: CaptionSegment[]
  text: string
}

// OpenAI audio endpoints cap uploads at 25 MB, so we always transcode to a
// compact mono MP3 first. A ~10 minute mono 64 kbps clip is well under the limit.
const MAX_AUDIO_BYTES = 24 * 1024 * 1024

// Detect CJK (Chinese/Japanese/Korean) characters. Whisper's translation
// endpoint occasionally returns the original-language transcript instead of an
// English translation (especially for short/ambiguous audio), so we detect that
// and force a real English translation via GPT.
const CJK_REGEX = /[\u3000-\u303f\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uac00-\ud7af\uf900-\ufaff\uff00-\uffef]/

function hasNonEnglishText(texts: string[]): boolean {
  return texts.some((t) => CJK_REGEX.test(t))
}

/**
 * Translate an array of caption strings into English in a single GPT call,
 * preserving order and length. Falls back to the originals on any failure.
 */
async function translateCaptionsToEnglish(texts: string[]): Promise<string[]> {
  if (texts.length === 0) return texts
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You translate interview speech captions into natural English. You will receive a JSON array of strings. " +
            "Return ONLY a JSON array of the same length, in the same order, where each element is the English translation " +
            "of the corresponding input. If an element is already English, return it unchanged. No explanations, no extra keys.",
        },
        { role: "user", content: JSON.stringify(texts) },
      ],
      temperature: 0.2,
      response_format: { type: "json_object" },
    })

    const raw = response.choices[0]?.message?.content?.trim()
    if (!raw) return texts
    const parsed = JSON.parse(raw)
    // Accept either a bare array or an object wrapping an array.
    const arr: unknown = Array.isArray(parsed)
      ? parsed
      : parsed && typeof parsed === "object"
        ? (Object.values(parsed).find((v) => Array.isArray(v)) as unknown)
        : null
    if (Array.isArray(arr) && arr.length === texts.length) {
      return arr.map((v, i) => (typeof v === "string" && v.trim().length > 0 ? v.trim() : texts[i]))
    }
    return texts
  } catch (error) {
    console.error("[Captions] English translation fallback failed:", error instanceof Error ? error.message : error)
    return texts
  }
}

/**
 * Generate English captions for a video by extracting its audio and running it
 * through OpenAI Whisper's *translation* endpoint, which always outputs English
 * regardless of the spoken language. Returns null on failure so callers can
 * treat captions as best-effort.
 *
 * @param videoFilePath absolute path to a local video file (mp4/webm).
 */
export async function generateEnglishCaptionsFromFile(videoFilePath: string): Promise<EnglishCaptions | null> {
  if (!process.env.OPENAI_API_KEY) {
    console.error("[Captions] OPENAI_API_KEY not set; skipping English caption generation")
    return null
  }
  if (!existsSync(videoFilePath)) {
    console.error("[Captions] Video file not found:", videoFilePath)
    return null
  }

  const audioPath = join(tmpdir(), `captions_audio_${Date.now()}.mp3`)
  try {
    // Extract a small mono MP3 (16 kHz, 64 kbps) suitable for speech.
    const cmd = `ffmpeg -loglevel error -i "${videoFilePath}" -vn -ac 1 -ar 16000 -b:a 64k "${audioPath}" -y`
    await execAsync(cmd, { maxBuffer: 100 * 1024 * 1024 })

    if (!existsSync(audioPath)) {
      throw new Error("ffmpeg failed to produce audio file for captions")
    }
    const size = statSync(audioPath).size
    if (size > MAX_AUDIO_BYTES) {
      console.warn(`[Captions] Extracted audio is ${size} bytes (> 25MB limit); captions skipped`)
      return null
    }

    // Whisper translations always return English text.
    const result: any = await openai.audio.translations.create({
      file: createReadStream(audioPath) as any,
      model: "whisper-1",
      response_format: "verbose_json",
    })

    const rawSegments: any[] = Array.isArray(result?.segments) ? result.segments : []
    let segments: CaptionSegment[] = rawSegments
      .map((s) => ({
        start: typeof s.start === "number" ? s.start : 0,
        end: typeof s.end === "number" ? s.end : 0,
        text: typeof s.text === "string" ? s.text.trim() : "",
      }))
      .filter((s) => s.text.length > 0)

    let text: string =
      typeof result?.text === "string" && result.text.trim().length > 0
        ? result.text.trim()
        : segments.map((s) => s.text).join(" ")

    // Whisper's translation endpoint sometimes returns non-English text; force a
    // real English translation so US-based school reviewers always get English.
    if (hasNonEnglishText([text, ...segments.map((s) => s.text)])) {
      console.warn("[Captions] Whisper returned non-English text; applying GPT English translation fallback")
      const translatedSegments = await translateCaptionsToEnglish(segments.map((s) => s.text))
      segments = segments.map((s, i) => ({ ...s, text: translatedSegments[i] ?? s.text }))
      if (hasNonEnglishText([text])) {
        const [translatedFull] = await translateCaptionsToEnglish([text])
        text = translatedFull ?? segments.map((s) => s.text).join(" ")
      }
    }

    return {
      language: "en",
      sourceLanguage: typeof result?.language === "string" ? result.language : null,
      totalDuration:
        segments.length > 0 ? segments[segments.length - 1].end : typeof result?.duration === "number" ? result.duration : 0,
      segments,
      text,
    }
  } catch (error) {
    console.error("[Captions] Failed to generate English captions:", error instanceof Error ? error.message : error)
    return null
  } finally {
    try {
      if (existsSync(audioPath)) unlinkSync(audioPath)
    } catch {
      // ignore cleanup errors
    }
  }
}
