'use server'

import { prisma } from '@/lib/prisma'
import { getCurrentUser } from './auth'
import { toClientError } from '@/lib/errors'
import { translateText } from '@/lib/translate'

export interface ParentPromptRecord {
  id: string
  category: string
  prompt_text: string
  preparation_time: number | null
  response_time: number | null
  school_id: string | null
  created_at: string
}

// Parent interviews allow a flexible number of configured questions.
const MIN_PARENT_PROMPTS = 1
const MAX_PARENT_PROMPTS = 8

/**
 * Get the school's parent-interview questions (custom + any system defaults).
 */
export async function getSchoolParentPrompts(schoolId: string): Promise<{
  success: boolean
  prompts?: ParentPromptRecord[]
  error?: string
}> {
  try {
    const customPrompts = await prisma.prompt.findMany({
      where: { school_id: schoolId, prompt_type: 'parent' },
      orderBy: { created_at: 'desc' },
    })

    const defaultPrompts = await prisma.prompt.findMany({
      where: { school_id: null, prompt_type: 'parent' },
      orderBy: { created_at: 'desc' },
    })

    // The free-speech segment is auto-appended to every parent interview and is
    // persisted as a prompt row on upload; it must never appear as a selectable
    // question in Settings.
    const FREE_SPEECH_TEXT = 'This is your free speech time. You can say anything you want.'
    const isFreeSpeech = (p: { category: string; prompt_text: string }) =>
      p.category === 'Free Speech' || p.prompt_text === FREE_SPEECH_TEXT

    const allPrompts = [...defaultPrompts, ...customPrompts].filter((p) => !isFreeSpeech(p)).map((p) => ({
      id: p.id,
      category: p.category,
      prompt_text: p.prompt_text,
      preparation_time: p.preparation_time,
      response_time: p.response_time,
      school_id: p.school_id,
      created_at: p.created_at.toISOString(),
    }))

    return { success: true, prompts: allPrompts }
  } catch (error) {
    console.error('[ParentPrompts] Error fetching prompts:', error)
    return { success: false, error: toClientError(error) }
  }
}

/**
 * Get the currently selected parent-question IDs for the authenticated school.
 */
export async function getSelectedParentPromptIds(): Promise<{
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
      select: { parent_selected_prompt_ids: true },
    })

    if (!school) {
      return { success: false, error: 'School not found' }
    }

    let selectedIds = school.parent_selected_prompt_ids || []

    // If the school has not chosen any parent questions yet, default to the first
    // 4 system-default parent questions (mirrors the student interview behavior)
    // and persist the choice so it stays stable.
    if (selectedIds.length === 0) {
      const defaultPrompts = await prisma.prompt.findMany({
        where: { school_id: null, prompt_type: 'parent', is_active: true },
        take: 4,
        select: { id: true },
        orderBy: { created_at: 'asc' },
      })
      if (defaultPrompts.length > 0) {
        selectedIds = defaultPrompts.map((p) => p.id)
        await prisma.school.update({
          where: { id: userResult.user.school.id },
          data: { parent_selected_prompt_ids: selectedIds },
        })
      }
    }

    return { success: true, promptIds: selectedIds }
  } catch (error) {
    console.error('[ParentPrompts] Error fetching selected prompts:', error)
    return { success: false, error: toClientError(error) }
  }
}

/**
 * Update the selected parent questions. Unlike student prompts (fixed at 4),
 * parent interviews allow between 1 and 8 questions.
 */
export async function updateSelectedParentPrompts(promptIds: string[]): Promise<{
  success: boolean
  error?: string
}> {
  try {
    if (promptIds.length < MIN_PARENT_PROMPTS || promptIds.length > MAX_PARENT_PROMPTS) {
      return {
        success: false,
        error: `Please select between ${MIN_PARENT_PROMPTS} and ${MAX_PARENT_PROMPTS} parent questions`,
      }
    }

    const userResult = await getCurrentUser()
    if (!userResult.success || !userResult.user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Verify all selected prompts exist and are parent-type.
    const prompts = await prisma.prompt.findMany({
      where: { id: { in: promptIds }, prompt_type: 'parent' },
      select: { id: true },
    })

    if (prompts.length !== promptIds.length) {
      return { success: false, error: 'Some selected questions are invalid' }
    }

    await prisma.school.update({
      where: { id: userResult.user.school.id },
      data: { parent_selected_prompt_ids: promptIds },
    })

    return { success: true }
  } catch (error) {
    console.error('[ParentPrompts] Error updating selected prompts:', error)
    return { success: false, error: toClientError(error) }
  }
}

/**
 * Create a custom parent-interview question.
 */
export async function createParentPrompt(data: {
  category: string
  prompt_text: string
}): Promise<{
  success: boolean
  prompt?: ParentPromptRecord
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
        preparation_time: 20,
        response_time: 90,
        prompt_type: 'parent',
        is_active: true,
      },
    })

    return {
      success: true,
      prompt: {
        id: prompt.id,
        category: prompt.category,
        prompt_text: prompt.prompt_text,
        preparation_time: prompt.preparation_time,
        response_time: prompt.response_time,
        school_id: prompt.school_id,
        created_at: prompt.created_at.toISOString(),
      },
    }
  } catch (error) {
    console.error('[ParentPrompts] Error creating prompt:', error)
    return { success: false, error: toClientError(error) }
  }
}

/**
 * Delete a custom parent-interview question owned by the current school.
 */
