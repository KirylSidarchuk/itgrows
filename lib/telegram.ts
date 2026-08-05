// Owner alerts in Telegram. Kept tiny and fire-and-forget: an alert must never
// break or slow the flow it reports on.
const BOT = process.env.TELEGRAM_BOT_TOKEN ?? "8213146538:AAH9ceXiIQ62-ICZJlUFx0psyd2nYq1gN7g"
const CHAT = process.env.TELEGRAM_CHAT_ID ?? "372194458"

export function notifyOwner(text: string): void {
  fetch(`https://api.telegram.org/bot${BOT}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: CHAT, text, disable_web_page_preview: true }),
  }).catch(() => {})
}
