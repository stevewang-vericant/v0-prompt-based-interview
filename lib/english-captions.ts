import OpenAI from "openai"
import { VERICANT_ACCEPTING_INSTITUTIONS } from "@/lib/vericant-accepting-institutions"

function getOpenAI() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })
}

const ASSEMBLYAI_API_KEY = process.env.ASSEMBLY_AI_API_KEY
const ASSEMBLYAI_API_URL = "https://api.assemblyai.com/v2"

export interface CaptionSegment {
  start: number
  end: number
  text: string
}

export interface CaptionKeywords {
  schoolName?: string | null
  studentName?: string | null
  schoolNames?: string[] | null
}

export interface EnglishCaptions {
  language: string // caption language, always "en" after translation
  sourceLanguage: string | null
  totalDuration: number
  segments: CaptionSegment[]
  text: string
  sourceText: string
  srt: string
  keywords: string[]
  wordBoost: string[]
}

const CJK_REGEX = /[\u3000-\u303f\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uac00-\ud7af\uf900-\ufaff\uff00-\uffef]/

function hasNonEnglishText(texts: string[]): boolean {
  return texts.some((t) => CJK_REGEX.test(t))
}

const WORD_BOOST_MAX_CHARS = 2000
function loadAcceptingInstitutionNames(): string[] {
  const names: string[] = []
  const seen = new Set<string>()
  for (const name of VERICANT_ACCEPTING_INSTITUTIONS) {
    addUniqueTerm(names, seen, name)
  }
  return names
}

function addUniqueTerm(terms: string[], seen: Set<string>, value?: string | null) {
  const trimmed = (value || "").trim()
  if (!trimmed) return
  const key = trimmed.toLowerCase()
  if (seen.has(key)) return
  seen.add(key)
  terms.push(trimmed)
}

function schoolNameVariants(name: string): string[] {
  const variants: string[] = []
  const seen = new Set<string>()
  const add = (value?: string | null) => addUniqueTerm(variants, seen, value)
  add(name)
  const withoutThe = name.replace(/^The\s+/i, "").trim()
  add(withoutThe)
  return variants
}

export function buildTranscriptKeywords(input?: {
  schoolName?: string | null
  studentName?: string | null
  schoolNames?: string[] | null
} | null): { glossary: string[]; wordBoost: string[] } {
  const glossary: string[] = []
  const seen = new Set<string>()
  addUniqueTerm(glossary, seen, input?.studentName)
  addUniqueTerm(glossary, seen, input?.schoolName)
  for (const name of input?.schoolNames || []) {
    addUniqueTerm(glossary, seen, name)
  }

  const wordBoost: string[] = []
  let used = 0
  const boostSeen = new Set<string>()
  const boostAdd = (value?: string | null) => {
    const trimmed = (value || "").trim()
    if (!trimmed) return
    const key = trimmed.toLowerCase()
    if (boostSeen.has(key)) return
    const cost = trimmed.length + (wordBoost.length > 0 ? 1 : 0)
    if (used + cost > WORD_BOOST_MAX_CHARS) return
    boostSeen.add(key)
    wordBoost.push(trimmed)
    used += cost
  }

  // Keep the current student and school first so they are never dropped by the AAI cap.
  for (const variant of schoolNameVariants(input?.schoolName || "")) boostAdd(variant)
  boostAdd(input?.studentName)
  for (const name of input?.schoolNames || []) {
    for (const variant of schoolNameVariants(name)) boostAdd(variant)
  }

  return { glossary, wordBoost }
}

function parseSrtTimestamp(value: string): number {
  const match = value.trim().match(/^(\d+):(\d+):(\d+)[,.](\d+)$/)
  if (!match) return 0
  const [, hours, minutes, seconds, fraction] = match
  const millis = fraction.padEnd(3, "0").slice(0, 3)
  return (
    Number(hours) * 3600 +
    Number(minutes) * 60 +
    Number(seconds) +
    Number(millis) / 1000
  )
}

export function parseSrt(srt: string): CaptionSegment[] {
  const blocks = (srt || "").replace(/\r\n/g, "\n").trim().split(/\n\s*\n/)
  const segments: CaptionSegment[] = []

  for (const block of blocks) {
    const lines = block.split("\n").map((line) => line.trim()).filter(Boolean)
    const timeIndex = lines.findIndex((line) => line.includes("-->"))
    if (timeIndex < 0) continue
    const [startRaw, endRaw] = lines[timeIndex].split(/\s+-->\s+/)
    const text = compactCaptionText(lines.slice(timeIndex + 1).join(" "))
    if (!text) continue
    const start = parseSrtTimestamp(startRaw)
    const end = parseSrtTimestamp(endRaw)
    if (end <= start) continue
    segments.push({ start, end, text })
  }

  return segments
}