export async function deleteParentPrompt(promptId: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const userResult = await getCurrentUser()
    if (!userResult.success || !userResult.user) {
      return { success: false, error: 'Not authenticated' }
    }

    const prompt = await prisma.prompt.findUnique({ where: { id: promptId } })
    if (!prompt || prompt.prompt_type !== 'parent') {
      return { success: false, error: 'Question not found' }
    }
    if (!prompt.school_id) {
      return { success: false, error: 'Cannot delete system default questions' }
    }
    if (prompt.school_id !== userResult.user.school.id && !userResult.user.school.is_super_admin) {
      return { success: false, error: 'Not authorized to delete this question' }
    }

    // Drop it from the selection list if present.
    const school = await prisma.school.findUnique({
      where: { id: userResult.user.school.id },
      select: { parent_selected_prompt_ids: true },
    })
    if (school?.parent_selected_prompt_ids?.includes(promptId)) {
      await prisma.school.update({
        where: { id: userResult.user.school.id },
        data: {
          parent_selected_prompt_ids: school.parent_selected_prompt_ids.filter((id) => id !== promptId),
        },
      })
    }

    await prisma.prompt.delete({ where: { id: promptId } })
    return { success: true }
  } catch (error) {
    console.error('[ParentPrompts] Error deleting prompt:', error)
    return { success: false, error: toClientError(error) }
  }
}

/**
 * Public fetch of a school's selected parent questions for the parent interview
 * page. Returns each question's English text plus a translation into the
 * requested language. Translations are cached on the prompt to avoid repeat
 * OpenAI calls.
 */
export async function getParentPromptsBySchoolCode(
  schoolCode: string,
  targetLanguage: string = 'English'
): Promise<{
  success: boolean
  prompts?: Array<{
    id: string
    category: string
    text: string
    translatedText: string
    preparationTime: number
    responseTime: number
  }>
  error?: string
}> {
  try {
    // Parent interview timing. Defaults to the student/global timing unless a
    // super admin has configured a parent-specific override.
    const { getParentTimingSettings } = await import('./system-settings')
    const parentTiming = await getParentTimingSettings()
    const defaultPrepTime = parentTiming.preparationTime ?? 20
    const defaultResponseTime = parentTiming.responseTime ?? 90

    const school = await prisma.school.findUnique({
      where: { code: schoolCode },
      select: { parent_selected_prompt_ids: true },
    })

    if (!school) {
      return { success: false, error: 'School not found' }
    }

    // Parent interviews use their own question set (never the student prompts).
    // When the school has not selected any parent questions, default to the first
    // 4 system-default parent questions.
    let promptIds = school.parent_selected_prompt_ids || []
    if (promptIds.length === 0) {
      const defaultPrompts = await prisma.prompt.findMany({
        where: { school_id: null, prompt_type: 'parent', is_active: true },
        take: 4,
        select: { id: true },
        orderBy: { created_at: 'asc' },
      })
      promptIds = defaultPrompts.map((p) => p.id)
    }

    if (promptIds.length === 0) {
      return { success: false, error: 'This school has not configured any parent interview questions yet.' }
    }

    const prompts = await prisma.prompt.findMany({
      where: { id: { in: promptIds } },
    })

    // Preserve the school's configured order.
    const orderedPrompts = promptIds
      .map((id) => prompts.find((p) => p.id === id))
      .filter((p): p is (typeof prompts)[number] => Boolean(p))

    if (orderedPrompts.length === 0) {
      return { success: false, error: 'No parent interview questions configured for this school' }
    }

    const wantsTranslation = Boolean(targetLanguage) && targetLanguage.toLowerCase() !== 'english'

    const formattedPrompts = await Promise.all(
      orderedPrompts.map(async (p) => {
        let translatedText = p.prompt_text
        if (wantsTranslation) {
          const cache =
            p.translations && typeof p.translations === 'object' && !Array.isArray(p.translations)
              ? (p.translations as Record<string, string>)
              : {}
          if (typeof cache[targetLanguage] === 'string' && cache[targetLanguage].trim().length > 0) {
            translatedText = cache[targetLanguage]
          } else {
            translatedText = await translateText(p.prompt_text, targetLanguage)
            // Persist the translation for reuse (best-effort).
            try {
              await prisma.prompt.update({
                where: { id: p.id },
                data: { translations: { ...cache, [targetLanguage]: translatedText } },
              })
            } catch (cacheError) {
              console.warn('[ParentPrompts] Failed to cache translation:', cacheError)
            }
          }
        }

        return {
          id: p.id,
          category: p.category,
          text: p.prompt_text,
          translatedText,
          preparationTime: defaultPrepTime,
          responseTime: defaultResponseTime,
        }
      })
    )

    // Mirror the student interview: append a final free-speech segment after the
    // configured questions.
    const freeSpeechText = 'This is your free speech time. You can say anything you want.'
    let freeSpeechTranslated = freeSpeechText
    if (wantsTranslation) {
      try {
        freeSpeechTranslated = await translateText(freeSpeechText, targetLanguage)
      } catch {
        freeSpeechTranslated = freeSpeechText
      }
    }
    formattedPrompts.push({
      id: 'free-speech',
      category: 'Free Speech',
      text: freeSpeechText,
      translatedText: freeSpeechTranslated,
      preparationTime: defaultPrepTime,
      responseTime: defaultResponseTime,
    })

    return { success: true, prompts: formattedPrompts }
  } catch (error) {
    console.error('[ParentPrompts] Error fetching prompts by school code:', error)
    return { success: false, error: toClientError(error) }
  }
}
