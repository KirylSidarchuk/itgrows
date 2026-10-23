import { after } from "next/server"

// Owner alerts in Telegram. Kept tiny and fire-and-forget: an alert must never
// break or slow the flow it reports on. The bot token comes only from TELEGRAM_BOT_TOKEN (set in
// Vercel since 23 Oct 2026, a new bot); without it alerts are skipped, never sent with a token in code.
const OWNER_CHAT = "372194458"

async function deliver(chatId: string, payload: Record<string, unknown>): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim()
  if (!token) {
    console.warn("[telegram] TELEGRAM_BOT_TOKEN is not set; owner alert skipped")
    return
  }
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, ...payload }),
  }).catch(() => null)
  if (!res?.ok) console.warn(`[telegram] owner alert not sent: ${res ? `HTTP ${res.status}` : "network error"}`)
}

// Vercel freezes a function once its response is sent, so a send nobody awaits can die in
// flight (a fire-and-forget feedback alert never arrived). after() keeps the function alive
// until the send settles; outside a request it throws and the send simply runs on its own.
function send(chatId: string, payload: Record<string, unknown>): Promise<void> {
  const task = deliver(chatId, payload)
  try {
    after(task)
  } catch {
    // not inside a request scope
  }
  return task
}

// Plain message to the owner chat. Never rejects, and is safe to fire and forget.
export function sendOwner(text: string): Promise<void> {
  return send(OWNER_CHAT, { text })
}

export function notifyOwner(text: string): void {
  void send(process.env.TELEGRAM_CHAT_ID ?? OWNER_CHAT, { text, disable_web_page_preview: true })
}
