"use server"

import { prisma } from "@/lib/prisma"
import { hashPassword, verifyPassword } from "@/lib/auth-utils"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { SignJWT, jwtVerify } from "jose"
import crypto from "crypto"
import { sendPasswordResetEmail, sendSignupApprovalNotificationEmail } from "@/lib/email"

// 简单的 Session 管理，使用 JWT 存储在 HttpOnly Cookie 中
const SECRET_KEY = new TextEncoder().encode(process.env.AUTH_SECRET || "default_secret_key_change_me")
const ALG = "HS256"

// Password reset token expiration time (1 hour)
const RESET_TOKEN_EXPIRATION_HOURS = 1

function getSignupApprovalNotificationRecipients(): string[] {
  const rawRecipients = process.env.SIGNUP_APPROVAL_NOTIFICATION_RECIPIENTS || ""

  return Array.from(
    new Set(
      rawRecipients
        .split(/[;,]/)
        .map((email) => email.trim())
        .filter(Boolean)
    )
  )
}

async function notifySignupApprovalRecipients(params: {
  requesterName?: string | null
  requesterEmail: string
  schoolName: string
}) {
  const recipients = getSignupApprovalNotificationRecipients()

  if (recipients.length === 0) {
    console.log("[Auth] Signup approval notification skipped: no recipients configured")
    return
  }

  const appUrl = process.env.APP_URL || "http://localhost:3000"

  try {
    await sendSignupApprovalNotificationEmail(recipients, {
      requesterName: params.requesterName,
      requesterEmail: params.requesterEmail,
      schoolName: params.schoolName,
      approvalUrl: `${appUrl}/school/users`,
    })
  } catch (error) {
    console.error("[Auth] Failed to send signup approval notification:", error)
  }
}

/**
 * 学校列表类型
 */
export interface School {
  id: string
  name: string
  level: string
  email: string | null // Deprecated legacy login email; nullable in the schema
}

/**
 * 当前用户信息
 */
