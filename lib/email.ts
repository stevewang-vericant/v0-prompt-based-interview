import nodemailer from 'nodemailer'

// Gmail SMTP transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
})

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Send password reset email
 * @param to - Recipient email address
 * @param resetToken - The password reset token
 */
export async function sendPasswordResetEmail(
  to: string,
  resetToken: string
): Promise<void> {
  const appUrl = process.env.APP_URL || 'http://localhost:3000'
  const resetUrl = `${appUrl}/school/reset-password?token=${resetToken}`

  const mailOptions = {
    from: process.env.GMAIL_USER,
    to,
    subject: 'Reset Your Password',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px;">
          <h2 style="color: #1a1a1a; margin-bottom: 20px;">Password Reset Request</h2>
          
          <p>Hello,</p>
          <p>You are receiving this email because you (or someone else) requested to reset your account password.</p>
          <p>Please click the button below to reset your password (this link is valid for 1 hour):</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #0070f3; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">
              Reset Password
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px;">If the button doesn't work, copy and paste the following link into your browser:</p>
          <p style="background-color: #e9ecef; padding: 10px; border-radius: 4px; word-break: break-all; font-size: 13px;">
            ${resetUrl}
          </p>
          
          <hr style="border: none; border-top: 1px solid #dee2e6; margin: 30px 0;">
          
          <p style="color: #666; font-size: 13px;">
            If you did not request a password reset, please ignore this email and your password will remain unchanged.
          </p>
        </div>
      </body>
      </html>
    `,
    text: `
Password Reset Request

Hello,

You are receiving this email because you (or someone else) requested to reset your account password.

Please click the following link to reset your password (this link is valid for 1 hour):
${resetUrl}

If you did not request a password reset, please ignore this email and your password will remain unchanged.
    `.trim(),
  }

  try {
    await transporter.sendMail(mailOptions)
    console.log('[Email] Password reset email sent to:', to)
  } catch (error) {
    console.error('[Email] Failed to send password reset email:', error)
    throw new Error('Failed to send password reset email')
  }
}

/**
 * Send interview completion email
 * @param to - Recipient email address
 * @param studentName - Student display name
 * @param videoUrl - Final merged interview video URL
 */
export async function sendInterviewCompletionEmail(
  to: string,
  studentName: string | null | undefined,
  videoUrl: string
): Promise<void> {
  const safeName = studentName?.trim() || 'there'

  const mailOptions = {
    from: process.env.GMAIL_USER,
    to,
    subject: 'Your Interview Video Is Ready',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px;">
          <h2 style="color: #1a1a1a; margin-bottom: 20px;">Interview Completed</h2>

          <p>Hello ${safeName},</p>
          <p>Your interview has been processed successfully. Your video is now ready to view.</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${videoUrl}"
               style="background-color: #0070f3; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">
              View Interview Video
            </a>
          </div>

          <p style="color: #666; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="background-color: #e9ecef; padding: 10px; border-radius: 4px; word-break: break-all; font-size: 13px;">
            ${videoUrl}
          </p>
        </div>
      </body>
      </html>
    `,
    text: `
Interview Completed

Hello ${safeName},

Your interview has been processed successfully. Your video is now ready to view:
${videoUrl}
    `.trim(),
  }

  try {
    await transporter.sendMail(mailOptions)
    console.log('[Email] Interview completion email sent to:', to)
  } catch (error) {
    console.error('[Email] Failed to send interview completion email:', error)
    throw new Error('Failed to send interview completion email')
  }
}

export interface SignupApprovalNotificationParams {
  requesterName?: string | null
  requesterEmail: string
  schoolName: string
  approvalUrl?: string
}

/**
 * Notify configured admins that a newly registered school user is waiting for approval.
 */
