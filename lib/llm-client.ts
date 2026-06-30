const LLM_BASE_URL = "http://34.60.133.229:4000"
const LLM_API_KEY = process.env.LLM_API_KEY ?? "jtotFgxS1WQorT52LZym2ncyYzboliS6p04RqUwneFI"
const LLM_MODELS = ["gemini-2.5-flash-lite", "gemini-2.5-flash", "gemini-2.5-pro"]

// OpenAI fallback — used only when the primary gateway is unavailable.
const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const OPENAI_TEXT_MODEL = process.env.OPENAI_TEXT_MODEL ?? "gpt-5.4-mini"
const OPENAI_IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-2"
const OPENAI_IMAGE_QUALITY = process.env.OPENAI_IMAGE_QUALITY ?? "medium"

interface LLMMessage {
  role: "user" | "assistant" | "system"
  content: string
}

interface LLMOptions {
  max_tokens?: number
  temperature?: number
  caller?: string // which route is calling (for logging)
}

export async function callLLM(messages: LLMMessage[], options: LLMOptions = {}): Promise<string> {
  const { caller = "unknown", ...params } = options

  let lastError = ""
  for (let attempt = 0; attempt < LLM_MODELS.length; attempt++) {
    const model = LLM_MODELS[attempt]
    if (attempt > 0) await new Promise(r => setTimeout(r, 3000))

    const start = Date.now()
    console.log(`[LLM] ${new Date().toISOString()} | caller=${caller} | model=${model} | attempt=${attempt + 1}`)

    try {
      const res = await fetch(`${LLM_BASE_URL}/v1/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${LLM_API_KEY}`,
        },
        body: JSON.stringify({
          model,
          messages,
          ...params,
        }),
      })

      const duration = Date.now() - start

      if (!res.ok) {
        const errText = await res.text()
        lastError = errText
        console.log(`[LLM] ${new Date().toISOString()} | caller=${caller} | model=${model} | attempt=${attempt + 1} | status=${res.status} | duration=${duration}ms | FAILED`)
        continue
      }

      const data = await res.json() as { choices: Array<{ message: { content: string } }> }
      const content = data.choices?.[0]?.message?.content ?? ""

      console.log(`[LLM] ${new Date().toISOString()} | caller=${caller} | model=${model} | attempt=${attempt + 1} | status=200 | duration=${duration}ms | chars=${content.length} | OK`)

      return content
    } catch (e) {
      const duration = Date.now() - start
      lastError = e instanceof Error ? e.message : String(e)
      console.log(`[LLM] ${new Date().toISOString()} | caller=${caller} | model=${model} | attempt=${attempt + 1} | duration=${duration}ms | ERROR: ${lastError}`)
    }
  }

  // All gateway models failed → fall back to OpenAI (if configured).
  if (OPENAI_API_KEY) {
    const start = Date.now()
    console.log(`[LLM] ${new Date().toISOString()} | caller=${caller} | FALLBACK=openai | model=${OPENAI_TEXT_MODEL}`)
    try {
      const content = await openaiChat(messages, params)
      console.log(`[LLM] ${new Date().toISOString()} | caller=${caller} | FALLBACK=openai | model=${OPENAI_TEXT_MODEL} | duration=${Date.now() - start}ms | chars=${content.length} | OK`)
      if (content) return content
    } catch (e) {
      lastError = e instanceof Error ? e.message : String(e)
      console.log(`[LLM] ${new Date().toISOString()} | caller=${caller} | FALLBACK=openai | ERROR: ${lastError}`)
    }
  }

  throw new Error(`LLM unavailable after ${LLM_MODELS.length} attempts: ${lastError}`)
}

// --- OpenAI fallback helpers ---

async function openaiChat(messages: LLMMessage[], params: { max_tokens?: number; temperature?: number }): Promise<string> {
  if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY not set")
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${OPENAI_API_KEY}` },
    // gpt-5.x: no `temperature` override, and use `max_completion_tokens` (room for reasoning + output).
    body: JSON.stringify({
      model: OPENAI_TEXT_MODEL,
      messages,
      max_completion_tokens: Math.max(params.max_tokens ?? 0, 16000),
    }),
  })
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${(await res.text()).slice(0, 200)}`)
  const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> }
  return data.choices?.[0]?.message?.content ?? ""
}

// Image generation via OpenAI (fallback for the gateway image models).
// Returns a base64 data URL, or null on failure.
export async function openaiGenerateImage(prompt: string): Promise<string | null> {
  if (!OPENAI_API_KEY) return null
  const start = Date.now()
  try {
    const res = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${OPENAI_API_KEY}` },
      body: JSON.stringify({ model: OPENAI_IMAGE_MODEL, prompt, size: "1024x1024", quality: OPENAI_IMAGE_QUALITY, n: 1 }),
    })
    if (!res.ok) {
      console.log(`[LLM] ${new Date().toISOString()} | caller=openai-image | model=${OPENAI_IMAGE_MODEL} | status=${res.status} | FAILED: ${(await res.text()).slice(0, 150)}`)
      return null
    }
    const data = await res.json() as { data?: Array<{ b64_json?: string }> }
    const b64 = data.data?.[0]?.b64_json
    console.log(`[LLM] ${new Date().toISOString()} | caller=openai-image | model=${OPENAI_IMAGE_MODEL} | duration=${Date.now() - start}ms | ${b64 ? "OK" : "NO_DATA"}`)
    return b64 ? `data:image/png;base64,${b64}` : null
  } catch (e) {
    console.log(`[LLM] ${new Date().toISOString()} | caller=openai-image | ERROR: ${e instanceof Error ? e.message : String(e)}`)
    return null
  }
}
