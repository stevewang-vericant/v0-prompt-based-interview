'use server'

import { prisma } from '@/lib/prisma'
import { getCurrentUser } from './auth'

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
      error: error instanceof Error ? error.message : 'Unknown error'
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
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

