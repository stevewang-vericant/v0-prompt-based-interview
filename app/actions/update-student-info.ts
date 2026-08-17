'use server'

import { prisma } from '@/lib/prisma'
import { toClientError } from '@/lib/errors'
import { requirePaymentAccess } from '@/lib/payment-access'

interface AdditionalStudentInfo {
  gender?: string | null
  currentGrade?: string | null
  residencyCity?: string | null
  residenceCountry?: string | null
  needFinancialAid?: boolean | null
  // null => the (optional) CBO question was left unanswered or is not applicable
  usesCbo?: boolean | null
  cboOrganization?: string | null
}

export async function updateStudentInfo(
  studentEmail: string,
  additionalInfo: AdditionalStudentInfo,
  interviewId?: string
) {
  try {
    let authorizedEmail = studentEmail
    if (interviewId) {
      const payment = await prisma.interviewPayment.findUnique({
        where: { interview_id: interviewId },
        select: { id: true, student_email: true },
      })
      if (payment) {
        await requirePaymentAccess({
          paymentId: payment.id,
          interviewId,
        })
        authorizedEmail = payment.student_email
      }
    }

    console.log('[v0] Updating student info for:', authorizedEmail)
    console.log('[v0] Additional info:', additionalInfo)

    const student = await prisma.student.findUnique({
      where: { email: authorizedEmail }
    })

    if (!student) {
      console.error('[v0] Student not found:', authorizedEmail)
      return { success: false, error: 'Student not found' }
    }

    const cboOrganization = additionalInfo.cboOrganization?.trim() || ''
    const hasCboInput =
      additionalInfo.usesCbo !== undefined ||
      additionalInfo.cboOrganization !== undefined

    // CBO is optional: null (or unanswered) stays null, false stays false.
    let usesCbo: boolean | null = null
    if (additionalInfo.usesCbo === true) {
      usesCbo = true
    } else if (additionalInfo.usesCbo === false) {
      usesCbo = false
    } else if (additionalInfo.usesCbo === undefined && !!cboOrganization) {
      usesCbo = true
    }

    if (usesCbo === true && !cboOrganization) {
      return {
        success: false,
        error: 'CBO organization is required when using a CBO'
      }
    }

    // Update student with additional information
    // Explicitly set fields to null if they are null/undefined to clear old data
    await prisma.student.update({
      where: { email: authorizedEmail },
      data: {
        gender: additionalInfo.gender === undefined ? undefined : (additionalInfo.gender || null),
        current_grade: additionalInfo.currentGrade === undefined ? undefined : (additionalInfo.currentGrade || null),
        residency_city: additionalInfo.residencyCity === undefined ? undefined : (additionalInfo.residencyCity || null),
        residence_country: additionalInfo.residenceCountry === undefined ? undefined : (additionalInfo.residenceCountry || null),
        need_financial_aid: additionalInfo.needFinancialAid === undefined ? undefined : (additionalInfo.needFinancialAid === null ? null : additionalInfo.needFinancialAid),
        uses_cbo: hasCboInput ? usesCbo : undefined,
        cbo_organization: hasCboInput ? (usesCbo === true ? cboOrganization : null) : undefined
      }
    })

    console.log('[v0] ✓ Student info updated successfully')
    return { success: true }
  } catch (error) {
    console.error('[v0] Error updating student info:', error)
    return {
      success: false,
      error: toClientError(error)
    }
  }
}