export interface CurrentUser {
  email: string
  is_rater: boolean
  school: {
    id: string
    name: string
    code: string | null
    is_super_admin: boolean
    credits_balance: number
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
      where: {
        NOT: {
          code: "_system"
        }
      },
      select: {
        id: true,
        name: true,
        level: true,
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

    console.log("[Auth] Attempting to create SchoolAdmin:", { email, schoolId, schoolName: school.name })
    
    const newAdmin = await prisma.schoolAdmin.create({
      data: {
        school_id: schoolId,
        email,
        password_hash: hashedPassword,
        name: name || null,
        active: false, // 新注册的账号默认未激活，需要超级管理员审批
        is_super_admin: false
      }
    })
    
    console.log("[Auth] School admin registered successfully:", { email, adminId: newAdmin.id, school: school.name })
    await notifySignupApprovalRecipients({
      requesterName: newAdmin.name,
      requesterEmail: newAdmin.email,
      schoolName: school.name,
    })

    return { success: true }
  } catch (error) {
    console.error("[Auth] Unexpected error during registration:", error)
    console.error("[Auth] Error details:", {
      message: error instanceof Error ? error.message : 'Unknown error',
      code: (error as any)?.code,
      meta: (error as any)?.meta
    })
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

      await prisma.schoolAdmin.update({
        where: { id: admin.id },
        data: { last_login_at: new Date() },
      })

      // 创建 Session（包含 admin_id，表示新账号）
      const token = await new SignJWT({ 
        sub: admin.school_id, 
        admin_id: admin.id,
        email: admin.email,
        role: 'school_admin',
        is_rater: admin.is_rater
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

      await prisma.school.update({
        where: { id: school.id },
        data: { last_login_at: new Date() },
      })

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
            is_rater: admin.is_rater,
            school: {
              id: admin.school.id,
              name: admin.school.name,
              code: admin.school.code,
              is_super_admin: admin.is_super_admin,
              credits_balance: admin.school.credits_balance
            }
          }
        }
      }

      // 如果没有 admin_id，说明是旧账号（School，向后兼容）
      const school = await prisma.school.findUnique({
        where: { id: schoolId },
        select: {
          id: true,
          name: true,
          code: true,
          email: true,
          is_super_admin: true,
          is_rater: true,
          credits_balance: true,
        }
      })

      if (!school || !school.email) {
        return { success: false, error: 'User not found' }
      }

      return {
        success: true,
        user: {
          email: school.email,
          is_rater: school.is_rater,
          school: {
            id: school.id,
            name: school.name,
            code: school.code,
            is_super_admin: school.is_super_admin,
            credits_balance: school.credits_balance
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

/**
 * 请求密码重置
 * 支持两种账号类型：SchoolAdmin（新账号）和 School（旧账号，向后兼容）
 * 无论邮箱是否存在，都返回相同的成功消息（安全考虑）
 */
export async function requestPasswordReset(
  email: string
): Promise<{
  success: boolean
  error?: string
}> {
  try {
    // Normalize email
    const normalizedEmail = email.toLowerCase().trim()

    // 1. 查找用户（先查 SchoolAdmin，再查 School）
    let userId: string | null = null
    let userType: 'school_admin' | 'school' | null = null

    // 首先查找 SchoolAdmin（新账号）
    const admin = await prisma.schoolAdmin.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, active: true }
    })

    if (admin) {
      // 只有已激活的账号才能重置密码
      if (!admin.active) {
        // 返回成功但不发送邮件（账号未激活）
        console.log("[Auth] Password reset requested for inactive account:", normalizedEmail)
        return { success: true }
      }
      userId = admin.id
      userType = 'school_admin'
    } else {
      // 查找 School（旧账号，向后兼容）
      const school = await prisma.school.findUnique({
        where: { email: normalizedEmail },
        select: { id: true, active: true }
      })

      if (school) {
        if (!school.active) {
          console.log("[Auth] Password reset requested for inactive school:", normalizedEmail)
          return { success: true }
        }
        userId = school.id
        userType = 'school'
      }
    }

    // 如果用户不存在，仍返回成功（不透露用户是否存在）
    if (!userId || !userType) {
      console.log("[Auth] Password reset requested for non-existent email:", normalizedEmail)
      return { success: true }
    }

    // 2. 生成 64 字符随机 token
    const resetToken = crypto.randomBytes(32).toString('hex')

    // 3. 删除该邮箱之前未使用的重置令牌
    await prisma.passwordResetToken.deleteMany({
      where: {
        email: normalizedEmail,
        used: false
      }
    })

    // 4. 创建新的重置令牌记录（1小时有效期）
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + RESET_TOKEN_EXPIRATION_HOURS)

    await prisma.passwordResetToken.create({
      data: {
        token: resetToken,
        email: normalizedEmail,
        user_type: userType,
        user_id: userId,
        expires_at: expiresAt
      }
    })

    // 5. 发送重置邮件
    try {
      await sendPasswordResetEmail(normalizedEmail, resetToken)
      console.log("[Auth] Password reset email sent to:", normalizedEmail)
    } catch (emailError) {
      console.error("[Auth] Failed to send password reset email:", emailError)
      // 删除刚创建的令牌
      await prisma.passwordResetToken.deleteMany({
        where: { token: resetToken }
      })
      return { success: false, error: "Failed to send reset email. Please try again later." }
    }

    return { success: true }
  } catch (error) {
    console.error("[Auth] Unexpected error during password reset request:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * 验证重置令牌
 */
export async function verifyResetToken(
  token: string
): Promise<{
  success: boolean
  valid: boolean
  error?: string
}> {
  try {
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token }
    })

    // 检查令牌是否存在
    if (!resetToken) {
      return { success: true, valid: false, error: "Invalid or expired reset link" }
    }

    // 检查是否已使用
    if (resetToken.used) {
      return { success: true, valid: false, error: "This reset link has already been used" }
    }

    // 检查是否过期
    if (new Date() > resetToken.expires_at) {
      return { success: true, valid: false, error: "This reset link has expired" }
    }

    return { success: true, valid: true }
  } catch (error) {
    console.error("[Auth] Unexpected error during token verification:", error)
    return {
      success: false,
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * 重置密码（使用令牌）
 */
export async function resetPasswordWithToken(
  token: string,
  newPassword: string
): Promise<{
  success: boolean
  error?: string
}> {
  try {
    // 1. 验证令牌
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token }
    })

    if (!resetToken) {
      return { success: false, error: "Invalid or expired reset link" }
    }

    if (resetToken.used) {
      return { success: false, error: "This reset link has already been used" }
    }

    if (new Date() > resetToken.expires_at) {
      return { success: false, error: "This reset link has expired" }
    }

    // 2. 更新用户密码
    const hashedPassword = await hashPassword(newPassword)

    if (resetToken.user_type === 'school_admin') {
      await prisma.schoolAdmin.update({
        where: { id: resetToken.user_id },
        data: { password_hash: hashedPassword }
      })
    } else {
      await prisma.school.update({
        where: { id: resetToken.user_id },
        data: { password_hash: hashedPassword }
      })
    }

    // 3. 标记令牌为已使用
    await prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { used: true }
    })

    // 4. 删除该用户所有未使用的重置令牌（清理）
    await prisma.passwordResetToken.deleteMany({
      where: {
        email: resetToken.email,
        used: false
      }
    })

    console.log("[Auth] Password reset successfully for:", resetToken.email)
    return { success: true }
  } catch (error) {
    console.error("[Auth] Unexpected error during password reset:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

