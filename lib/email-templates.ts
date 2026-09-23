const baseStyle = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  max-width: 560px;
  margin: 0 auto;
  background: #ffffff;
`

export function subscriptionActivatedEmail(name: string, plan: string): string {
  const planLabel = plan === "allin" ? "All-in ($199/mo)"
    : plan === "duo" ? "Duo ($99/mo)"
    : plan === "personal_annual" ? "Personal Annual"
    : "Personal ($49/mo)"
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
          <li>Fill your Professional DNA brief (2 minutes)</li>
          <li>We generate 7 posts for your first week</li>
          <li>Posts publish automatically at 10am UTC daily</li>
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

export function linkedinTokenExpiringEmail(name: string, days: number): string {
  const when = days <= 0 ? "today" : days === 1 ? "tomorrow" : `in ${days} days`
  const urgent = days <= 1
  return `
    <div style="${baseStyle}">
      <div style="background: linear-gradient(135deg, ${urgent ? "#b91c1c, #ef4444" : "#7c3aed, #a855f7"}); padding: 24px 32px; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 20px;">🔗 Your LinkedIn connection expires ${when}</h1>
      </div>
      <div style="padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
        <p style="color: #374151;">Hi ${name},</p>
        <p style="color: #374151;">LinkedIn grants access for sixty days at a time and gives us no way to renew it on your behalf, so your connection expires ${when} and your scheduled posts will stop going out.</p>
        <p style="color: #374151;">Reconnecting takes about ten seconds and nothing in your queue is lost.</p>
        <a href="https://itgrows.ai/api/linkedin/connect" style="display: inline-block; background: #0a66c2; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 8px;">Reconnect LinkedIn →</a>
        <p style="color: #9ca3af; font-size: 12px; margin-top: 32px;">ItGrows.ai · We send this shortly before the deadline so nothing stops without warning.</p>
      </div>
    </div>
  `
}

export function draftReadyEmail(name: string, title: string, editUrl: string, language?: string): string {
  // The recipient reads this in the language their site is written in; a review request they
  // have to translate is a review that does not happen.
  const de = (language ?? "").toLowerCase().startsWith("de")
  const t = de
    ? {
        head: "Ein neuer Artikel wartet auf Ihre Freigabe",
        hi: `Guten Tag ${name},`,
        body: "wir haben einen neuen Artikel als Entwurf in Ihrem WordPress abgelegt. Er ist auf Ihrer Website noch nicht sichtbar.",
        how: "Bitte lesen Sie ihn durch, ändern Sie, was Sie ändern möchten, und klicken Sie oben rechts auf <strong>Veröffentlichen</strong>. Erst dann geht er online.",
        cta: "Entwurf öffnen →",
        foot: "ItGrows.ai · Ohne Ihre Freigabe erscheint nichts auf Ihrer Website.",
      }
    : {
        head: "A new article is waiting for your approval",
        hi: `Hi ${name},`,
        body: "We have placed a new article in your WordPress as a draft. It is not visible on your site yet.",
        how: "Read it through, change anything you want changed, and click <strong>Publish</strong> at the top right. Only then does it go live.",
        cta: "Open the draft →",
        foot: "ItGrows.ai · Nothing appears on your site without your approval.",
      }
  return `
    <div style="${baseStyle}">
      <div style="background: linear-gradient(135deg, #0f766e, #14b8a6); padding: 24px 32px; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 20px;">\u{1F4DD} ${t.head}</h1>
      </div>
      <div style="padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
        <p style="color: #374151;">${t.hi}</p>
        <p style="color: #374151;">${t.body}</p>
        <p style="color: #111827; font-size: 17px; font-weight: 600; margin: 20px 0 4px;">${title}</p>
        <p style="color: #374151;">${t.how}</p>
        <a href="${editUrl}" style="display: inline-block; background: #0f766e; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 8px;">${t.cta}</a>
        <p style="color: #9ca3af; font-size: 12px; margin-top: 32px;">${t.foot}</p>
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

