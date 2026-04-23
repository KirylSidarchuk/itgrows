import { callLLM } from "@/lib/llm-client"

const PROXY_URL = "http://34.60.133.229:4000"
const LLM_API_KEY = "jtotFgxS1WQorT52LZym2ncyYzboliS6p04RqUwneFI"

const IMAGE_MODELS = [
  "gemini-3-pro-image-preview",
  "gemini-2.0-flash-preview-image-generation",
  "gemini-2.0-flash",
]

const RETRIES_PER_MODEL = 2
const RETRY_DELAY_MS = 3000

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function tryGenerateImage(model: string, imagePrompt: string): Promise<string | null> {
  for (let attempt = 1; attempt <= RETRIES_PER_MODEL; attempt++) {
    const imgStart = Date.now()
    console.log(`[LLM] ${new Date().toISOString()} | caller=linkedin-image/generate | model=${model} | attempt=${attempt}/${RETRIES_PER_MODEL} | images/generate`)
    try {
      const imgRes = await fetch(`${PROXY_URL}/images/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${LLM_API_KEY}` },
        body: JSON.stringify({ model, prompt: imagePrompt }),
      })
      const imgDuration = Date.now() - imgStart
      if (!imgRes.ok) {
        console.log(`[LLM] ${new Date().toISOString()} | caller=linkedin-image/generate | model=${model} | attempt=${attempt} | status=${imgRes.status} | duration=${imgDuration}ms | FAILED`)
        if (attempt < RETRIES_PER_MODEL) await sleep(RETRY_DELAY_MS)
        continue
      }
      console.log(`[LLM] ${new Date().toISOString()} | caller=linkedin-image/generate | model=${model} | attempt=${attempt} | status=200 | duration=${imgDuration}ms | OK`)

      const imgData = await imgRes.json() as {
        candidates?: Array<{ content: { parts: Array<{ inlineData?: { data?: string; mimeType?: string } }> } }>
      }
      const parts = imgData?.candidates?.[0]?.content?.parts || []
      const inlineData = parts.find((p) => p?.inlineData)?.inlineData
      if (!inlineData?.data) {
        console.log(`[LLM] ${new Date().toISOString()} | caller=linkedin-image/generate | model=${model} | attempt=${attempt} | NO_INLINE_DATA`)
        if (attempt < RETRIES_PER_MODEL) await sleep(RETRY_DELAY_MS)
        continue
      }

      const mimeType = inlineData.mimeType || "image/jpeg"
      return `data:${mimeType};base64,${inlineData.data}`
    } catch (err) {
      const imgDuration = Date.now() - imgStart
      console.log(`[LLM] ${new Date().toISOString()} | caller=linkedin-image/generate | model=${model} | attempt=${attempt} | duration=${imgDuration}ms | ERROR: ${err}`)
      if (attempt < RETRIES_PER_MODEL) await sleep(RETRY_DELAY_MS)
    }
  }
  return null
}

/**
 * Generates a LinkedIn post cover image as a base64 data URL.
 * Tries 3 models × 2 attempts each = 6 total attempts.
 * Returns null if all attempts fail.
 */
export async function generatePostImage(postContent: string, niche: string): Promise<string | null> {
  let imagePrompt = `Professional LinkedIn post cover for ${niche}`
  try {
    imagePrompt = await callLLM(
      [{
        role: "user",
        content: `Create a concise image generation prompt (max 50 words) for a LinkedIn post cover image.
Post niche: "${niche}"
Post content preview: "${postContent.slice(0, 200)}"
The image should be: professional, photorealistic, suitable for a LinkedIn post (1200x627px), no text in image.
Return ONLY the image prompt, nothing else.`,
      }],
      { caller: "linkedin-image/prompt", temperature: 0.7 }
    )
    imagePrompt = imagePrompt.trim() || `Professional LinkedIn post cover for ${niche}`
  } catch {
    // Fall back to default prompt
  }

  for (const model of IMAGE_MODELS) {
    const result = await tryGenerateImage(model, imagePrompt)
    if (result) return result
    console.log(`[linkedin-image] Model ${model} exhausted all retries, trying next model`)
  }

  console.log(`[linkedin-image] All models failed, returning null`)
  return null
}
