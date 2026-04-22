const LLM_BASE_URL = "http://34.60.133.229:4000"
const LLM_API_KEY = "jtotFgxS1WQorT52LZym2ncyYzboliS6p04RqUwneFI"
const LLM_MODELS = ["gemini-2.0-flash-lite", "gemini-2.0-flash", "gemini-2.5-flash"]

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

  throw new Error(`LLM unavailable after ${LLM_MODELS.length} attempts: ${lastError}`)
}
