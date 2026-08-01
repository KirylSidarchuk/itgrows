import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"

// TEMP: outbound inbox-placement test — from kiryl@itgrows.ai to an external gmail. Remove after use.
const TOKEN = "trace_7Kx9mQ2vLp8sRt4wYz"
const TO = "kiryl.sidarchuk@gmail.com"

export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get("token") !== TOKEN) return NextResponse.json({ error: "forbidden" }, { status: 403 })
  if (!process.env.RESEND_API_KEY) return NextResponse.json({ error: "no key" }, { status: 500 })
  const resend = new Resend(process.env.RESEND_API_KEY)
  const { data, error } = await resend.emails.send({
    from: "Kiryl Sidarchuk <kiryl@itgrows.ai>",
    replyTo: "kiryl@itgrows.ai",
    to: TO,
    subject: "Quick note from Kiryl at ItGrows",
    // Plain, personal-looking body (like the real founder emails) so the placement test is representative.
    html: `<div style="font-family: Georgia, 'Times New Roman', serif; font-size:16px; line-height:1.6; color:#1f2937;">
      <p>Hi,</p>
      <p>Just a quick note to check this reaches you well. This is the exact from-address and style your customers receive when I email them, so wherever this lands (Primary inbox, Promotions, or Spam) is where their message lands too.</p>
      <p>If you can see this in your main inbox, our founder emails are delivering cleanly.</p>
      <p>&mdash; Kiryl<br/><span style="color:#6b7280; font-size:14px;">Founder, ItGrows.ai</span></p>
    </div>`,
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ sent: true, id: data?.id, from: "kiryl@itgrows.ai", to: TO })
}
