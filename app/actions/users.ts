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
  contact_person: string | null
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

/**
 * 获取所有用户列表（仅超级管理员）
 */
export async function listUsers(): Promise<{
  success: boolean
  users?: ManagedUser[]
  error?: string
}> {
  try {
    await ensureSuperAdmin()

    const users = await prisma.school.findMany({
      orderBy: {
        created_at: 'desc'
      },
      select: {
        id: true,
        email: true,
        name: true,
        code: true,
        active: true,
        is_super_admin: true,
        contact_person: true,
        created_at: true,
        updated_at: true
      }
    })

    return {
      success: true,
      users: users.map(u => ({
        ...u,
        code: u.code || ''
      })),
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
 */
export async function activateUser(userId: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    await ensureSuperAdmin()

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
 */
export async function deactivateUser(userId: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    await ensureSuperAdmin()

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
 */
export async function resetUserPassword(userId: string, newPassword: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    await ensureSuperAdmin()

    const user = await prisma.school.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return { success: false, error: "User not found" }
    }

    if (user.is_super_admin) {
      return { success: false, error: "Cannot reset super admin password" }
    }

    const hashedPassword = await hashPassword(newPassword)

    await prisma.school.update({
      where: { id: userId },
      data: { password_hash: hashedPassword }
    })

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

