"use server"

import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "./auth"
import { hashPassword } from "@/lib/auth-utils"

type SchoolLevel = "k12" | "undergraduate"

const SCHOOL_LEVELS: SchoolLevel[] = ["k12", "undergraduate"]

export interface ManagedSchool {
  id: string
  code: string
  name: string
  level: string
  active: boolean
  credits_balance: number
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
        level: true,
        active: true,
        credits_balance: true,
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
  level = "k12",
}: {
  name: string
  code: string
  level?: string
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

    if (!SCHOOL_LEVELS.includes(level as SchoolLevel)) {
      return { success: false, error: "School level must be k12 or undergraduate" }
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

    // 获取默认的4个题目（school_id 为 null 的系统题目）
    const defaultPrompts = await prisma.prompt.findMany({
      where: { school_id: null },
      orderBy: { created_at: 'asc' },
      take: 4,
      select: { id: true }
    })

    if (defaultPrompts.length < 4) {
      console.warn(`[Schools] Only found ${defaultPrompts.length} default prompts, need 4`)
    }

    const defaultPromptIds = defaultPrompts.map(p => p.id)

    const school = await prisma.school.create({
      data: {
        name: trimmedName,
        code: normalizedCode,
        level: level,
        email: email,
        password_hash: hashedPassword,
        active: true,
        selected_prompt_ids: defaultPromptIds.length === 4 ? defaultPromptIds : [], // 只有正好4个才设置
      },
      select: {
        id: true,
        code: true,
        name: true,
        level: true,
        active: true,
        credits_balance: true,
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

export async function updateSchoolLevel(
  schoolId: string,
  level: string
): Promise<{
  success: boolean
  school?: ManagedSchool
  error?: string
}> {
  try {
    await ensureSuperAdmin()

    if (!SCHOOL_LEVELS.includes(level as SchoolLevel)) {
      return { success: false, error: "School level must be k12 or undergraduate" }
    }

    const existing = await prisma.school.findUnique({
      where: { id: schoolId },
      select: { id: true, code: true },
    })

    if (!existing) {
      return { success: false, error: "School not found" }
    }

    if (existing.code === "_system") {
      return { success: false, error: "System school level cannot be changed" }
    }

    const school = await prisma.school.update({
      where: { id: schoolId },
      data: { level },
      select: {
        id: true,
        code: true,
        name: true,
        level: true,
        active: true,
        credits_balance: true,
        created_at: true,
        updated_at: true,
      },
    })

    return {
      success: true,
      school: {
        ...school,
        code: school.code || "",
      },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

export async function adjustSchoolCredits(
  schoolId: string,
  amount: number
): Promise<{
  success: boolean
  school?: ManagedSchool
  error?: string
}> {
  try {
    await ensureSuperAdmin()

    if (!Number.isInteger(amount) || amount === 0) {
      return { success: false, error: "Credit adjustment must be a non-zero whole number" }
    }

    const existing = await prisma.school.findUnique({
      where: { id: schoolId },
      select: {
        id: true,
        code: true,
      },
    })

    if (!existing) {
      return { success: false, error: "School not found" }
    }

    if (existing.code === "_system") {
      return { success: false, error: "System school credits cannot be changed" }
    }

    const school = await prisma.$transaction(async (tx) => {
      if (amount < 0) {
        const updateResult = await tx.school.updateMany({
          where: {
            id: schoolId,
            credits_balance: {
              gte: Math.abs(amount),
            },
          },
          data: {
            credits_balance: {
              increment: amount,
            },
          },
        })

        if (updateResult.count === 0) {
          throw new Error("Credit balance cannot be negative")
        }
      } else {
        await tx.school.update({
          where: { id: schoolId },
          data: {
            credits_balance: {
              increment: amount,
            },
          },
        })
      }

      await tx.creditTransaction.create({
        data: {
          school_id: schoolId,
          amount,
          transaction_type: "admin_adjustment",
          payment_status: "completed",
        },
      })

      const updatedSchool = await tx.school.findUnique({
        where: { id: schoolId },
        select: {
          id: true,
          code: true,
          name: true,
          level: true,
          active: true,
          credits_balance: true,
          created_at: true,
          updated_at: true,
        },
      })

      if (!updatedSchool) {
        throw new Error("School not found")
      }

      return updatedSchool
    })

    return {
      success: true,
      school: {
        ...school,
        code: school.code || "",
      },
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

    // 删除该学校的所有自定义 prompts（school_id 不为 null）
    // 注意：interviews 会通过数据库级联删除自动删除（onDelete: Cascade）
    await prisma.prompt.deleteMany({
      where: { school_id: schoolId }
    })

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
