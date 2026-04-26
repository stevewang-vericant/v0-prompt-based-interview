"use server"

import { prisma } from "@/lib/prisma"
import { hashPassword } from "@/lib/auth-utils"
import { getCurrentUser } from "./auth"

export interface ManagedUser {
  id: string
  email: string
  name: string
  code: string | null
  active: boolean
  is_super_admin: boolean
  is_rater: boolean
  contact_person: string | null
  created_at: Date | null
  updated_at: Date | null
  type: 'school_admin' | 'school'
  school_id?: string
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

/**
 * 获取所有用户列表（仅超级管理员）
 * 包括 SchoolAdmin（新账号）和 School（旧账号，向后兼容）
 */
export async function listUsers(): Promise<{
  success: boolean
  users?: ManagedUser[]
  error?: string
}> {
  try {
    await ensureSuperAdmin()

    // 1. 获取所有 SchoolAdmin（新账号）
    const admins = await prisma.schoolAdmin.findMany({
      include: {
        school: {
          select: {
            code: true,
            name: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    })

    // 2. 获取所有有 email 的 School（旧账号，向后兼容）
    const schools = await prisma.school.findMany({
      where: {
        email: { not: null },
        password_hash: { not: null }
      },
      select: {
        id: true,
        email: true,
        name: true,
        code: true,
        active: true,
        is_super_admin: true,
        is_rater: true,
        contact_person: true,
        created_at: true,
        updated_at: true
      },
      orderBy: {
        created_at: 'desc'
      }
    })

    // 3. 合并并格式化
    const adminUsers: ManagedUser[] = admins.map(admin => ({
      id: admin.id,
      email: admin.email,
      name: admin.name || '',
      code: admin.school.code || '',
      active: admin.active,
      is_super_admin: admin.is_super_admin,
      is_rater: admin.is_rater,
      contact_person: admin.name,
      created_at: admin.created_at,
      updated_at: admin.updated_at,
      type: 'school_admin' as const,
      school_id: admin.school_id
    }))

    const schoolUsers: ManagedUser[] = schools.map(school => ({
      id: school.id,
      email: school.email!,
      name: school.name,
      code: school.code || '',
      active: school.active,
      is_super_admin: school.is_super_admin,
      is_rater: school.is_rater,
      contact_person: school.contact_person,
      created_at: school.created_at,
      updated_at: school.updated_at,
      type: 'school' as const
    }))

    // 合并并按创建时间排序
    const allUsers = [...adminUsers, ...schoolUsers].sort((a, b) => {
      const aTime = a.created_at?.getTime() || 0
      const bTime = b.created_at?.getTime() || 0
      return bTime - aTime
    })

    return {
      success: true,
      users: allUsers,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * 激活用户
 * 支持 SchoolAdmin（新账号）和 School（旧账号，向后兼容）
 */
export async function activateUser(userId: string, userType?: 'school_admin' | 'school'): Promise<{
  success: boolean
  error?: string
}> {
  try {
    await ensureSuperAdmin()

    // 如果没有指定类型，先尝试查找 SchoolAdmin
    if (!userType) {
      const admin = await prisma.schoolAdmin.findUnique({
        where: { id: userId }
      })
      if (admin) {
        userType = 'school_admin'
      } else {
        userType = 'school'
      }
    }

    if (userType === 'school_admin') {
      const admin = await prisma.schoolAdmin.findUnique({
        where: { id: userId }
      })

      if (!admin) {
        return { success: false, error: "User not found" }
      }

      if (admin.is_super_admin) {
        return { success: false, error: "Cannot modify super admin account" }
      }

      await prisma.schoolAdmin.update({
        where: { id: userId },
        data: { active: true }
      })
    } else {
      const user = await prisma.school.findUnique({
        where: { id: userId }
      })

      if (!user) {
        return { success: false, error: "User not found" }
      }

      if (user.is_super_admin) {
        return { success: false, error: "Cannot modify super admin account" }
      }

      await prisma.school.update({
        where: { id: userId },
        data: { active: true }
      })
    }

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * 停用用户
 * 支持 SchoolAdmin（新账号）和 School（旧账号，向后兼容）
 */
export async function deactivateUser(userId: string, userType?: 'school_admin' | 'school'): Promise<{
  success: boolean
  error?: string
}> {
  try {
    await ensureSuperAdmin()

    // 如果没有指定类型，先尝试查找 SchoolAdmin
    if (!userType) {
      const admin = await prisma.schoolAdmin.findUnique({
        where: { id: userId }
      })
      if (admin) {
        userType = 'school_admin'
      } else {
        userType = 'school'
      }
    }

    if (userType === 'school_admin') {
      const admin = await prisma.schoolAdmin.findUnique({
        where: { id: userId }
      })

      if (!admin) {
        return { success: false, error: "User not found" }
      }

      if (admin.is_super_admin) {
        return { success: false, error: "Cannot modify super admin account" }
      }

      await prisma.schoolAdmin.update({
        where: { id: userId },
        data: { active: false }
      })
    } else {
      const user = await prisma.school.findUnique({
        where: { id: userId }
      })

      if (!user) {
        return { success: false, error: "User not found" }
      }

      if (user.is_super_admin) {
        return { success: false, error: "Cannot modify super admin account" }
      }

      await prisma.school.update({
        where: { id: userId },
        data: { active: false }
      })
    }

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * 拒绝待审批用户请求
 * 仅允许拒绝未激活账号
 */
export async function declineUserRequest(userId: string, userType?: 'school_admin' | 'school'): Promise<{
  success: boolean
  error?: string
}> {
  try {
    await ensureSuperAdmin()

    // 如果没有指定类型，先尝试查找 SchoolAdmin
    if (!userType) {
      const admin = await prisma.schoolAdmin.findUnique({
        where: { id: userId }
      })
      if (admin) {
        userType = 'school_admin'
      } else {
        userType = 'school'
      }
    }

    if (userType === 'school_admin') {
      const admin = await prisma.schoolAdmin.findUnique({
        where: { id: userId }
      })

      if (!admin) {
        return { success: false, error: "User not found" }
      }

      if (admin.is_super_admin) {
        return { success: false, error: "Cannot modify super admin account" }
      }

      if (admin.active) {
        return { success: false, error: "Only pending requests can be declined" }
      }

      await prisma.schoolAdmin.delete({
        where: { id: userId }
      })
    } else {
      const schoolUser = await prisma.school.findUnique({
        where: { id: userId },
        select: { id: true, code: true, is_super_admin: true, active: true }
      })

      if (!schoolUser) {
        return { success: false, error: "User not found" }
      }

      if (schoolUser.is_super_admin) {
        return { success: false, error: "Cannot modify super admin account" }
      }

      if (schoolUser.active) {
        return { success: false, error: "Only pending requests can be declined" }
      }

      if (schoolUser.code === "_system") {
        return { success: false, error: "System user cannot be declined" }
      }

      // 避免误删已有业务数据的旧账号
      const interviewCount = await prisma.interview.count({
        where: { school_id: userId }
      })

      if (interviewCount > 0) {
        return {
          success: false,
          error: "Cannot decline request with existing interviews. Please deactivate the account instead.",
        }
      }

      await prisma.prompt.deleteMany({
        where: { school_id: userId }
      })

      await prisma.school.delete({
        where: { id: userId }
      })
    }

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * 删除用户
 */
export async function deleteUser(userId: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    await ensureSuperAdmin()

    const user = await prisma.school.findUnique({
      where: { id: userId },
      select: { id: true, code: true, is_super_admin: true }
    })

    if (!user) {
      return { success: false, error: "User not found" }
    }

    if (user.is_super_admin) {
      return { success: false, error: "Cannot delete super admin account" }
    }

    if (user.code === "_system") {
      return { success: false, error: "System user cannot be deleted" }
    }

    // 检查是否有面试记录
    const interviewCount = await prisma.interview.count({
      where: { school_id: userId }
    })

    if (interviewCount > 0) {
      return {
        success: false,
        error: "Cannot delete user with existing interviews. Please delete interviews first or deactivate the account instead.",
      }
    }

    // 删除该学校的所有自定义 prompts
    await prisma.prompt.deleteMany({
      where: { school_id: userId }
    })

    await prisma.school.delete({
      where: { id: userId }
    })

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * 重置用户密码
 * 支持 SchoolAdmin（新账号）和 School（旧账号，向后兼容）
 */
export async function resetUserPassword(userId: string, newPassword: string, userType?: 'school_admin' | 'school'): Promise<{
  success: boolean
  error?: string
}> {
  try {
    await ensureSuperAdmin()

    const hashedPassword = await hashPassword(newPassword)

    // 如果没有指定类型，先尝试查找 SchoolAdmin
    if (!userType) {
      const admin = await prisma.schoolAdmin.findUnique({
        where: { id: userId }
      })
      if (admin) {
        userType = 'school_admin'
      } else {
        userType = 'school'
      }
    }

    if (userType === 'school_admin') {
      const admin = await prisma.schoolAdmin.findUnique({
        where: { id: userId }
      })

      if (!admin) {
        return { success: false, error: "User not found" }
      }

      if (admin.is_super_admin) {
        return { success: false, error: "Cannot reset super admin password" }
      }

      await prisma.schoolAdmin.update({
        where: { id: userId },
        data: { password_hash: hashedPassword }
      })
    } else {
      const user = await prisma.school.findUnique({
        where: { id: userId }
      })

      if (!user) {
        return { success: false, error: "User not found" }
      }

      if (user.is_super_admin) {
        return { success: false, error: "Cannot reset super admin password" }
      }

      await prisma.school.update({
        where: { id: userId },
        data: { password_hash: hashedPassword }
      })
    }

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Toggle rater role for any user (SchoolAdmin or legacy School), super admin only
 */
export async function toggleRaterRole(userId: string, isRater: boolean): Promise<{
  success: boolean
  error?: string
}> {
  try {
    await ensureSuperAdmin()

    // Try SchoolAdmin first
    const admin = await prisma.schoolAdmin.findUnique({ where: { id: userId } })
    if (admin) {
      await prisma.schoolAdmin.update({
        where: { id: userId },
        data: { is_rater: isRater }
      })
      return { success: true }
    }

    // Fall back to legacy School account
    const school = await prisma.school.findUnique({ where: { id: userId } })
    if (school) {
      await prisma.school.update({
        where: { id: userId },
        data: { is_rater: isRater }
      })
      return { success: true }
    }

    return { success: false, error: "User not found" }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

