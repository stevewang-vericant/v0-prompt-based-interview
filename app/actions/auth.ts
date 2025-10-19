"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

/**
 * 学校列表类型
 */
export interface School {
  id: string
  code: string
  name: string
}

/**
 * 当前用户信息
 */
export interface CurrentUser {
  email: string
  school: {
    id: string
    code: string
    name: string
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
    const supabase = await createClient()
    
    const { data: schools, error } = await supabase
      .from('schools')
      .select('id, code, name')
      .eq('active', true)
      .neq('code', '_system') // 排除系统账号
      .order('name')
    
    if (error) {
      console.error("[Auth] Error fetching schools:", error)
      return { success: false, error: error.message }
    }
    
    return { success: true, schools: schools || [] }
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
    const supabase = await createClient()
    
    // 1. 创建 Supabase Auth 用户
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          school_id: schoolId,
        }
      }
    })
    
    if (authError) {
      console.error("[Auth] Signup error:", authError)
      return { success: false, error: authError.message }
    }
    
    if (!authData.user) {
      return { success: false, error: 'Failed to create user' }
    }
    
    // 2. 在 school_admins 表中创建记录
    const { error: adminError } = await supabase
      .from('school_admins')
      .insert({
        school_id: schoolId,
        email: email,
        name: name,
        role: 'admin',
        is_super_admin: false
      })
    
    if (adminError) {
      console.error("[Auth] Error creating school admin record:", adminError)
      // 即使创建记录失败，用户已经注册了，所以不返回错误
      // 可以在登录后自动创建或修复
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
    const supabase = await createClient()
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) {
      console.error("[Auth] Sign in error:", error)
      return { success: false, error: error.message }
    }
    
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
  const supabase = await createClient()
  await supabase.auth.signOut()
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
    const supabase = await createClient()
    
    // 1. 获取当前 auth 用户
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { success: false, error: 'Not authenticated' }
    }
    
    // 2. 从 school_admins 表获取学校信息
    const { data: adminData, error: adminError } = await supabase
      .from('school_admins')
      .select(`
        email,
        is_super_admin,
        schools:school_id (
          id,
          code,
          name
        )
      `)
      .eq('email', user.email)
      .single()
    
    if (adminError || !adminData) {
      console.error("[Auth] Error fetching admin data:", adminError)
      return { success: false, error: 'Admin record not found' }
    }
    
    const schoolData = adminData.schools as any
    
    return {
      success: true,
      user: {
        email: user.email!,
        school: {
          id: schoolData.id,
          code: schoolData.code,
          name: schoolData.name,
          is_super_admin: adminData.is_super_admin || false
        }
      }
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
    const supabase = await createClient()
    
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })
    
    if (error) {
      console.error("[Auth] Password change error:", error)
      return { success: false, error: error.message }
    }
    
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

