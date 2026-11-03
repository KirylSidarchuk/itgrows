import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

/** Whether Resend took the email: it answers an error instead of throwing one, so the answer has to be
 *  read. Never throws. A caller that tells someone an email went out goes by `ok`. */
export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }): Promise<{ ok: boolean; error?: string }> {
  try {
    const { error } = await resend.emails.send({
      from: "ItGrows.ai <noreply@itgrows.ai>",
      to,
      subject,
      html,
    })
    if (error) {
      console.error("[email] Not accepted:", error)
      return { ok: false, error: error.message }
    }
    return { ok: true }
  } catch (err) {
    console.error("[email] Failed to send:", err)
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}
