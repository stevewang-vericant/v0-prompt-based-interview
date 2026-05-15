import nodemailer from 'nodemailer'

// Gmail SMTP transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
})

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