function compactCaptionText(text: string): string {
  return text
    .replace(/\s+/g, " ")
    .replace(/([\u3400-\u9fff])\s+(?=[\u3400-\u9fff])/g, "$1")
    .trim()
}

function srtTimestamp(seconds: number): string {
  const clamped = Math.max(0, seconds)
  const hours = Math.floor(clamped / 3600)
  const minutes = Math.floor((clamped % 3600) / 60)
  const secs = Math.floor(clamped % 60)
  const millis = Math.round((clamped - Math.floor(clamped)) * 1000)
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")},${String(millis).padStart(3, "0")}`
}

export function captionsToSrt(segments: CaptionSegment[]): string {
  return segments
    .filter((segment) => segment.text.trim())
    .map((segment, index) => {
      return `${index + 1}\n${srtTimestamp(segment.start)} --> ${srtTimestamp(segment.end)}\n${segment.text.trim()}`
    })
    .join("\n\n")
}

export function captionsToWebVtt(segments: CaptionSegment[]): string {
  const format = (seconds: number) => srtTimestamp(seconds).replace(",", ".")
  const body = segments
    .filter((segment) => segment.text.trim())
    .map((segment, index) => {
      return `${index + 1}\n${format(segment.start)} --> ${format(segment.end)}\n${segment.text.trim()}`
    })
    .join("\n\n")
  return `WEBVTT\n\n${body}\n`
}

const GRADE_GLOSSARY =
  "Grade terms: 初二 = 8th grade, 初三 = 9th grade, 八升九/八生九 = moving from 8th to 9th grade. Never translate 八升九, 八生九, or similar as an age in years."

function glossaryPrompt(keywords: string[]): string {
  const chineseNames = keywords.filter((k) => CJK_REGEX.test(k))
  const englishNames = keywords.filter((k) => !CJK_REGEX.test(k))
  const parts: string[] = [
    "The audience is English-speaking school staff. The English output must contain NO Chinese characters.",
    "Chinese personal names must be written in Hanyu Pinyin, spaced by syllable, with each part capitalized (example: 范小佳 → Fan Xiaojia). Do not translate a Chinese given name as English words.",
    GRADE_GLOSSARY,
  ]
  if (chineseNames.length > 0) {
    parts.push(
      `Student/personal names: ${chineseNames.join("; ")}. ` +
        "If ASR wrote a nearby fragment (for example 小家 instead of 小佳), still use the Pinyin of the provided name, not a literal translation.",
    )
  }
  if (englishNames.length > 0) {
    parts.push(
      "If the source looks like a mis-hearing of a school, choose the closest canonical English name from this list. Do not invent a literal translation such as a job or medicine name when a listed school is a better match:\n" +
        englishNames.map((k) => `- ${k}`).join("\n"),
    )
  }
  return parts.join(" ") + "\n"
}

async function translateCaptionChunk(
  texts: string[],
  keywords: string[],
): Promise<string[] | null> {
  if (texts.length === 0) return []
  try {
    const openai = getOpenAI()
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You translate parent-interview subtitle cues into English. " +
            "You will receive JSON {\"captions\":[...],\"count\":N}. " +
            "Each item is one timed spoken cue. Keep the same number of cues, same order. " +
            "Return ONLY {\"translations\":[...]} with exactly N English strings. " +
            "Translate only that cue. Do not merge cues, split cues, or move content across cues. " +
            "Keep first-person voice. Do not invent content. " +
            glossaryPrompt(keywords),
        },
        { role: "user", content: JSON.stringify({ count: texts.length, captions: texts }) },
      ],
      temperature: 0.2,
      response_format: { type: "json_object" },
    })

    const raw = response.choices[0]?.message?.content?.trim()
    if (!raw) return null
    const parsed = JSON.parse(raw)
    const arr: unknown = Array.isArray(parsed)
      ? parsed
      : parsed && typeof parsed === "object"
        ? (parsed as { translations?: unknown }).translations ??
          (Object.values(parsed).find((v) => Array.isArray(v)) as unknown)
        : null
    if (!Array.isArray(arr) || arr.length !== texts.length) {
      console.warn(
        "[Captions] Translation array mismatch; expected",
        texts.length,
        "got",
        Array.isArray(arr) ? arr.length : typeof arr,
      )
      return null
    }
    return arr.map((v, i) => (typeof v === "string" && v.trim().length > 0 ? v.trim() : texts[i]))
  } catch (error) {
    console.error("[Captions] Caption chunk translation failed:", error instanceof Error ? error.message : error)
    return null
  }
}