export async function sendSignupApprovalNotificationEmail(
  to: string[],
  params: SignupApprovalNotificationParams
): Promise<void> {
  const appUrl = process.env.APP_URL || 'http://localhost:3000'
  const approvalUrl = params.approvalUrl
    ? params.approvalUrl
    : `${appUrl}/school/users`
  const safeRequesterName = escapeHtml(params.requesterName?.trim() || 'Unknown user')
  const safeRequesterEmail = escapeHtml(params.requesterEmail)
  const safeSchoolName = escapeHtml(params.schoolName)

  const mailOptions = {
    from: process.env.GMAIL_USER,
    to,
    subject: 'New School User Waiting for Approval',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px;">
          <h2 style="color: #1a1a1a; margin-bottom: 20px;">New User Approval Required</h2>

          <p>A new school user has signed up and is waiting for approval.</p>

          <ul style="padding-left: 20px; margin: 20px 0;">
            <li><strong>Name:</strong> ${safeRequesterName}</li>
            <li><strong>Email:</strong> ${safeRequesterEmail}</li>
            <li><strong>School:</strong> ${safeSchoolName}</li>
          </ul>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${approvalUrl}"
               style="background-color: #0070f3; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">
              Review Pending Approvals
            </a>
          </div>

          <p style="color: #666; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="background-color: #e9ecef; padding: 10px; border-radius: 4px; word-break: break-all; font-size: 13px;">
            ${approvalUrl}
          </p>
        </div>
      </body>
      </html>
    `,
    text: `
New User Approval Required

A new school user has signed up and is waiting for approval.

Name: ${params.requesterName?.trim() || 'Unknown user'}
Email: ${params.requesterEmail}
School: ${params.schoolName}

Review pending approvals:
${approvalUrl}
    `.trim(),
  }

  try {
    await transporter.sendMail(mailOptions)
    console.log('[Email] Signup approval notification sent to:', to.join(', '))
  } catch (error) {
    console.error('[Email] Failed to send signup approval notification:', error)
    throw new Error('Failed to send signup approval notification email')
  }
}

export interface SignupApprovedEmailParams {
  name?: string | null
  schoolName: string
  loginUrl?: string
}

/**
 * Notify a school user that their signup request has been approved.
 */
export async function sendSignupApprovedEmail(
  to: string,
  params: SignupApprovedEmailParams
): Promise<void> {
  const appUrl = process.env.APP_URL || 'http://localhost:3000'
  const loginUrl = params.loginUrl
    ? params.loginUrl
    : `${appUrl}/school/login`
  const safeName = escapeHtml(params.name?.trim() || 'there')
  const safeSchoolName = escapeHtml(params.schoolName)

  const mailOptions = {
    from: process.env.GMAIL_USER,
    to,
    subject: 'Your School Account Has Been Approved',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px;">
          <h2 style="color: #1a1a1a; margin-bottom: 20px;">Welcome to Guided Interview</h2>

          <p>Hello ${safeName},</p>
          <p>Your signup request for <strong>${safeSchoolName}</strong> has been approved.</p>
          <p>You can now log in to your school account using the email and password you used during signup.</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${loginUrl}"
               style="background-color: #0070f3; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">
              Log In
            </a>
          </div>

          <p style="color: #666; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="background-color: #e9ecef; padding: 10px; border-radius: 4px; word-break: break-all; font-size: 13px;">
            ${loginUrl}
          </p>
        </div>
      </body>
      </html>
    `,
    text: `
Welcome to Guided Interview

Hello ${params.name?.trim() || 'there'},

Your signup request for ${params.schoolName} has been approved.

You can now log in to your school account using the email and password you used during signup:
${loginUrl}
    `.trim(),
  }

  try {
    await transporter.sendMail(mailOptions)
    console.log('[Email] Signup approved email sent to:', to)
  } catch (error) {
    console.error('[Email] Failed to send signup approved email:', error)
    throw new Error('Failed to send signup approved email')
  }
}

export interface RaterReviewNotificationParams {
  raterName?: string | null
  studentName?: string | null
  schoolName?: string | null
  interviewId: string
  finalScore: number
  reviewUrl: string
}

/**
 * Notify a rater that a new interview score is ready for review.
 */
export async function sendRaterReviewNotificationEmail(
  to: string,
  params: RaterReviewNotificationParams
): Promise<void> {
  const appUrl = process.env.APP_URL || 'http://localhost:3000'
  const safeRaterName = params.raterName?.trim() || 'there'
  const safeStudentName = params.studentName?.trim() || 'Unknown student'
  const safeSchoolName = params.schoolName?.trim() || 'Unknown school'
  const reviewUrl = params.reviewUrl.startsWith('http')
    ? params.reviewUrl
    : `${appUrl}${params.reviewUrl.startsWith('/') ? '' : '/'}${params.reviewUrl}`

  const mailOptions = {
    from: process.env.GMAIL_USER,
    to,
    subject: 'New Interview Score Ready for Review',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px;">
          <h2 style="color: #1a1a1a; margin-bottom: 20px;">New Interview Ready for Review</h2>

          <p>Hello ${safeRaterName},</p>
          <p>A student interview has been scored by Cathoven and is waiting for your review.</p>

          <ul style="padding-left: 20px; margin: 20px 0;">
            <li><strong>Student:</strong> ${safeStudentName}</li>
            <li><strong>School:</strong> ${safeSchoolName}</li>
            <li><strong>Interview ID:</strong> ${params.interviewId}</li>
            <li><strong>Cathoven Score:</strong> ${params.finalScore}</li>
          </ul>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${reviewUrl}"
               style="background-color: #0070f3; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">
              Review Interview
            </a>
          </div>

          <p style="color: #666; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="background-color: #e9ecef; padding: 10px; border-radius: 4px; word-break: break-all; font-size: 13px;">
            ${reviewUrl}
          </p>
        </div>
      </body>
      </html>
    `,
    text: `
New Interview Ready for Review

Hello ${safeRaterName},

A student interview has been scored by Cathoven and is waiting for your review.

Student: ${safeStudentName}
School: ${safeSchoolName}
Interview ID: ${params.interviewId}
Cathoven Score: ${params.finalScore}

Review the interview:
${reviewUrl}
    `.trim(),
  }

  try {
    await transporter.sendMail(mailOptions)
    console.log('[Email] Rater review notification sent to:', to)
  } catch (error) {
    console.error('[Email] Failed to send rater review notification:', error)
    throw new Error('Failed to send rater review notification email')
  }
}
