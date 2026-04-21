const baseStyle = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  max-width: 560px;
  margin: 0 auto;
  background: #ffffff;
`

export function subscriptionActivatedEmail(name: string, plan: string): string {
  const planLabel = plan === "personal_annual" ? "Personal Annual ($144/yr)" : "Personal Monthly ($15/mo)"
  return `
    <div style="${baseStyle}">
      <div style="background: linear-gradient(135deg, #7c3aed, #a855f7); padding: 32px; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Welcome to ItGrows Personal 🎉</h1>
      </div>
      <div style="padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
        <p style="color: #374151; font-size: 16px;">Hi ${name},</p>
        <p style="color: #374151;">Your <strong>${planLabel}</strong> subscription is now active. Your LinkedIn is on autopilot!</p>
        <p style="color: #6b7280; font-size: 14px;">Here's what happens next:</p>
        <ul style="color: #6b7280; font-size: 14px; line-height: 1.8;">
          <li>Connect your LinkedIn account in the cabinet</li>
          <li>Fill your Content DNA brief (2 minutes)</li>
          <li>We generate 7 posts for your first week</li>
          <li>Posts publish automatically at 9am UTC daily</li>
        </ul>
        <a href="https://itgrows.ai/cabinet" style="display: inline-block; background: #7c3aed; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 16px;">Go to Cabinet →</a>
        <p style="color: #9ca3af; font-size: 12px; margin-top: 32px;">ItGrows.ai · <a href="https://itgrows.ai/personal" style="color: #9ca3af;">Manage subscription</a></p>
      </div>
    </div>
  `
}

export function postPublishedEmail(name: string, postPreview: string, linkedinPostId: string | null): string {
  const postUrl = linkedinPostId ? `https://www.linkedin.com/feed/update/${linkedinPostId}/` : null
  return `
    <div style="${baseStyle}">
      <div style="background: linear-gradient(135deg, #059669, #10b981); padding: 24px 32px; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 20px;">✅ Post Published to LinkedIn</h1>
      </div>
      <div style="padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
        <p style="color: #374151;">Hi ${name},</p>
        <p style="color: #374151;">Your LinkedIn post went live:</p>
        <div style="background: #f9fafb; border-left: 3px solid #7c3aed; padding: 16px; border-radius: 4px; color: #374151; font-size: 14px; line-height: 1.6; margin: 16px 0;">
          ${postPreview.slice(0, 200)}${postPreview.length > 200 ? "..." : ""}
        </div>
        ${postUrl ? `<a href="${postUrl}" style="display: inline-block; background: #0a66c2; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 8px;">View on LinkedIn →</a>` : ""}
        <p style="color: #9ca3af; font-size: 12px; margin-top: 32px;">ItGrows.ai · <a href="https://itgrows.ai/cabinet" style="color: #9ca3af;">View all posts</a></p>
      </div>
    </div>
  `
}

export function postFailedEmail(name: string, postPreview: string, error: string): string {
  return `
    <div style="${baseStyle}">
      <div style="background: linear-gradient(135deg, #dc2626, #ef4444); padding: 24px 32px; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 20px;">⚠️ Post Failed to Publish</h1>
      </div>
      <div style="padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
        <p style="color: #374151;">Hi ${name},</p>
        <p style="color: #374151;">We couldn't publish your LinkedIn post. Here's what happened:</p>
        <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 12px 16px; border-radius: 8px; color: #991b1b; font-size: 13px; margin: 16px 0;">
          ${error.slice(0, 300)}
        </div>
        <p style="color: #6b7280; font-size: 14px;">Common fixes:</p>
        <ul style="color: #6b7280; font-size: 14px; line-height: 1.8;">
          <li>Reconnect your LinkedIn account (token may have expired)</li>
          <li>Check if your LinkedIn account is still active</li>
          <li>Try publishing manually from the cabinet</li>
        </ul>
        <a href="https://itgrows.ai/cabinet" style="display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 8px;">Go to Cabinet →</a>
        <p style="color: #9ca3af; font-size: 12px; margin-top: 32px;">ItGrows.ai · <a href="https://itgrows.ai/cabinet" style="color: #9ca3af;">Manage posts</a></p>
      </div>
    </div>
  `
}

export function linkedinTokenExpiredEmail(name: string): string {
  return `
    <div style="${baseStyle}">
      <div style="background: linear-gradient(135deg, #7c3aed, #a855f7); padding: 24px 32px; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 20px;">🔗 Reconnect Your LinkedIn</h1>
      </div>
      <div style="padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
        <p style="color: #374151;">Hi ${name},</p>
        <p style="color: #374151;">Your LinkedIn connection has expired. To keep your autopilot running, please reconnect your account — it takes 10 seconds.</p>
        <a href="https://itgrows.ai/api/linkedin/connect" style="display: inline-block; background: #0a66c2; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 8px;">Reconnect LinkedIn →</a>
        <p style="color: #9ca3af; font-size: 12px; margin-top: 32px;">ItGrows.ai · This is a one-time reconnect to refresh your access token.</p>
      </div>
    </div>
  `
}

export function paymentFailedEmail(name: string): string {
  return `
    <div style="${baseStyle}">
      <div style="background: linear-gradient(135deg, #d97706, #f59e0b); padding: 24px 32px; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 20px;">⚠️ Payment Failed</h1>
      </div>
      <div style="padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
        <p style="color: #374151;">Hi ${name},</p>
        <p style="color: #374151;">We couldn't process your ItGrows Personal subscription payment. Your access continues for 7 days while we retry.</p>
        <p style="color: #6b7280; font-size: 14px;">To keep your LinkedIn autopilot running, please update your payment method:</p>
        <a href="https://itgrows.ai/cabinet" style="display: inline-block; background: #d97706; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 8px;">Update Payment Method →</a>
        <p style="color: #9ca3af; font-size: 12px; margin-top: 32px;">ItGrows.ai · Stripe will retry automatically in 3 days.</p>
      </div>
    </div>
  `
}
