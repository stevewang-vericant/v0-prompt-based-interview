"use server"

import { prisma } from "@/lib/prisma"
import { hashPassword, verifyPassword } from "@/lib/auth-utils"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { SignJWT, jwtVerify } from "jose"

// 简单的 Session 管理，使用 JWT 存储在 HttpOnly Cookie 中
const SECRET_KEY = new TextEncoder().encode(process.env.AUTH_SECRET || "default_secret_key_change_me")
const ALG = "HS256"

/**
 * 学校列表类型
 */
export interface School {
  id: string
  name: string
  email: string // Added email as it's in the schema
}

/**
 * 当前用户信息
 */
export interface CurrentUser {
  email: string
  school: {
    id: string
    name: string
    code: string | null
    is_super_admin: boolean
  }
}

/**
 * 获取所有学校列表（用于注册时选择）
 */
export async function getSchools(): Promise<{
  success: boolean
  schools?: School[]
  error?: string
}> {
  try {
    const schools = await prisma.school.findMany({
      select: {
        id: true,
        name: true,
        email: true
      },
      orderBy: {
        name: 'asc'
      }
    })
    
    return { success: true, schools }
  } catch (error) {
    console.error("[Auth] Unexpected error:", error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * 注册新的学校管理员
 * 支持每个学校多个管理员账号
 */
export async function registerSchoolAdmin(
  email: string,
  password: string,
  name: string,
  schoolId: string
): Promise<{
  success: boolean
  error?: string
}> {
  try {
    // 1. 检查学校是否存在
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      select: { id: true, name: true }
    })

    if (!school) {
      return { success: false, error: "School not found" }
    }

    // 2. 检查 email 是否已被注册（在 SchoolAdmin 表中）
    const existingAdmin = await prisma.schoolAdmin.findUnique({
      where: { email }
    })

    if (existingAdmin) {
      return { success: false, error: "Email already registered" }
    }

    // 3. 检查是否在 School 表中也有这个 email（向后兼容检查）
    const existingSchoolWithEmail = await prisma.school.findUnique({
      where: { email }
    })

    if (existingSchoolWithEmail) {
      return { success: false, error: "Email already registered" }
    }

    // 4. 创建新的管理员账号
    const hashedPassword = await hashPassword(password)

    await prisma.schoolAdmin.create({
      data: {
        school_id: schoolId,
        email,
        password_hash: hashedPassword,
        name: name || null,
        active: false, // 新注册的账号默认未激活，需要超级管理员审批
        is_super_admin: false
      }
    })
    
    console.log("[Auth] School admin registered successfully:", email, "for school:", school.name)
    return { success: true }
  } catch (error) {
    console.error("[Auth] Unexpected error:", error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * 登录
 * 支持双重查找：先查找 SchoolAdmin（新账号），再查找 School（旧账号，向后兼容）
 */
export async function signIn(
  email: string,
  password: string
): Promise<{
  success: boolean
  error?: string
}> {
  try {
    // 1. 首先查找 SchoolAdmin（新账号）
    const admin = await prisma.schoolAdmin.findUnique({
      where: { email },
      include: { school: true }
    })

    if (admin) {
      // 新账号认证流程
      if (!admin.active) {
        return { success: false, error: "Your account is pending approval. Please wait for administrator activation." }
      }

      const isValid = await verifyPassword(password, admin.password_hash)
      if (!isValid) {
        return { success: false, error: "Invalid email or password" }
      }

      // 创建 Session（包含 admin_id，表示新账号）
      const token = await new SignJWT({ 
        sub: admin.school_id, 
        admin_id: admin.id,
        email: admin.email,
        role: 'school_admin'
      })
        .setProtectedHeader({ alg: ALG })
        .setExpirationTime('24h')
        .sign(SECRET_KEY)

      const cookieStore = await cookies()
      cookieStore.set('session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24, // 24 hours
        path: '/'
      })
      
      console.log("[Auth] Sign in successful (SchoolAdmin):", email)
      return { success: true }
    }

    // 2. 查找 School（旧账号，向后兼容）
    const school = await prisma.school.findUnique({
      where: { email }
    })

    if (school && school.email && school.password_hash) {
      // 旧账号认证流程（完全保持原有逻辑）
      if (!school.active) {
        return { success: false, error: "Your account is pending approval. Please wait for administrator activation." }
      }

      const isValid = await verifyPassword(password, school.password_hash)
      if (!isValid) {
        return { success: false, error: "Invalid email or password" }
      }

      // 创建 Session（不包含 admin_id，表示旧账号）
      const token = await new SignJWT({ 
        sub: school.id, 
        email: school.email,
        role: 'school_admin'
      })
        .setProtectedHeader({ alg: ALG })
        .setExpirationTime('24h')
        .sign(SECRET_KEY)

      const cookieStore = await cookies()
      cookieStore.set('session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24, // 24 hours
        path: '/'
      })
      
      console.log("[Auth] Sign in successful (School):", email)
      return { success: true }
    }

    // 3. 都没找到
    return { success: false, error: "Invalid email or password" }
  } catch (error) {
    console.error("[Auth] Unexpected error:", error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * 登出
 */
export async function signOut() {
  const cookieStore = await cookies()
  cookieStore.delete('session')
  redirect('/school/login')
}

/**
 * 获取当前登录用户信息
 * 支持两种账号类型：SchoolAdmin（新账号）和 School（旧账号，向后兼容）
 */
export async function getCurrentUser(): Promise<{
  success: boolean
  user?: CurrentUser
  error?: string
}> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('session')?.value

    if (!token) {
      return { success: false, error: 'Not authenticated' }
    }

    try {
      const { payload } = await jwtVerify(token, SECRET_KEY)
      const schoolId = payload.sub as string
      const adminId = (payload as any).admin_id as string | undefined
      
      // 如果有 admin_id，说明是新账号（SchoolAdmin）
      if (adminId) {
        const admin = await prisma.schoolAdmin.findUnique({
          where: { id: adminId },
          include: { school: true }
        })

        if (!admin || !admin.school) {
          return { success: false, error: 'User not found' }
        }

        return {
          success: true,
          user: {
            email: admin.email,
            school: {
              id: admin.school.id,
              name: admin.school.name,
              code: admin.school.code,
              is_super_admin: admin.is_super_admin
            }
          }
        }
      }

      // 如果没有 admin_id，说明是旧账号（School，向后兼容）
      const school = await prisma.school.findUnique({
        where: { id: schoolId },
        select: { id: true, name: true, code: true, email: true, is_super_admin: true }
      })

      if (!school || !school.email) {
        return { success: false, error: 'User not found' }
      }

      return {
        success: true,
        user: {
          email: school.email,
          school: {
            id: school.id,
            name: school.name,
            code: school.code,
            is_super_admin: school.is_super_admin
          }
        }
      }
    } catch (err) {
      return { success: false, error: 'Invalid token' }
    }
  } catch (error) {
    console.error("[Auth] Unexpected error:", error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * 修改密码
 * 支持两种账号类型：SchoolAdmin（新账号）和 School（旧账号，向后兼容）
 */
export async function changePassword(
  newPassword: string
): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('session')?.value

    if (!token) {
      return { success: false, error: "Not authenticated" }
    }

    try {
      const { payload } = await jwtVerify(token, SECRET_KEY)
      const adminId = (payload as any).admin_id as string | undefined
      const email = payload.email as string

      const hashedPassword = await hashPassword(newPassword)

      // 如果有 admin_id，说明是新账号（SchoolAdmin）
      if (adminId) {
        await prisma.schoolAdmin.update({
          where: { id: adminId },
          data: { password_hash: hashedPassword }
        })
      } else {
        // 如果没有 admin_id，说明是旧账号（School，向后兼容）
        await prisma.school.update({
          where: { email },
          data: { password_hash: hashedPassword }
        })
      }
      
      console.log("[Auth] Password changed successfully")
      return { success: true }
    } catch (err) {
      return { success: false, error: 'Invalid token' }
    }
  } catch (error) {
    console.error("[Auth] Unexpected error:", error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

