"use client"

export const AUDIBLE_AUDIO_DB_THRESHOLD = -50

export interface AudioLevelSample {
  db: number
  level: number
  audible: boolean
}

export interface AudioLevelMonitor {
  resume: () => Promise<void>
  stop: () => void
}

export function hasLiveAudioTrack(stream: MediaStream): boolean {
  return stream.getAudioTracks().some((track) => track.readyState === "live")
}

export function startAudioLevelMonitor(
  stream: MediaStream,
  onSample: (sample: AudioLevelSample) => void,
): AudioLevelMonitor {
  if (!hasLiveAudioTrack(stream)) {
    throw new Error("No live microphone track is available.")
  }

  const AudioContextClass =
    window.AudioContext ||
    (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AudioContextClass) {
    throw new Error("Audio level detection is not supported by this browser.")
  }

  const context = new AudioContextClass()
  const source = context.createMediaStreamSource(stream)
  const analyser = context.createAnalyser()
  analyser.fftSize = 2048
  analyser.smoothingTimeConstant = 0.2
  source.connect(analyser)

  const samples = new Float32Array(analyser.fftSize)
  let animationFrame = 0
  let stopped = false

  const measure = () => {
    if (stopped) return

    analyser.getFloatTimeDomainData(samples)
    let sumSquares = 0
    for (let index = 0; index < samples.length; index += 1) {
      sumSquares += samples[index] * samples[index]
    }

    const rms = Math.sqrt(sumSquares / samples.length)
    const db = rms > 0 ? 20 * Math.log10(rms) : -100
    const level = Math.max(0, Math.min(1, (db + 60) / 45))

    onSample({
      db,
      level,
      audible: db >= AUDIBLE_AUDIO_DB_THRESHOLD,
    })
    animationFrame = window.requestAnimationFrame(measure)
  }

  animationFrame = window.requestAnimationFrame(measure)

  return {
    resume: async () => {
      if (context.state === "suspended") {
        await context.resume()
      }
    },
    stop: () => {
      if (stopped) return
      stopped = true
      window.cancelAnimationFrame(animationFrame)
      source.disconnect()
      analyser.disconnect()
      void context.close()
    },
  }
}
