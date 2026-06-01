'use server'

import { prisma } from '@/lib/prisma'

interface AdditionalStudentInfo {
  gender?: string | null
  currentGrade?: string | null
  residencyCity?: string | null
  residenceCountry?: string | null
  needFinancialAid?: boolean | null
  usesCbo?: boolean
  cboOrganization?: string | null
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

    const cboOrganization = additionalInfo.cboOrganization?.trim() || ''
    const hasCboInput =
      additionalInfo.usesCbo !== undefined ||
      additionalInfo.cboOrganization !== undefined
    const usesCbo =
      additionalInfo.usesCbo === true ||
      (additionalInfo.usesCbo === undefined && !!cboOrganization)

    if (usesCbo && !cboOrganization) {
      return {
        success: false,
        error: 'CBO organization is required when using a CBO'
      }
    }

    // Update student with additional information
    // Explicitly set fields to null if they are null/undefined to clear old data
    await prisma.student.update({
      where: { email: studentEmail },
      data: {
        gender: additionalInfo.gender === undefined ? undefined : (additionalInfo.gender || null),
        current_grade: additionalInfo.currentGrade === undefined ? undefined : (additionalInfo.currentGrade || null),
        residency_city: additionalInfo.residencyCity === undefined ? undefined : (additionalInfo.residencyCity || null),
        residence_country: additionalInfo.residenceCountry === undefined ? undefined : (additionalInfo.residenceCountry || null),
        need_financial_aid: additionalInfo.needFinancialAid === undefined ? undefined : (additionalInfo.needFinancialAid === null ? null : additionalInfo.needFinancialAid),
        uses_cbo: hasCboInput ? usesCbo : undefined,
        cbo_organization: hasCboInput ? (usesCbo ? cboOrganization : null) : undefined
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