export function xTokenExpiredEmail(name: string): string {
  return `
    <div style="${baseStyle}">
      <div style="background: linear-gradient(135deg, #1a1a2e, #16213e); padding: 24px 32px; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 20px;">🔗 Reconnect Your X Account</h1>
      </div>
      <div style="padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
        <p style="color: #374151;">Hi ${name},</p>
        <p style="color: #374151;">Your X (Twitter) connection has expired. To keep your autopilot running, please reconnect your account — it takes 10 seconds.</p>
        <a href="https://itgrows.ai/cabinet" style="display: inline-block; background: #1a1a2e; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 8px;">Reconnect X Account →</a>
        <p style="color: #9ca3af; font-size: 12px; margin-top: 32px;">ItGrows.ai · This is a one-time reconnect to refresh your access token.</p>
      </div>
    </div>
  `
}

export function xPostFailedEmail(name: string, postPreview: string, error: string): string {
  return `
    <div style="${baseStyle}">
      <div style="background: linear-gradient(135deg, #dc2626, #ef4444); padding: 24px 32px; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 20px;">⚠️ X Post Failed to Publish</h1>
      </div>
      <div style="padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
        <p style="color: #374151;">Hi ${name},</p>
        <p style="color: #374151;">We couldn't publish your X (Twitter) post. Here's what happened:</p>
        <div style="background: #fef2f2; border-left: 3px solid #ef4444; padding: 16px; border-radius: 4px; color: #374151; font-size: 14px; line-height: 1.6; margin: 16px 0;">
          ${postPreview.slice(0, 200)}${postPreview.length > 200 ? "..." : ""}
        </div>
        <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 12px 16px; border-radius: 8px; color: #991b1b; font-size: 13px; margin: 16px 0;">
          ${error.slice(0, 300)}
        </div>
        <p style="color: #6b7280; font-size: 14px;">Common fixes:</p>
        <ul style="color: #6b7280; font-size: 14px; line-height: 1.8;">
          <li>Reconnect your X account in the cabinet (token may have expired)</li>
          <li>Check if your X account is still active</li>
          <li>Try publishing manually from the cabinet</li>
        </ul>
        <a href="https://itgrows.ai/cabinet" style="display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 8px;">Go to Cabinet →</a>
        <p style="color: #9ca3af; font-size: 12px; margin-top: 32px;">ItGrows.ai · <a href="https://itgrows.ai/cabinet" style="color: #9ca3af;">Manage posts</a></p>
      </div>
    </div>
  `
}

export function subscriptionCancelledEmail(name: string): string {
  return `
    <div style="${baseStyle}">
      <div style="background: linear-gradient(135deg, #6b7280, #9ca3af); padding: 24px 32px; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 20px;">Your ItGrows.ai subscription has ended</h1>
      </div>
      <div style="padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
        <p style="color: #374151;">Hi ${name},</p>
        <p style="color: #374151;">Your subscription has ended. Your content history is saved and you can resubscribe anytime.</p>
        <p style="color: #6b7280; font-size: 14px;">We hope to see you back soon. Your posts and brief will be waiting for you.</p>
        <a href="https://itgrows.ai/#pricing" style="display: inline-block; background: #7c3aed; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 16px;">Resubscribe →</a>
        <p style="color: #9ca3af; font-size: 12px; margin-top: 32px;">ItGrows.ai · <a href="https://itgrows.ai" style="color: #9ca3af;">itgrows.ai</a></p>
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
        <p style="color: #374151;">We couldn't process your ItGrows subscription payment. Your access continues while we retry.</p>
        <p style="color: #6b7280; font-size: 14px;">To keep your LinkedIn autopilot running, please update your payment method:</p>
        <a href="https://itgrows.ai/cabinet" style="display: inline-block; background: #d97706; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 8px;">Update Payment Method →</a>
        <p style="color: #9ca3af; font-size: 12px; margin-top: 32px;">ItGrows.ai · Stripe will retry automatically in 3 days.</p>
      </div>
    </div>
  `
}
