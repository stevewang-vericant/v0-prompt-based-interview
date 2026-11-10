import { exec } from 'child_process'
import { existsSync, unlinkSync } from 'fs'
import { promisify } from 'util'

const execAsync = promisify(exec)

export type CommandRunner = (command: string) => Promise<{ stdout: string }>

const MISSING_DURATION_MESSAGE = 'no valid media duration'

export function parseFormatDuration(stdout: string): number | null {
  const value = Number.parseFloat(stdout.trim())
  if (!Number.isFinite(value) || value <= 0) return null
  return value
}

export function isMissingContainerDurationError(message: string): boolean {
  return message.includes(MISSING_DURATION_MESSAGE)
}

function quoteShell(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`
}

export function ffprobeDurationCommand(filePath: string): string {
  return `ffprobe -v error -show_entries format=duration -of csv=p=0 ${quoteShell(filePath)}`
}

export function remuxDurationCommand(inputPath: string, outputPath: string): string {
  return `ffmpeg -v error -y -i ${quoteShell(inputPath)} -c copy -fflags +genpts ${quoteShell(outputPath)}`
}

/**
 * MediaRecorder WebM (commonly VP8) often omits the container Duration element.
 * ffprobe then prints "N/A" even though the packets decode. A stream copy remux
 * writes the duration without changing the media.
 */
export async function probeMediaDurationSeconds(
  filePath: string,
  run: CommandRunner = (command) => execAsync(command, { maxBuffer: 10 * 1024 * 1024 }),
): Promise<{ seconds: number; recovered: boolean; mediaPath: string }> {
  const direct = parseFormatDuration((await run(ffprobeDurationCommand(filePath))).stdout)
  if (direct != null) {
    return { seconds: direct, recovered: false, mediaPath: filePath }
  }

  const fixedPath = `${filePath}.duration-fixed.webm`
  try {
    await run(remuxDurationCommand(filePath, fixedPath))
    const recovered = parseFormatDuration((await run(ffprobeDurationCommand(fixedPath))).stdout)
    if (recovered == null) {
      throw new Error(MISSING_DURATION_MESSAGE)
    }
    // Keep the remuxed file. Callers merge that copy, because its container duration is readable.
    return { seconds: recovered, recovered: true, mediaPath: fixedPath }
  } catch (error) {
    try {
      if (existsSync(fixedPath)) unlinkSync(fixedPath)
    } catch {
      // Best-effort cleanup of a failed remux.
    }
    if (error instanceof Error && error.message === MISSING_DURATION_MESSAGE) {
      throw error
    }
    const detail = error instanceof Error ? error.message : 'duration recovery failed'
    throw new Error(`${MISSING_DURATION_MESSAGE}: ${detail}`)
  }
}
