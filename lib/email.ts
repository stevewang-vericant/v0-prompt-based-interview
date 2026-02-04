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
    subject: '重置您的密码 - Reset Your Password',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px;">
          <h2 style="color: #1a1a1a; margin-bottom: 20px;">密码重置请求 / Password Reset Request</h2>
          
          <p>您好，</p>
          <p>您收到此邮件是因为您（或其他人）请求重置您的账户密码。</p>
          <p>请点击下方按钮重置密码（链接在1小时内有效）：</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #0070f3; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">
              重置密码 / Reset Password
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px;">如果按钮无法点击，请复制以下链接到浏览器地址栏：</p>
          <p style="background-color: #e9ecef; padding: 10px; border-radius: 4px; word-break: break-all; font-size: 13px;">
            ${resetUrl}
          </p>
          
          <hr style="border: none; border-top: 1px solid #dee2e6; margin: 30px 0;">
          
          <p style="color: #666; font-size: 13px;">
            如果您没有请求重置密码，请忽略此邮件，您的密码将保持不变。<br>
            If you did not request a password reset, please ignore this email.
          </p>
        </div>
      </body>
      </html>
    `,
    text: `
密码重置请求 / Password Reset Request

您好，

您收到此邮件是因为您（或其他人）请求重置您的账户密码。

请点击以下链接重置密码（链接在1小时内有效）：
${resetUrl}

如果您没有请求重置密码，请忽略此邮件，您的密码将保持不变。

---

If you did not request a password reset, please ignore this email.
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
