import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"

// TEMP: deliverability test to kiryl@itgrows.ai (confirm the mailbox RECEIVES). Remove after use.
const TOKEN = "trace_7Kx9mQ2vLp8sRt4wYz"
const TO = "kiryl@itgrows.ai"

export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get("token") !== TOKEN) return NextResponse.json({ error: "forbidden" }, { status: 403 })
  if (!process.env.RESEND_API_KEY) return NextResponse.json({ error: "no key" }, { status: 500 })
  const resend = new Resend(process.env.RESEND_API_KEY)
  const { data, error } = await resend.emails.send({
    from: "ItGrows Test <noreply@itgrows.ai>",
    replyTo: "kiryl@itgrows.ai",
    to: TO,
    subject: "✅ Inbox test — does kiryl@itgrows.ai receive mail?",
    html: `<div style="font-family: -apple-system, 'Segoe UI', sans-serif; font-size:15px; color:#1f2937;">
      <p>This is a deliverability test.</p>
      <p>If you're reading this in the <strong>kiryl@itgrows.ai</strong> inbox, the mailbox receives mail — which means customer replies to your founder emails will land here.</p>
      <p>If it went to spam, note that (we may need SPF/DKIM/DMARC tuning). If it never arrives, the domain has no receiving mailbox (MX) and replies are being lost.</p>
      <p style="color:#6b7280; font-size:13px;">Sent via Resend for a one-off inbox check. — automated test</p>
    </div>`,
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ sent: true, id: data?.id, to: TO })
}