async function translateCaptionsToEnglish(
  texts: string[],
  keywords: string[],
): Promise<string[]> {
  if (texts.length === 0) return texts
  const out = texts.slice()
  const chunkSize = 8

  for (let i = 0; i < texts.length; i += chunkSize) {
    const slice = texts.slice(i, i + chunkSize)
    let translated = await translateCaptionChunk(slice, keywords)
    if (!translated) {
      translated = []
      for (const item of slice) {
        const one = await translateCaptionChunk([item], keywords)
        if (one?.[0]) {
          translated.push(one[0])
        } else {
          const full = await translateFullTextToEnglish(item, keywords)
          translated.push(full || item)
        }
      }
    }
    for (let j = 0; j < slice.length; j++) {
      out[i + j] = translated[j] ?? slice[j]
    }
  }

  for (let i = 0; i < out.length; i++) {
    if (!hasNonEnglishText([out[i]])) continue
    const retry = await translateFullTextToEnglish(out[i], keywords)
    if (retry && !hasNonEnglishText([retry])) {
      out[i] = retry
    }
  }

  return out
}

async function polishCaptionChunk(
  texts: string[],
  keywords: string[],
): Promise<string[] | null> {
  if (texts.length === 0) return []
  try {
    const openai = getOpenAI()
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You correct English parent-interview subtitle cues. " +
            "You will receive JSON {\"captions\":[...],\"count\":N}. " +
            "Return ONLY {\"captions\":[...]} with exactly N strings, same order. " +
            "Do not merge, split, or reorder cues. Keep the same timing structure by leaving one string per cue. " +
            "Fix school names, student names, and grade terms using the glossary. " +
            "Grade terms: 初二 = 8th grade, 初三 = 9th grade, 八升九/八生九 = moving from 8th to 9th grade. Never treat those as an age in years. " +
            "Only change a school name when the cue is clearly that school. Do not replace an unknown school with Vericant. " +
            "Do not invent content. Keep first-person voice. " +
            glossaryPrompt(keywords),
        },
        { role: "user", content: JSON.stringify({ count: texts.length, captions: texts }) },
      ],
      temperature: 0.1,
      response_format: { type: "json_object" },
    })
    const raw = response.choices[0]?.message?.content?.trim()
    if (!raw) return null
    const parsed = JSON.parse(raw)
    const arr: unknown = Array.isArray(parsed)
      ? parsed
      : parsed && typeof parsed === "object"
        ? (parsed as { captions?: unknown }).captions ??
          (parsed as { translations?: unknown }).translations ??
          (Object.values(parsed).find((v) => Array.isArray(v)) as unknown)
        : null
    if (!Array.isArray(arr) || arr.length !== texts.length) {
      console.warn(
        "[Captions] Glossary polish array mismatch; expected",
        texts.length,
        "got",
        Array.isArray(arr) ? arr.length : typeof arr,
      )
      return null
    }
    return arr.map((v, i) => (typeof v === "string" && v.trim().length > 0 ? v.trim() : texts[i]))
  } catch (error) {
    console.error("[Captions] Glossary polish failed:", error instanceof Error ? error.message : error)
    return null
  }
}

async function polishCaptionsWithKeywords(
  texts: string[],
  keywords: string[],
): Promise<string[]> {
  if (texts.length === 0) return texts
  const out = texts.slice()
  const chunkSize = 8
  for (let i = 0; i < texts.length; i += chunkSize) {
    const slice = texts.slice(i, i + chunkSize)
    const polished = await polishCaptionChunk(slice, keywords)
    if (!polished) continue
    for (let j = 0; j < slice.length; j++) {
      out[i + j] = polished[j] ?? slice[j]
    }
  }
  return out
}

