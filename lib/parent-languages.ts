// Languages a parent can choose as their preferred response language for the
// parent interview. The value is the English display name and is also used as
// the target language when translating question text and when generating
// English captions from the parent's spoken response.
export const PARENT_RESPONSE_LANGUAGES = [
  "English",
  "Chinese (Simplified)",
  "Chinese (Traditional)",
  "Cantonese",
  "Korean",
  "Japanese",
  "Vietnamese",
  "Thai",
  "Spanish",
  "Portuguese",
  "French",
  "German",
  "Italian",
  "Russian",
  "Arabic",
  "Hindi",
  "Indonesian",
  "Turkish",
] as const

export type ParentResponseLanguage = (typeof PARENT_RESPONSE_LANGUAGES)[number]

export const DEFAULT_PARENT_RESPONSE_LANGUAGE: ParentResponseLanguage = "English"

export function isSupportedParentLanguage(value: string | null | undefined): boolean {
  if (!value) return false
  return (PARENT_RESPONSE_LANGUAGES as readonly string[]).includes(value)
}
