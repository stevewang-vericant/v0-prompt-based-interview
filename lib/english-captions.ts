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
    const segments: CaptionSegment[] = rawSegments
      .map((s) => ({
        start: typeof s.start === "number" ? s.start : 0,
        end: typeof s.end === "number" ? s.end : 0,
        text: typeof s.text === "string" ? s.text.trim() : "",
      }))
      .filter((s) => s.text.length > 0)

    const text: string =
      typeof result?.text === "string" && result.text.trim().length > 0
        ? result.text.trim()
        : segments.map((s) => s.text).join(" ")

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