function mergeCaptionsIntoTranscript(segments: CaptionSegment[]): string {
  if (segments.length === 0) return ""
  let out = segments[0].text.trim()
  for (let i = 1; i < segments.length; i++) {
    const prev = segments[i - 1]
    const gap = segments[i].start - prev.end
    const piece = segments[i].text.trim()
    if (!piece) continue
    out += gap > 1.5 ? "\n\n" : " "
    out += piece
  }
  return out.replace(/[ \t]+/g, " ").replace(/ *\n\n */g, "\n\n").trim()
}

function captionsFromAssemblyAISentences(raw: unknown): CaptionSegment[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((item) => {
      const row = item as { text?: unknown; start?: unknown; end?: unknown }
      const text = typeof row.text === "string" ? row.text.trim() : ""
      const start = typeof row.start === "number" ? row.start / 1000 : 0
      const end = typeof row.end === "number" ? row.end / 1000 : 0
      return { start, end, text }
    })
    .filter((segment) => segment.text && segment.end > segment.start)
}

function captionsFromAssemblyAIWords(
  words: Array<{ start: number; end: number; text: string }>,
): CaptionSegment[] {
  if (words.length === 0) return []
  const segments: CaptionSegment[] = []
  let current: CaptionSegment | null = null
  const joinWord = (left: string, right: string) => {
    if (!left) return right
    if (!right) return left
    if (CJK_REGEX.test(left.slice(-1)) || CJK_REGEX.test(right[0])) return `${left}${right}`
    return `${left} ${right}`
  }

  const flush = () => {
    if (current?.text.trim()) segments.push({ ...current, text: current.text.trim() })
    current = null
  }

  for (const word of words) {
    if (!current) {
      current = { start: word.start, end: word.end, text: word.text }
      continue
    }
    const gap = word.start - current.end
    const endsSentence = /[。！？.!?]$/.test(current.text.trim())
    if (endsSentence || gap > 0.65) {
      flush()
      current = { start: word.start, end: word.end, text: word.text }
    } else {
      current.end = word.end
      current.text = joinWord(current.text, word.text)
    }
  }
  flush()
  return segments
}

function captionsLookLikeSpokenCues(
  segments: CaptionSegment[],
  duration: number,
): boolean {
  if (segments.length === 0) return false
  if (duration > 90 && segments.length < 8) return false
  const longCount = segments.filter((segment) => segment.end - segment.start > 12).length
  return longCount / segments.length <= 0.25
}

async function timedSourceCaptionsFromAssemblyAI(
  transcriptId: string,
  result: {
    duration: number
    words: Array<{ start: number; end: number; text: string }>
  },
): Promise<CaptionSegment[]> {
  const fromWords = captionsFromAssemblyAIWords(result.words)
  if (captionsLookLikeSpokenCues(fromWords, result.duration)) {
    console.log(`[Captions] Using AssemblyAI word-timed phrases: ${fromWords.length}`)
    return fromWords
  }

  try {
    const fromSrt = parseSrt(await fetchAssemblyAISubtitles(transcriptId))
    if (captionsLookLikeSpokenCues(fromSrt, result.duration)) {
      console.log(`[Captions] Using AssemblyAI SRT cues: ${fromSrt.length}`)
      return fromSrt
    }
  } catch (error) {
    console.warn("[Captions] AssemblyAI SRT fallback failed:", error instanceof Error ? error.message : error)
  }

  const fromSentences = await fetchAssemblyAISentences(transcriptId)
  if (captionsLookLikeSpokenCues(fromSentences, result.duration)) {
    console.log(`[Captions] Using AssemblyAI sentences: ${fromSentences.length}`)
    return fromSentences
  }

  const fallback = fromWords.length > 0 ? fromWords : fromSentences
  console.warn(`[Captions] Falling back to ${fallback.length} coarse timed cues`)
  return fallback
}

async function fetchAssemblyAISentences(transcriptId: string): Promise<CaptionSegment[]> {
  if (!ASSEMBLYAI_API_KEY) {
    throw new Error("ASSEMBLY_AI_API_KEY environment variable not set")
  }
  const response = await fetch(`${ASSEMBLYAI_API_URL}/transcript/${transcriptId}/sentences`, {
    headers: { Authorization: ASSEMBLYAI_API_KEY },
  })
  if (!response.ok) {
    console.warn(`[Captions] AssemblyAI sentences endpoint failed: ${response.status}`)
    return []
  }
  const data = await response.json()
  return captionsFromAssemblyAISentences(data.sentences)
}

