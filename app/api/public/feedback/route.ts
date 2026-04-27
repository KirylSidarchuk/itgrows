import { NextRequest, NextResponse } from "next/server"
import { sendEmail } from "@/lib/email"
import { checkIPRateLimit, getClientIP } from "@/lib/rate-limit"

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIP(req)
    const rl = checkIPRateLimit(ip, 5, 60 * 60 * 1000)
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfter ?? 3600) } }
      )
    }

    const body = await req.json() as { type?: string; email?: string; message?: string }
    const { type, email, message } = body

    if (!message || message.trim().length < 10) {
      return NextResponse.json({ error: "Message must be at least 10 characters." }, { status: 400 })
    }

    const feedbackType = type || "Other"
    const fromLabel = email && email.trim() ? email.trim() : "Anonymous"

    const html = `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
        <h2 style="color:#7C3AED;margin-bottom:8px">New Feedback — ${feedbackType}</h2>
        <p style="color:#555;margin-bottom:16px"><strong>From:</strong> ${fromLabel}</p>
        <div style="background:#f3f2f1;border-radius:8px;padding:16px;white-space:pre-wrap;color:#1b1916">${message.trim()}</div>
        <p style="color:#aaa;font-size:12px;margin-top:16px">Sent via ItGrows.ai feedback form</p>
      </div>
    `

    await sendEmail({
      to: "kiryl@itgrows.ai",
      subject: `[Feedback] ${feedbackType} from ${fromLabel}`,
      html,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[feedback] Error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
