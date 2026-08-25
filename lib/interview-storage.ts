const LEGACY_INTERVIEW_KEY = "currentInterviewId"

export function getInterviewStorageKey(schoolCode: string): string {
  return `currentInterviewId:${schoolCode.trim().toLowerCase()}`
}

export function getStoredInterviewId(schoolCode: string): string | null {
  const scopedKey = getInterviewStorageKey(schoolCode)
  const scoped = localStorage.getItem(scopedKey)
  if (scoped) return scoped

  // The old key did not identify a school, so it cannot be migrated safely:
  // assigning it to whichever school is opened first could expose another
  // school's paid-interview recovery state.
  localStorage.removeItem(LEGACY_INTERVIEW_KEY)
  return null
}

export function storeInterviewId(schoolCode: string, interviewId: string): void {
  localStorage.setItem(getInterviewStorageKey(schoolCode), interviewId)
  localStorage.removeItem(LEGACY_INTERVIEW_KEY)
}

export function clearStoredInterviewId(schoolCode: string): void {
  localStorage.removeItem(getInterviewStorageKey(schoolCode))
  localStorage.removeItem(LEGACY_INTERVIEW_KEY)
}
