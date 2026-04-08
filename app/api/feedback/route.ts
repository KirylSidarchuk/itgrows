import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { category, message } = await req.json() as { category?: string; message?: string }
  if (!message?.trim()) return NextResponse.json({ error: "Message required" }, { status: 400 })

  await resend.emails.send({
    from: "ItGrows.ai <noreply@itgrows.ai>",
    to: "kiryl.sidarchuk@gmail.com",
    subject: `[Feedback] ${category ?? "General"} from ${session.user.email}`,
    html: `<p><strong>From:</strong> ${session.user.email}</p><p><strong>Category:</strong> ${category ?? "General"}</p><p><strong>Message:</strong></p><p>${message.replace(/\n/g, "<br>")}</p>`,
  })

  return NextResponse.json({ ok: true })
}
