import { exec } from "child_process"
import { promisify } from "util"
import { readFileSync, unlinkSync, writeFileSync, existsSync } from "fs"
import { join } from "path"
import { tmpdir } from "os"
import { prisma } from "@/lib/prisma"

const execAsync = promisify(exec)
let externalApiLogTableReady = false

type CathovenResponse = Record<string, any>

export interface CathovenEvaluationResult {
  success: boolean
  statusCode?: number
  response?: CathovenResponse
  finalScore: number | null
  error?: string
}

interface EvaluateCathovenInput {
  interviewId: string
  questions: string[]
  mergedVideoBuffer: Buffer
}

function sanitizeForLog(value: unknown): unknown {
  if (value === null || value === undefined) return value
  if (typeof value !== "object") return value
  if (Array.isArray(value)) return value.map(sanitizeForLog)

  const obj = value as Record<string, unknown>
  const out: Record<string, unknown> = {}

  for (const [key, raw] of Object.entries(obj)) {
    const lower = key.toLowerCase()
    if (lower.includes("secret") || lower.includes("token") || lower.includes("password")) {
      out[key] = "***REDACTED***"
      continue
    }

    if (key === "audio" && typeof raw === "string") {
      out[key] = `[base64 redacted, length=${raw.length}]`
      continue
    }

    out[key] = sanitizeForLog(raw)
  }
  return out
}

function safeJsonStringify(value: unknown): string {
  try {
    return JSON.stringify(value)
  } catch {
    return JSON.stringify({ serializationError: true })
  }
}

function findNumericScore(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (!value || typeof value !== "object") return null

  const obj = value as Record<string, unknown>
  const preferredKeys = [
    "final_score",
    "finalScore",
    "overall_score",
    "overallScore",
    "total_score",
    "totalScore",
    "score",
  ]

  for (const key of preferredKeys) {
    const candidate = obj[key]
    if (typeof candidate === "number" && Number.isFinite(candidate)) {
      return candidate
    }
  }

  for (const [key, child] of Object.entries(obj)) {
    if (key.toLowerCase().includes("score")) {
      const nested = findNumericScore(child)
      if (nested !== null) return nested
    }
  }

  for (const child of Object.values(obj)) {
    const nested = findNumericScore(child)
    if (nested !== null) return nested
  }

  return null
}

async function toAudioBase64FromVideoBuffer(videoBuffer: Buffer): Promise<string> {
  const inputPath = join(tmpdir(), `cathoven-input-${Date.now()}.mp4`)
  const outputPath = join(tmpdir(), `cathoven-audio-${Date.now()}.mp3`)

  try {
    writeFileSync(inputPath, videoBuffer)
    const cmd = `ffmpeg -y -i "${inputPath}" -vn -ac 1 -ar 16000 -b:a 96k "${outputPath}"`
    await execAsync(cmd)

    const audioBuffer = readFileSync(outputPath)
    return audioBuffer.toString("base64")
  } finally {
    try {
      if (existsSync(inputPath)) unlinkSync(inputPath)
    } catch {}
    try {
      if (existsSync(outputPath)) unlinkSync(outputPath)
    } catch {}
  }
}

async function createApiLog(params: {
  interviewId: string
  endpoint: string
  requestPayload: unknown
  responsePayload?: unknown
  statusCode?: number
  success: boolean
  errorMessage?: string
  durationMs: number
}) {
  try {
    if (!externalApiLogTableReady) {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS external_api_logs (
          id UUID PRIMARY KEY,
          provider VARCHAR(100) NOT NULL,
          interview_id VARCHAR(255),
          endpoint VARCHAR(500) NOT NULL,
          request_payload TEXT,
          response_payload TEXT,
          status_code INTEGER,
          success BOOLEAN NOT NULL DEFAULT FALSE,
          error_message TEXT,
          duration_ms INTEGER,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `)
      externalApiLogTableReady = true
    }

    await prisma.externalApiLog.create({
      data: {
        id: crypto.randomUUID(),
        provider: "cathoven",
        interview_id: params.interviewId,
        endpoint: params.endpoint,
        request_payload: safeJsonStringify(sanitizeForLog(params.requestPayload)),
        response_payload: params.responsePayload
          ? safeJsonStringify(sanitizeForLog(params.responsePayload))
          : null,
        status_code: params.statusCode,
        success: params.success,
        error_message: params.errorMessage,
        duration_ms: params.durationMs,
      },
    })
  } catch (error) {
    console.error("[Cathoven] Failed to store API log:", error)
  }
}

export async function evaluateInterviewWithCathoven(
  input: EvaluateCathovenInput
): Promise<CathovenEvaluationResult> {
  const endpoint =
    process.env.CATHOVEN_IELTS_SPEAKING_API_URL || process.env.CATHOVEN_API_URL
  const apiKey = process.env.CATHOVEN_API_KEY || process.env.CATHOVEN_ACCESS_TOKEN
  const clientId = process.env.CATHOVEN_CLIENT_ID
  const clientSecret = process.env.CATHOVEN_CLIENT_SECRET
  const authHeaderName = process.env.CATHOVEN_API_KEY_HEADER || "Authorization"
  const authValuePrefix = process.env.CATHOVEN_API_KEY_PREFIX || "Bearer "

  if (!endpoint) {
    return {
      success: false,
      finalScore: null,
      error: "CATHOVEN_IELTS_SPEAKING_API_URL is not configured",
    }
  }

  if (!apiKey && (!clientId || !clientSecret)) {
    return {
      success: false,
      finalScore: null,
      error:
        "Cathoven credentials missing. Set CATHOVEN_ACCESS_TOKEN/CATHOVEN_API_KEY or CATHOVEN_CLIENT_ID + CATHOVEN_CLIENT_SECRET.",
    }
  }

  const started = Date.now()
  const audioBase64 = await toAudioBase64FromVideoBuffer(input.mergedVideoBuffer)
  const payload = {
    rubric: "vericant_lite",
    ...(clientId ? { client_id: clientId } : {}),
    ...(clientSecret ? { client_secret: clientSecret } : {}),
    data: [
      {
        questions: input.questions,
        audio: audioBase64,
      },
    ],
  }

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }
    if (apiKey) {
      headers[authHeaderName] = `${authValuePrefix}${apiKey}`
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    })

    const text = await response.text()
    let responseBody: CathovenResponse
    try {
      responseBody = JSON.parse(text)
    } catch {
      responseBody = { raw: text }
    }

    const finalScore = findNumericScore(responseBody)
    const durationMs = Date.now() - started

    await createApiLog({
      interviewId: input.interviewId,
      endpoint,
      requestPayload: payload,
      responsePayload: responseBody,
      statusCode: response.status,
      success: response.ok,
      errorMessage: response.ok ? undefined : `HTTP ${response.status}`,
      durationMs,
    })

    if (!response.ok) {
      return {
        success: false,
        statusCode: response.status,
        response: responseBody,
        finalScore,
        error: `Cathoven request failed with status ${response.status}`,
      }
    }

    return {
      success: true,
      statusCode: response.status,
      response: responseBody,
      finalScore,
    }
  } catch (error) {
    const durationMs = Date.now() - started
    const message = error instanceof Error ? error.message : "Unknown Cathoven error"
    await createApiLog({
      interviewId: input.interviewId,
      endpoint,
      requestPayload: payload,
      success: false,
      errorMessage: message,
      durationMs,
    })
    return {
      success: false,
      finalScore: null,
      error: message,
    }
  }
}
