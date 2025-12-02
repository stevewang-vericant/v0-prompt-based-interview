"use server"

import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "./auth"
import { hashPassword } from "@/lib/auth-utils"

export interface ManagedSchool {
  id: string
  code: string
  name: string
  active: boolean
  created_at: Date | null
  updated_at: Date | null
}

async function ensureSuperAdmin() {
  const { user, success } = await getCurrentUser()

  if (!success || !user) {
    throw new Error("Not authenticated")
  }

  if (!user.school.is_super_admin) {
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

    const schools = await prisma.school.findMany({
      where: {
        NOT: {
          code: "_system"
        }
      },
      orderBy: {
        created_at: 'asc'
      },
      select: {
        id: true,
        code: true,
        name: true,
        active: true,
        created_at: true,
        updated_at: true
      }
    })

    // 转换类型：Prisma code 是 nullable，但我们这里需要 string
    const mappedSchools = schools.map(s => ({
      ...s,
      code: s.code || '',
      // created_at 和 updated_at 是 Date，但在 Next.js Server Actions 传输中通常会自动序列化
      // 这里的接口定义是 Date | null，所以没问题
    }))

    return {
      success: true,
      schools: mappedSchools,
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

    // 检查 code 是否已存在
    const existing = await prisma.school.findFirst({
      where: { code: normalizedCode }
    })
    
    if (existing) {
       return { success: false, error: "School code already exists" }
    }

    // ⚠️ 自动生成默认密码和邮箱
    // 由于将 schools 表合并为用户表，我们需要生成唯一邮箱和密码
    const email = `admin@${normalizedCode}.com` // 假设的邮箱
    const defaultPassword = normalizedCode // 默认密码为 code
    const hashedPassword = await hashPassword(defaultPassword)

    const school = await prisma.school.create({
      data: {
        name: trimmedName,
        code: normalizedCode,
        email: email,
        password_hash: hashedPassword,
        active: true,
      },
      select: {
        id: true,
        code: true,
        name: true,
        active: true,
        created_at: true,
        updated_at: true
      }
    })

    console.log(`[Auth] Created school ${normalizedCode} with default password: ${defaultPassword}`)

    return {
      success: true,
      school: {
        ...school,
        code: school.code || ''
      },
    }
  } catch (error) {
    console.error("Create school error:", error)
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

    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      select: { id: true, code: true }
    })

    if (!school) {
      return { success: false, error: "School not found" }
    }

    if (school.code === "_system") {
      return { success: false, error: "System school cannot be deleted" }
    }

    // 检查是否有面试记录
    const interviewCount = await prisma.interview.count({
      where: { school_id: schoolId }
    })

    if (interviewCount > 0) {
      return {
        success: false,
        error: "Cannot delete school with existing interviews",
      }
    }

    await prisma.school.delete({
      where: { id: schoolId }
    })

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}
