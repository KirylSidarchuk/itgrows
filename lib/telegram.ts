import { after } from "next/server"

// Owner alerts in Telegram. Kept tiny and fire-and-forget: an alert must never
// break or slow the flow it reports on. TELEGRAM_BOT_TOKEN wins when set; until it is
// added in Vercel the bot's own token is the fallback (it is in git history anyway).
const OWNER_CHAT = "372194458"
const FALLBACK_TOKEN = "8213146538:AAH9ceXiIQ62-ICZJlUFx0psyd2nYq1gN7g"

async function deliver(chatId: string, payload: Record<string, unknown>): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim() || FALLBACK_TOKEN
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
