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

    let selectedIds = school.selected_prompt_ids || []

    // 如果没有选中任何题目，自动选择默认的 4 个
    if (selectedIds.length === 0) {
      const defaultPrompts = await prisma.prompt.findMany({
        where: { school_id: null, is_active: true },
        take: 4,
        select: { id: true },
        orderBy: { created_at: 'asc' }
      })
      
      if (defaultPrompts.length > 0) {
        selectedIds = defaultPrompts.map(p => p.id)
        // 自动保存到数据库
        await prisma.school.update({
          where: { id: userResult.user.school.id },
          data: { selected_prompt_ids: selectedIds }
        })
      }
    }

    return { success: true, promptIds: selectedIds }
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
 * 删除自定义题目（只能删除学校自己的题目）
 */
export async function deletePrompt(promptId: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const userResult = await getCurrentUser()
    if (!userResult.success || !userResult.user) {
      return { success: false, error: 'Not authenticated' }
    }

    // 检查题目是否存在且属于当前学校
    const prompt = await prisma.prompt.findUnique({
      where: { id: promptId }
    })

    if (!prompt) {
      return { success: false, error: 'Prompt not found' }
    }

    // 不能删除系统默认题目（school_id 为 null）
    if (!prompt.school_id) {
      return { success: false, error: 'Cannot delete system default prompts' }
    }

    // 只能删除自己学校的题目
    if (prompt.school_id !== userResult.user.school.id && !userResult.user.school.is_super_admin) {
      return { success: false, error: 'Not authorized to delete this prompt' }
    }

    // 检查该题目是否被学校选中，如果选中则先从选中列表中移除
    const school = await prisma.school.findUnique({
      where: { id: userResult.user.school.id },
      select: { selected_prompt_ids: true }
    })

    if (school?.selected_prompt_ids?.includes(promptId)) {
      // 从选中列表中移除该题目
      const updatedPromptIds = school.selected_prompt_ids.filter((id: string) => id !== promptId)
      
      // 如果移除后少于4个，需要更新数据库
      // 注意：这里允许少于4个，因为用户可能正在删除题目后重新选择
      await prisma.school.update({
        where: { id: userResult.user.school.id },
        data: { selected_prompt_ids: updatedPromptIds }
      })
    }

    // 删除题目
    await prisma.prompt.delete({
      where: { id: promptId }
    })

    return { success: true }
  } catch (error) {
    console.error('[Prompts] Error deleting prompt:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * 根据学校代码获取选中的题目（用于学生面试页面）
 * 使用全局时间设置覆盖 prompt 的默认时间
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
    // 先获取全局时间设置
    const globalTimingSettings = await (prisma as any).systemSettings.findMany({
      where: {
        key: { in: ['global_preparation_time', 'global_response_time'] }
      }
    })

    const globalPrepTime = globalTimingSettings.find((s: { key: string; value: string }) => s.key === 'global_preparation_time')
    const globalResponseTime = globalTimingSettings.find((s: { key: string; value: string }) => s.key === 'global_response_time')
    
    const defaultPrepTime = globalPrepTime ? parseInt(globalPrepTime.value, 10) : 20
    const defaultResponseTime = globalResponseTime ? parseInt(globalResponseTime.value, 10) : 90

    const school = await prisma.school.findUnique({
      where: { code: schoolCode },
      select: { selected_prompt_ids: true }
    })

    if (!school) {
      return { success: false, error: 'School not found' }
    }

    let promptIds = school.selected_prompt_ids || []
    
    // 如果没有选中的题目，尝试使用默认题目
    if (promptIds.length === 0) {
       const defaultPrompts = await prisma.prompt.findMany({
        where: { school_id: null, is_active: true },
        take: 4,
        select: { id: true },
        orderBy: { created_at: 'asc' }
      })
      promptIds = defaultPrompts.map(p => p.id)
    }

    if (promptIds.length === 0) {
      return { success: false, error: 'No prompts configured for this school' }
    }

    const prompts = await prisma.prompt.findMany({
      where: { id: { in: promptIds } },
      orderBy: { created_at: 'asc' }
    })

    // 如果数量不足4个，返回错误（除非是默认题目就只有这么多）
    if (prompts.length !== 4 && promptIds.length === 4) {
      return { success: false, error: 'School must have exactly 4 prompts configured' }
    }

    return {
      success: true,
      prompts: prompts.map((p: { id: string; category: string; prompt_text: string; preparation_time: number | null; response_time: number | null }) => ({
        id: p.id,
        category: p.category,
        text: p.prompt_text,
        // 使用全局设置覆盖 prompt 的默认时间
        preparationTime: defaultPrepTime,
        responseTime: defaultResponseTime
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

