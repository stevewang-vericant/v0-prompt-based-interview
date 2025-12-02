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
    // is_super_admin: boolean // 数据库中似乎没有这个字段，暂时移除或硬编码
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
 * 注意：根据 schema，school 表本身就包含了 email/password，看起来每个学校只有一个管理员账号？
 * 或者 invitations/students 是给学生的。
 * 原有的逻辑是 registerSchoolAdmin 往 school_admins 表插数据，但新 schema 只有 schools 表。
 * 假设：schools 表的 email/password 就是管理员账号。
 */
export async function registerSchoolAdmin(
  email: string,
  password: string,
  name: string,
  schoolId: string // 在新 schema 中，可能不再需要 schoolId，如果是创建新学校的话。
                   // 但如果是一个学校有多个管理员，我们需要一个 school_admins 表，但 schema 里没有。
                   // 暂时假设：如果是注册学校管理员，其实是创建或更新 School 记录？
                   // 或者现有的逻辑是：Admin 属于某个 School。
): Promise<{
  success: boolean
  error?: string
}> {
  // ⚠️ 重要：Schema 不匹配
  // 原有代码依赖 `school_admins` 表，但 SQL schema 中没有这张表。
  // SQL schema 中只有 `schools` 表有 email/password。
  // 这意味着每个学校只有一个登录账号（即学校本身）。
  
  // 如果我们想保持原有逻辑（多管理员），我们需要修改 Schema。
  // 但为了快速迁移，我们假设现在是“更新学校的登录信息”或者“创建新学校”。
  
  // 既然是 migrate，我们先按照 Schema 来：
  // 假设注册就是创建一个新的 School 记录，或者更新已存在的 School。
  
  // 让我们暂时实现为：创建一个新的 School (如果这符合业务逻辑)
  // 或者，如果 schoolId 已经存在，我们更新它的 email/password。
  
  try {
    // 检查 email 是否已存在
    const existingSchool = await prisma.school.findUnique({
      where: { email }
    })

    if (existingSchool) {
      return { success: false, error: "Email already registered" }
    }

    const hashedPassword = await hashPassword(password)

    // 这里有一个逻辑断层：原有的 registerSchoolAdmin 接收 schoolId，意味着学校已存在。
    // 我们更新这个学校的管理员信息？
    if (schoolId) {
      await prisma.school.update({
        where: { id: schoolId },
        data: {
          email,
          password_hash: hashedPassword,
          // name: name // name 可能是管理员名字，但 School 表只有 school name。
          // 暂时忽略 name 字段，或者存到 contact_person
          contact_person: name
        }
      })
    } else {
       // Create new school logic if needed
       return { success: false, error: "School ID is required" }
    }
    
    console.log("[Auth] School admin registered successfully:", email)
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
 */
export async function signIn(
  email: string,
  password: string
): Promise<{
  success: boolean
  error?: string
}> {
  try {
    // 1. 查找用户 (School)
    const school = await prisma.school.findUnique({
      where: { email }
    })

    if (!school) {
      return { success: false, error: "Invalid email or password" }
    }

    // 2. 验证密码
    const isValid = await verifyPassword(password, school.password_hash)

    if (!isValid) {
      return { success: false, error: "Invalid email or password" }
    }

    // 3. 创建 Session (JWT Cookie)
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
    
    console.log("[Auth] Sign in successful:", email)
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
 * 登出
 */
export async function signOut() {
  const cookieStore = await cookies()
  cookieStore.delete('session')
  redirect('/school/login')
}

/**
 * 获取当前登录用户信息
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
      
      // 获取最新的用户信息
      const school = await prisma.school.findUnique({
        where: { id: payload.sub as string },
        select: { id: true, name: true, email: true }
      })

      if (!school) {
        return { success: false, error: 'User not found' }
      }

      return {
        success: true,
        user: {
          email: school.email,
          school: {
            id: school.id,
            name: school.name,
            // is_super_admin: false
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
 */
export async function changePassword(
  newPassword: string
): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const { user } = await getCurrentUser()
    if (!user) return { success: false, error: "Not authenticated" }

    const hashedPassword = await hashPassword(newPassword)

    await prisma.school.update({
      where: { email: user.email },
      data: { password_hash: hashedPassword }
    })
    
    console.log("[Auth] Password changed successfully")
    return { success: true }
  } catch (error) {
    console.error("[Auth] Unexpected error:", error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

