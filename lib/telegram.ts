// Owner alerts in Telegram. Kept tiny and fire-and-forget: an alert must never
// break or slow the flow it reports on. The bot token comes only from the
// TELEGRAM_BOT_TOKEN env var; without it alerts are skipped, never thrown.
const OWNER_CHAT = "372194458"

async function send(chatId: string, payload: Record<string, unknown>): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim()
  if (!token) {
    console.warn("[telegram] TELEGRAM_BOT_TOKEN is not set; owner alert skipped")
    return
  }
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, ...payload }),
  }).catch(() => {})
}

// Plain message to the owner chat. Never rejects; await it where the handler
// would otherwise return before the alert goes out (crons, webhooks).
export function sendOwner(text: string): Promise<void> {
  return send(OWNER_CHAT, { text })
}

export function notifyOwner(text: string): void {
  void send(process.env.TELEGRAM_CHAT_ID ?? OWNER_CHAT, { text, disable_web_page_preview: true })
}
