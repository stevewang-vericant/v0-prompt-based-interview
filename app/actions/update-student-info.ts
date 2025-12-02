'use server'

import { prisma } from '@/lib/prisma'

interface AdditionalStudentInfo {
  gender?: string
  currentGrade?: string
  residencyCity?: string
  needFinancialAid?: boolean
}

export async function updateStudentInfo(
  studentEmail: string,
  additionalInfo: AdditionalStudentInfo
) {
  try {
    console.log('[v0] Updating student info for:', studentEmail)
    console.log('[v0] Additional info:', additionalInfo)

    const student = await prisma.student.findUnique({
      where: { email: studentEmail }
    })

    if (!student) {
      console.error('[v0] Student not found:', studentEmail)
      return { success: false, error: 'Student not found' }
    }

    // Update student with additional information
    await prisma.student.update({
      where: { email: studentEmail },
      data: {
        gender: additionalInfo.gender,
        current_grade: additionalInfo.currentGrade,
        residency_city: additionalInfo.residencyCity,
        need_financial_aid: additionalInfo.needFinancialAid
      }
    })

    console.log('[v0] ✓ Student info updated successfully')
    return { success: true }
  } catch (error) {
    console.error('[v0] Error updating student info:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