async function translateFullTextToEnglish(text: string, keywords: string[]): Promise<string | null> {
  const trimmed = (text || "").trim()
  if (!trimmed) return null
  try {
    const openai = getOpenAI()
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You translate a parent-interview transcript into natural English for school reviewers. " +
            "Return ONLY the English translation. Keep first-person voice. Do not invent content. " +
            "Use complete sentences with standard punctuation. Never run two sentences together without a period. " +
            "Group related sentences into short paragraphs separated by a blank line. " +
            glossaryPrompt(keywords),
        },
        { role: "user", content: trimmed },
      ],
      temperature: 0.2,
    })
    const translated = response.choices[0]?.message?.content?.trim()
    return translated && translated.length > 0 ? translated : null
  } catch (error) {
    console.error("[Captions] Full-text translation failed:", error instanceof Error ? error.message : error)
    return null
  }
}

async function submitToAssemblyAI(
  videoUrl: string,
  keywords: string[],
): Promise<{ transcriptId: string }> {
  if (!ASSEMBLYAI_API_KEY) {
    throw new Error("ASSEMBLY_AI_API_KEY environment variable not set")
  }

  const payload: Record<string, unknown> = {
    audio_url: videoUrl,
    language_detection: true,
  }
  if (keywords.length > 0) {
    payload.word_boost = keywords
    payload.boost_param = "high"
  }

  const response = await fetch(`${ASSEMBLYAI_API_URL}/transcript`, {
    method: "POST",
    headers: {
      Authorization: ASSEMBLYAI_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`AssemblyAI submission failed: ${response.status} - ${errorText}`)
  }

  const data = await response.json()
  return { transcriptId: data.id }
}

async function fetchAssemblyAISubtitles(transcriptId: string): Promise<string> {
  if (!ASSEMBLYAI_API_KEY) {
    throw new Error("ASSEMBLY_AI_API_KEY environment variable not set")
  }

  const response = await fetch(`${ASSEMBLYAI_API_URL}/transcript/${transcriptId}/srt`, {
    headers: { Authorization: ASSEMBLYAI_API_KEY },
  })
  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`AssemblyAI subtitle export failed: ${response.status} - ${errorText}`)
  }

  const srt = (await response.text()).trim()
  if (!srt) {
    throw new Error("AssemblyAI subtitle export returned empty SRT")
  }
  return srt
}

async function pollAssemblyAIResult(
  transcriptId: string,
  maxWaitMs: number = 600000,
): Promise<{
  text: string
  language: string | null
  duration: number
  words: Array<{ start: number; end: number; text: string }>
}> {
  if (!ASSEMBLYAI_API_KEY) {
    throw new Error("ASSEMBLY_AI_API_KEY environment variable not set")
  }

  const startTime = Date.now()
  const pollInterval = 3000

  while (Date.now() - startTime < maxWaitMs) {
    const response = await fetch(`${ASSEMBLYAI_API_URL}/transcript/${transcriptId}`, {
      headers: { Authorization: ASSEMBLYAI_API_KEY },
    })
    if (!response.ok) {
      throw new Error(`AssemblyAI polling failed: ${response.status}`)
    }

    const data = await response.json()
    if (data.status === "completed") {
      const rawWords: any[] = Array.isArray(data.words) ? data.words : []
      return {
        text: typeof data.text === "string" ? data.text.trim() : "",
        language: typeof data.language_code === "string" ? data.language_code : null,
        duration: typeof data.audio_duration === "number" ? data.audio_duration : 0,
        words: rawWords
          .map((w) => ({
            start: typeof w.start === "number" ? w.start / 1000 : 0,
            end: typeof w.end === "number" ? w.end / 1000 : 0,
            text: typeof w.text === "string" ? w.text : "",
          }))
          .filter((w) => w.text.length > 0),
      }
    }
    if (data.status === "error") {
      throw new Error(`AssemblyAI transcription failed: ${data.error}`)
    }

    console.log(`[Captions] AssemblyAI status: ${data.status}, waiting...`)
    await new Promise((resolve) => setTimeout(resolve, pollInterval))
  }

  throw new Error("AssemblyAI transcription timeout")
}

