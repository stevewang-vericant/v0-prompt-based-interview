'use server'

import { prisma } from '@/lib/prisma'
import { toClientError } from '@/lib/errors'
import { requirePaymentAccess } from '@/lib/payment-access'
import { requireInterviewAccess } from '@/lib/interview-access'
import { isStudentPayMode } from '@/lib/billing'
import { getCurrentUser } from './auth'

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
    if (!interviewId) {
      return { success: false, error: 'Interview access is required.' }
    }

    const interview = await prisma.interview.findUnique({
      where: { interview_id: interviewId },
      select: {
        id: true,
        payment_id: true,
        student: { select: { email: true } },
        school: { select: { id: true, billing_mode: true } },
      },
    })
    if (!interview) {
      return { success: false, error: 'Interview not found.' }
    }
    if (!interview.student) {
      return { success: false, error: 'Interview student is missing.' }
    }

    const currentUser = await getCurrentUser()
    const staffAuthorized =
      currentUser.success &&
      !!currentUser.user &&
      (currentUser.user.school.is_super_admin ||
        currentUser.user.school.id === interview.school.id)

    if (!staffAuthorized) {
      const payment =
        (interview.payment_id
          ? await prisma.interviewPayment.findUnique({
              where: { id: interview.payment_id },
              select: { id: true, interview_id: true, student_email: true },
            })
          : null) ||
        (await prisma.interviewPayment.findUnique({
          where: { interview_id: interviewId },
          select: { id: true, interview_id: true, student_email: true },
        }))

      if (payment || isStudentPayMode(interview.school.billing_mode)) {
        if (!payment || payment.interview_id !== interviewId) {
          return { success: false, error: 'Payment access is required.' }
        }
        await requirePaymentAccess({
          paymentId: payment.id,
          interviewId,
        })
      } else {
        await requireInterviewAccess({
          interviewDbId: interview.id,
          interviewId,
        })
      }
    }

    const authorizedEmail = interview.student.email
    if (studentEmail.toLowerCase() !== authorizedEmail.toLowerCase()) {
      return { success: false, error: 'Interview student does not match.' }
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
