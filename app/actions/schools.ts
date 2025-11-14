"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export interface ManagedSchool {
  id: string
  code: string
  name: string
  active: boolean
  created_at: string | null
  updated_at: string | null
}

async function ensureSuperAdmin() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user?.email) {
    throw new Error("Not authenticated")
  }

  const { data: adminRecord, error } = await supabase
    .from("school_admins")
    .select("is_super_admin")
    .eq("email", user.email)
    .single()

  if (error || !adminRecord?.is_super_admin) {
    throw new Error("Not authorized")
  }

  return { email: user.email }
}

export async function listSchools(): Promise<{
  success: boolean
  schools?: ManagedSchool[]
  error?: string
}> {
  try {
    await ensureSuperAdmin()

    const adminClient = createAdminClient()
    const { data, error } = await adminClient
      .from("schools")
      .select("id, code, name, active, created_at, updated_at")
      .neq("code", "_system")
      .order("created_at", { ascending: true })

    if (error) {
      return { success: false, error: error.message }
    }

    return {
      success: true,
      schools: data || [],
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

export async function createSchool({
  name,
  code,
}: {
  name: string
  code: string
}): Promise<{
  success: boolean
  school?: ManagedSchool
  error?: string
}> {
  try {
    await ensureSuperAdmin()

    const trimmedName = name.trim()
    const normalizedCode = code
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")

    if (!trimmedName) {
      return { success: false, error: "School name is required" }
    }

    if (!normalizedCode || !/^[a-z0-9-]+$/.test(normalizedCode)) {
      return {
        success: false,
        error: "School code must use lowercase letters, numbers or hyphen",
      }
    }

    if (normalizedCode === "_system") {
      return { success: false, error: "Reserved code cannot be used" }
    }

    const adminClient = createAdminClient()
    const { data, error } = await adminClient
      .from("schools")
      .insert({
        name: trimmedName,
        code: normalizedCode,
        active: true,
      })
      .select("id, code, name, active, created_at, updated_at")
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    return {
      success: true,
      school: data as ManagedSchool,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

export async function deleteSchool(
  schoolId: string
): Promise<{
  success: boolean
  error?: string
}> {
  try {
    await ensureSuperAdmin()

    const adminClient = createAdminClient()

    const { data: school, error: fetchError } = await adminClient
      .from("schools")
      .select("id, code")
      .eq("id", schoolId)
      .single()

    if (fetchError || !school) {
      return { success: false, error: fetchError?.message || "School not found" }
    }

    if (school.code === "_system") {
      return { success: false, error: "System school cannot be deleted" }
    }

    const { count: interviewCount, error: interviewCountError } = await adminClient
      .from("interviews")
      .select("id", { count: "exact", head: true })
      .eq("school_code", school.code)

    if (interviewCountError) {
      return { success: false, error: interviewCountError.message }
    }

    if ((interviewCount || 0) > 0) {
      return {
        success: false,
        error: "Cannot delete school with existing interviews",
      }
    }

    const { error } = await adminClient.from("schools").delete().eq("id", schoolId)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}