export async function translateParentTranscriptToEnglish(
  sourceText: string,
  keywords?: CaptionKeywords,
): Promise<string | null> {
  const trimmed = (sourceText || "").trim()
  if (!trimmed) return null

  let schoolNames: string[] = keywords?.schoolNames?.filter((name) => (name || "").trim()) || []
  if (schoolNames.length === 0) {
    schoolNames = loadAcceptingInstitutionNames()
  }
  const { glossary } = buildTranscriptKeywords({
    schoolName: keywords?.schoolName,
    studentName: keywords?.studentName,
    schoolNames,
  })
  return translateFullTextToEnglish(trimmed, glossary)
}

/**
 * Parent-interview English captions:
 * 1) AssemblyAI sentences (timed source-language subtitles)
 * 2) GPT translates each cue in place
 * 3) GPT polishes school/student/grade names
 * 4) Transcript is the polished cues joined without timestamps
 */
export async function generateEnglishCaptionsFromVideoUrl(
  videoUrl: string,
  keywords?: CaptionKeywords,
): Promise<EnglishCaptions | null> {
  if (!ASSEMBLYAI_API_KEY) {
    console.error("[Captions] ASSEMBLY_AI_API_KEY not set; skipping English caption generation")
    return null
  }
  if (!process.env.OPENAI_API_KEY) {
    console.error("[Captions] OPENAI_API_KEY not set; skipping English caption generation")
    return null
  }
  if (!videoUrl) {
    console.error("[Captions] Video URL missing; skipping English caption generation")
    return null
  }

  let schoolNames: string[] = keywords?.schoolNames?.filter((name) => (name || "").trim()) || []
  if (schoolNames.length === 0) {
    schoolNames = loadAcceptingInstitutionNames()
  }

  const { glossary, wordBoost } = buildTranscriptKeywords({
    schoolName: keywords?.schoolName,
    studentName: keywords?.studentName,
    schoolNames,
  })
  console.log(
    `[Captions] Keywords: glossary=${glossary.length} wordBoost=${wordBoost.length} (student=${keywords?.studentName || "-"}, school=${keywords?.schoolName || "-"})`,
  )

  try {
    let transcriptId: string
    try {
      ;({ transcriptId } = await submitToAssemblyAI(videoUrl, wordBoost))
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      if (wordBoost.length > 0 && /word_boost|boost_param/i.test(message)) {
        console.warn("[Captions] AssemblyAI rejected word_boost; retrying without keywords")
        ;({ transcriptId } = await submitToAssemblyAI(videoUrl, []))
      } else {
        throw error
      }
    }

    const result = await pollAssemblyAIResult(transcriptId)
    let segments = await timedSourceCaptionsFromAssemblyAI(transcriptId, result)

    let sourceText = result.text
    if (!sourceText && segments.length > 0) {
      const isZh = (result.language || "").startsWith("zh")
      sourceText = segments.map((s) => s.text).join(isZh ? "" : " ")
    }
    if (!sourceText) {
      console.warn("[Captions] AssemblyAI returned empty transcript")
      return null
    }

    if (segments.length === 0) {
      console.warn("[Captions] AssemblyAI returned no timed sentences")
    } else {
      console.log(`[Captions] AssemblyAI timed sentences: ${segments.length}`)
    }

    const needsTranslation =
      (result.language && result.language !== "en" && !result.language.startsWith("en")) ||
      hasNonEnglishText([sourceText, ...segments.map((s) => s.text)])

    if (needsTranslation && segments.length > 0) {
      const translatedCues = await translateCaptionsToEnglish(
        segments.map((s) => s.text),
        glossary,
      )
      segments = segments.map((s, i) => ({
        start: s.start,
        end: s.end,
        text: translatedCues[i] ?? s.text,
      }))
    }

    if (segments.length > 0) {
      const polished = await polishCaptionsWithKeywords(
        segments.map((s) => s.text),
        glossary,
      )
      segments = segments.map((s, i) => ({
        start: s.start,
        end: s.end,
        text: polished[i] ?? s.text,
      }))
    }

    const text = mergeCaptionsIntoTranscript(segments) || sourceText

    console.log(`[Captions] English captions keep ${segments.length} AssemblyAI sentence timestamps`)

    return {
      language: "en",
      sourceLanguage: result.language,
      totalDuration:
        segments.length > 0 ? segments[segments.length - 1].end : result.duration || 0,
      segments,
      text,
      sourceText,
      srt: captionsToSrt(segments),
      keywords: glossary,
      wordBoost,
    }
  } catch (error) {
    console.error("[Captions] Failed to generate English captions:", error instanceof Error ? error.message : error)
    return null
  }
}
