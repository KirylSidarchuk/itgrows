import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { subject, message } = await req.json() as { subject?: string; message?: string }
  if (!message?.trim()) return NextResponse.json({ error: "Message required" }, { status: 400 })

  const userName = session.user.name ?? session.user.email?.split("@")[0] ?? "User"
  const userEmail = session.user.email ?? ""
  const emailSubject = `[Support] ${subject?.trim() || "New support request"} from ${userName}`

  await resend.emails.send({
    from: "ItGrows.ai <noreply@itgrows.ai>",
    to: "kiryl.sidarchuk@gmail.com",
    replyTo: userEmail,
    subject: emailSubject,
    html: `<p><strong>From:</strong> ${userName} (${userEmail})</p><p><strong>Message:</strong></p><p>${message.trim().replace(/\n/g, "<br>")}</p>`,
  })

  return NextResponse.json({ success: true })
}
