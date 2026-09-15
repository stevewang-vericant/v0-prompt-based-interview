/**
 * Helpers for the `School.level` field ("k12" | "undergraduate").
 *
 * Shared by server actions and client components so the parent-interview gate
 * stays in one place.
 */

export const UNIVERSITY_LEVEL = "undergraduate"

/**
 * University / higher-education schools do not run parent interviews, so every
 * parent-interview entry point (nav, links, settings, public flow) is hidden
 * and blocked for them.
 *
 * `null`/`undefined` means "level not loaded yet"; callers that must not flash
 * parent UI should wait for the real value before calling this.
 */
export function supportsParentInterviews(level: string | null | undefined): boolean {
  return level !== UNIVERSITY_LEVEL
}
