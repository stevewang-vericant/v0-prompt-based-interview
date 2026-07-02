"use server"

import { prisma } from "@/lib/prisma"
import { CBO_ORGANIZATIONS } from "@/lib/cbo-organizations"
import { toClientError } from "@/lib/errors"

/**
 * Returns the list of CBO / Access Organizations shown in the student form.
 *
 * The base list lives in `lib/cbo-organizations.ts`, but students can type a
 * CBO that isn't listed (the "Other" option). Those manually-entered names are
 * stored on the student record, and we merge the distinct values back into the
 * selectable list here so future students can pick them directly.
 */
export async function getCboOrganizations(): Promise<{
  success: boolean
  organizations: string[]
  error?: string
}> {
  try {
    const rows = await prisma.student.findMany({
      where: { uses_cbo: true, cbo_organization: { not: null } },
      select: { cbo_organization: true },
      distinct: ["cbo_organization"],
    })

    const custom = rows
      .map((r) => r.cbo_organization?.trim())
      .filter((name): name is string => !!name)

    // Merge static + custom, de-duplicating case-insensitively (static casing wins).
    const seen = new Map<string, string>()
    for (const name of [...CBO_ORGANIZATIONS, ...custom]) {
      const trimmed = name.trim()
      const key = trimmed.toLowerCase()
      if (!trimmed || seen.has(key)) continue
      seen.set(key, trimmed)
    }

    const organizations = Array.from(seen.values()).sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" })
    )

    return { success: true, organizations }
  } catch (error) {
    console.error("[CBO] Error loading CBO organizations:", error)
    // Fall back to the static list so the form still works.
    return { success: false, organizations: [...CBO_ORGANIZATIONS], error: toClientError(error) }
  }
}
