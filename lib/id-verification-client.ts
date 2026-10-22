const PHOTO_PREFIX = "vgi-id-photo-url:"
const SCREENSHOT_PREFIX = "vgi-screenshot-url:"

function storage(): Storage | null {
  if (typeof window === "undefined") return null
  return window.sessionStorage
}

export function readStoredIdPhotoUrl(interviewId: string): string | null {
  if (!interviewId) return null
  return storage()?.getItem(PHOTO_PREFIX + interviewId) || null
}

export function writeStoredIdPhotoUrl(interviewId: string, url: string): void {
  if (!interviewId || !url) return
  storage()?.setItem(PHOTO_PREFIX + interviewId, url)
}

export function readStoredScreenshotUrl(interviewId: string): string | null {
  if (!interviewId) return null
  return storage()?.getItem(SCREENSHOT_PREFIX + interviewId) || null
}

export function writeStoredScreenshotUrl(interviewId: string, url: string): void {
  if (!interviewId || !url) return
  storage()?.setItem(SCREENSHOT_PREFIX + interviewId, url)
}

export function mediaProxyUrl(url: string): string {
  return `/api/proxy-video?url=${encodeURIComponent(url)}`
}
