'use server'

import { prisma } from '@/lib/prisma'
import { getCurrentUser } from './auth'
import { toClientError } from '@/lib/errors'

/**
 * 获取全局时间设置（准备时间和回答时间）
 * 这些设置对所有面试生效
 */
export async function getGlobalTimingSettings(): Promise<{
  success: boolean
  preparationTime?: number
  responseTime?: number
  error?: string
}> {
  try {
    // 获取全局设置
    const prepTimeSetting = await (prisma as any).systemSettings.findUnique({
      where: { key: 'global_preparation_time' }
    })
    
    const responseTimeSetting = await (prisma as any).systemSettings.findUnique({
      where: { key: 'global_response_time' }
    })

    return {
      success: true,
      preparationTime: prepTimeSetting ? parseInt(prepTimeSetting.value, 10) : 20, // 默认20秒
      responseTime: responseTimeSetting ? parseInt(responseTimeSetting.value, 10) : 90 // 默认90秒
    }
  } catch (error) {
    console.error('[SystemSettings] Error fetching global timing settings:', error)
    return {
      success: false,
      error: toClientError(error)
    }
  }
}

/**
 * 更新全局时间设置（仅 super admin）
 */
export async function updateGlobalTimingSettings(
  preparationTime: number,
  responseTime: number
): Promise<{
  success: boolean
  error?: string
}> {
  try {
    // 验证用户是 super admin
    const userResult = await getCurrentUser()
    if (!userResult.success || !userResult.user) {
      return { success: false, error: 'Not authenticated' }
    }

    if (!userResult.user.school.is_super_admin) {
      return { success: false, error: 'Not authorized. Only super admin can update global settings.' }
    }

    // 验证时间值
    if (preparationTime < 1 || preparationTime > 300) {
      return { success: false, error: 'Preparation time must be between 1 and 300 seconds' }
    }

    if (responseTime < 1 || responseTime > 600) {
      return { success: false, error: 'Response time must be between 1 and 600 seconds' }
    }

    // 使用 upsert 创建或更新设置
    await (prisma as any).systemSettings.upsert({
      where: { key: 'global_preparation_time' },
      update: { value: preparationTime.toString() },
      create: {
        key: 'global_preparation_time',
        value: preparationTime.toString(),
        description: 'Global preparation time for all interview prompts (in seconds)'
      }
    })

    await (prisma as any).systemSettings.upsert({
      where: { key: 'global_response_time' },
      update: { value: responseTime.toString() },
      create: {
        key: 'global_response_time',
        value: responseTime.toString(),
        description: 'Global response time for all interview prompts (in seconds)'
      }
    })

    return { success: true }
  } catch (error) {
    console.error('[SystemSettings] Error updating global timing settings:', error)
    return {
      success: false,
      error: toClientError(error)
    }
  }
}

const PARENT_PREP_KEY = 'parent_preparation_time'
const PARENT_RESPONSE_KEY = 'parent_response_time'

/**
 * Parent interview timing. By default parent interviews use the same structure
 * as student interviews (the global timing above). A super admin may override
 * the parent-specific preparation/response times here; when an override is not
 * set, the corresponding student/global value is returned as the effective value.
 */
export async function getParentTimingSettings(): Promise<{
  success: boolean
  // Effective values actually used by parent interviews (override or student default).
  preparationTime?: number
  responseTime?: number
  // The student/global defaults, for display ("defaults to student: Ns").
  defaultPreparationTime?: number
  defaultResponseTime?: number
  // Whether a parent-specific override is configured.
  hasPrepOverride?: boolean
  hasResponseOverride?: boolean
  error?: string
}> {
  try {
    const global = await getGlobalTimingSettings()
    const defaultPrep = global.preparationTime ?? 20
    const defaultResponse = global.responseTime ?? 90

    const prepSetting = await (prisma as any).systemSettings.findUnique({ where: { key: PARENT_PREP_KEY } })
    const responseSetting = await (prisma as any).systemSettings.findUnique({ where: { key: PARENT_RESPONSE_KEY } })

    const hasPrepOverride = Boolean(prepSetting?.value)
    const hasResponseOverride = Boolean(responseSetting?.value)

    return {
      success: true,
      preparationTime: hasPrepOverride ? parseInt(prepSetting.value, 10) : defaultPrep,
      responseTime: hasResponseOverride ? parseInt(responseSetting.value, 10) : defaultResponse,
      defaultPreparationTime: defaultPrep,
      defaultResponseTime: defaultResponse,
      hasPrepOverride,
      hasResponseOverride,
    }
  } catch (error) {
    console.error('[SystemSettings] Error fetching parent timing settings:', error)
    return { success: false, error: toClientError(error) }
  }
}

/**
 * Update parent interview timing (super admin only). Pass null/undefined for a
 * field to clear the override so it falls back to the student/global default.
 */
export async function updateParentTimingSettings(
  preparationTime: number | null,
  responseTime: number | null
): Promise<{ success: boolean; error?: string }> {
  try {
    const userResult = await getCurrentUser()
    if (!userResult.success || !userResult.user) {
      return { success: false, error: 'Not authenticated' }
    }
    if (!userResult.user.school.is_super_admin) {
      return { success: false, error: 'Not authorized. Only super admin can update parent interview settings.' }
    }

    if (preparationTime !== null && (preparationTime < 1 || preparationTime > 300)) {
      return { success: false, error: 'Preparation time must be between 1 and 300 seconds' }
    }
    if (responseTime !== null && (responseTime < 1 || responseTime > 600)) {
      return { success: false, error: 'Response time must be between 1 and 600 seconds' }
    }

    if (preparationTime === null) {
      await (prisma as any).systemSettings.deleteMany({ where: { key: PARENT_PREP_KEY } })
    } else {
      await (prisma as any).systemSettings.upsert({
        where: { key: PARENT_PREP_KEY },
        update: { value: preparationTime.toString() },
        create: {
          key: PARENT_PREP_KEY,
          value: preparationTime.toString(),
          description: 'Preparation time for parent interviews (in seconds). Defaults to student timing when unset.',
        },
      })
    }

    if (responseTime === null) {
      await (prisma as any).systemSettings.deleteMany({ where: { key: PARENT_RESPONSE_KEY } })
    } else {
      await (prisma as any).systemSettings.upsert({
        where: { key: PARENT_RESPONSE_KEY },
        update: { value: responseTime.toString() },
        create: {
          key: PARENT_RESPONSE_KEY,
          value: responseTime.toString(),
          description: 'Response time for parent interviews (in seconds). Defaults to student timing when unset.',
        },
      })
    }

    return { success: true }
  } catch (error) {
    console.error('[SystemSettings] Error updating parent timing settings:', error)
    return { success: false, error: toClientError(error) }
  }
}

