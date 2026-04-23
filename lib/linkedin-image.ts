import { callLLM } from "@/lib/llm-client"

const PROXY_URL = "http://34.60.133.229:4000"
const LLM_API_KEY = "jtotFgxS1WQorT52LZym2ncyYzboliS6p04RqUwneFI"

const IMAGE_MODELS = [
  "gemini-3-pro-image-preview",
  "gemini-2.0-flash-preview-image-generation",
]

const RETRIES_PER_MODEL = 2
const RETRY_DELAY_MS = 3000

// Branded SVG fallback: dark background, gradient accent, "itgrows.ai" text
const FALLBACK_SVG = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="627" viewBox="0 0 1200 627">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0f172a;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1e293b;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#6366f1;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#22d3ee;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="1200" height="627" fill="url(#bg)" />
  <rect x="0" y="560" width="1200" height="6" fill="url(#accent)" />
  <text x="600" y="290" font-family="Arial, Helvetica, sans-serif" font-size="96" font-weight="700" fill="white" text-anchor="middle" dominant-baseline="middle" letter-spacing="-2">itgrows.ai</text>
  <text x="600" y="380" font-family="Arial, Helvetica, sans-serif" font-size="32" fill="#94a3b8" text-anchor="middle" dominant-baseline="middle" letter-spacing="4">GROW SMARTER WITH AI</text>
</svg>`
).toString("base64")

const FALLBACK_IMAGE_URL = `data:image/svg+xml;base64,${FALLBACK_SVG}`

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
 * Tries multiple models with retries. Falls back to a branded SVG if all fail.
 * Never returns null.
 */
export async function generatePostImage(postContent: string, niche: string): Promise<string> {
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

  console.log(`[linkedin-image] All models failed, using branded SVG fallback`)
  return FALLBACK_IMAGE_URL
}
