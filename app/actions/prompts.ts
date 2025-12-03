'use server'

import { prisma } from '@/lib/prisma'
import { getCurrentUser } from './auth'

export interface PromptRecord {
  id: string
  category: string
  prompt_text: string
  preparation_time: number | null
  response_time: number | null
  difficulty_level: string | null
  is_active: boolean | null
  school_id: string | null
  created_at: string
}

/**
 * 获取学校的所有题目（包括系统默认和自定义）
 */
export async function getSchoolPrompts(schoolId: string): Promise<{
  success: boolean
  prompts?: PromptRecord[]
  error?: string
}> {
  try {
    // 获取学校自定义的题目
    const customPrompts = await prisma.prompt.findMany({
      where: { school_id: schoolId },
      orderBy: { created_at: 'desc' }
    })

    // 获取系统默认题目（school_id 为 null）
    const defaultPrompts = await prisma.prompt.findMany({
      where: { school_id: null },
      orderBy: { created_at: 'desc' }
    })

    const allPrompts = [...defaultPrompts, ...customPrompts].map(p => ({
      id: p.id,
      category: p.category,
      prompt_text: p.prompt_text,
      preparation_time: p.preparation_time,
      response_time: p.response_time,
      difficulty_level: p.difficulty_level,
      is_active: p.is_active,
      school_id: p.school_id,
      created_at: p.created_at.toISOString()
    }))

    return { success: true, prompts: allPrompts }
  } catch (error) {
    console.error('[Prompts] Error fetching prompts:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * 获取学校选中的题目ID列表
 */
export async function getSelectedPromptIds(): Promise<{
  success: boolean
  promptIds?: string[]
  error?: string
}> {
  try {
    const userResult = await getCurrentUser()
    if (!userResult.success || !userResult.user) {
      return { success: false, error: 'Not authenticated' }
    }

    const school = await prisma.school.findUnique({
      where: { id: userResult.user.school.id },
      select: { selected_prompt_ids: true }
    })

    if (!school) {
      return { success: false, error: 'School not found' }
    }

    return { success: true, promptIds: school.selected_prompt_ids || [] }
  } catch (error) {
    console.error('[Prompts] Error fetching selected prompts:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * 更新学校选中的题目（必须正好4个）
 */
export async function updateSelectedPrompts(promptIds: string[]): Promise<{
  success: boolean
  error?: string
}> {
  try {
    if (promptIds.length !== 4) {
      return { success: false, error: 'Must select exactly 4 prompts' }
    }

    const userResult = await getCurrentUser()
    if (!userResult.success || !userResult.user) {
      return { success: false, error: 'Not authenticated' }
    }

    // 验证所有题目ID都存在
    const prompts = await prisma.prompt.findMany({
      where: { id: { in: promptIds } }
    })

    if (prompts.length !== 4) {
      return { success: false, error: 'Some prompts not found' }
    }

    // 更新学校配置
    await prisma.school.update({
      where: { id: userResult.user.school.id },
      data: { selected_prompt_ids: promptIds }
    })

    return { success: true }
  } catch (error) {
    console.error('[Prompts] Error updating selected prompts:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * 创建自定义题目
 */
export async function createPrompt(data: {
  category: string
  prompt_text: string
  preparation_time?: number
  response_time?: number
  difficulty_level?: string
}): Promise<{
  success: boolean
  prompt?: PromptRecord
  error?: string
}> {
  try {
    const userResult = await getCurrentUser()
    if (!userResult.success || !userResult.user) {
      return { success: false, error: 'Not authenticated' }
    }

    const prompt = await prisma.prompt.create({
      data: {
        school_id: userResult.user.school.id,
        category: data.category,
        prompt_text: data.prompt_text,
        preparation_time: data.preparation_time || 20,
        response_time: data.response_time || 90,
        difficulty_level: data.difficulty_level || 'medium',
        is_active: true
      }
    })

    return {
      success: true,
      prompt: {
        id: prompt.id,
        category: prompt.category,
        prompt_text: prompt.prompt_text,
        preparation_time: prompt.preparation_time,
        response_time: prompt.response_time,
        difficulty_level: prompt.difficulty_level,
        is_active: prompt.is_active,
        school_id: prompt.school_id,
        created_at: prompt.created_at.toISOString()
      }
    }
  } catch (error) {
    console.error('[Prompts] Error creating prompt:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * 根据学校代码获取选中的题目（用于学生面试页面）
 */
export async function getPromptsBySchoolCode(schoolCode: string): Promise<{
  success: boolean
  prompts?: Array<{
    id: string
    category: string
    text: string
    preparationTime: number
    responseTime: number
  }>
  error?: string
}> {
  try {
    const school = await prisma.school.findUnique({
      where: { code: schoolCode },
      select: { selected_prompt_ids: true }
    })

    if (!school || !school.selected_prompt_ids || school.selected_prompt_ids.length === 0) {
      return { success: false, error: 'No prompts configured for this school' }
    }

    const prompts = await prisma.prompt.findMany({
      where: { id: { in: school.selected_prompt_ids } },
      orderBy: { created_at: 'asc' }
    })

    if (prompts.length !== 4) {
      return { success: false, error: 'School must have exactly 4 prompts configured' }
    }

    return {
      success: true,
      prompts: prompts.map(p => ({
        id: p.id,
        category: p.category,
        text: p.prompt_text,
        preparationTime: p.preparation_time || 20,
        responseTime: p.response_time || 90
      }))
    }
  } catch (error) {
    console.error('[Prompts] Error fetching prompts by school code:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

