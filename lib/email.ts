import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  try {
    await resend.emails.send({
      from: "ItGrows.ai <noreply@itgrows.ai>",
      to,
      subject,
      html,
    })
  } catch (err) {
    console.error("[email] Failed to send:", err)
  }
}
