import { callLLM, openaiGenerateImage } from "@/lib/llm-client"

const PROXY_URL = "http://34.60.133.229:4000"
const LLM_API_KEY = process.env.LLM_API_KEY ?? "jtotFgxS1WQorT52LZym2ncyYzboliS6p04RqUwneFI"

const IMAGE_MODELS = [
  "gemini-3-pro-image-preview",
  "gemini-2.5-pro",
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

const IMAGE_STYLE_SUFFIX: Record<string, string | null> = {
  ai_art: "",
  minimalist: "minimalist flat design, clean geometric shapes, professional, no photorealism",
  photorealistic: "professional photography style, realistic, high quality photo",
  infographic: "clean infographic style, data visualization, professional business graphic",
  no_image: null,
}

/**
 * Generates a LinkedIn post cover image as a base64 data URL.
 * Tries 3 models × 2 attempts each = 6 total attempts.
 * Returns null if all attempts fail or imageStyle is "no_image".
 */
export async function generatePostImage(postContent: string, niche: string, imageStyle?: string | null): Promise<string | null> {
  const style = imageStyle ?? "ai_art"
  const styleSuffix = IMAGE_STYLE_SUFFIX[style]

  // Skip image generation for "no_image" style
  if (styleSuffix === null) return null

  let imagePrompt = `Professional LinkedIn post cover for ${niche}`
  try {
    const styleHint = styleSuffix ? ` Style: ${styleSuffix}.` : " The image should be: professional, photorealistic, suitable for a LinkedIn post (1200x627px), no text in image."
    imagePrompt = await callLLM(
      [{
        role: "user",
        content: `You are choosing the image for a LinkedIn post. Work in two steps.

STEP 1 — read the whole post and answer for yourself, without writing it down:
  - What does this post actually argue? Not its subject: its claim.
  - What tension, risk or uncomfortable truth sits underneath that claim?
  - What should a reader feel or reconsider after reading it?

STEP 2 — write an image prompt (max 50 words) that depicts THAT tension, not the subject matter.

The difference matters. A post about trust is not people collaborating around a table — it is
whether one person will voice the objection everyone else is swallowing. A post about
accountability is not a handshake. Depict the moment, the consequence or the choice, not the
topic label.

NEVER depict: people seated around a conference table, handshakes, generic teams smiling at a
laptop, rising arrows or bar charts, lightbulbs, jigsaw pieces, chess pieces, or a lone figure
looking out of a high window. These are the clichés this instruction exists to avoid.

No text, letters or numbers anywhere in the image.

The post:
"""
${postContent.slice(0, 2600)}
"""

Field for context only (do not illustrate it literally): ${niche}.${styleHint}

Return ONLY the image prompt, nothing else.`,
      }],
      { caller: "linkedin-image/prompt", temperature: 0.7 }
    )
    imagePrompt = imagePrompt.trim() || `Professional LinkedIn post cover for ${niche}`
    if (styleSuffix) imagePrompt = `${imagePrompt}, ${styleSuffix}`
  } catch {
    // Fall back to default prompt
    if (styleSuffix) imagePrompt = `${imagePrompt}, ${styleSuffix}`
  }

  for (const model of IMAGE_MODELS) {
    const result = await tryGenerateImage(model, imagePrompt)
    if (result) return result
    console.log(`[linkedin-image] Model ${model} exhausted all retries, trying next model`)
  }

  // Gateway image models all failed → OpenAI fallback.
  const openaiImg = await openaiGenerateImage(imagePrompt)
  if (openaiImg) {
    console.log(`[linkedin-image] OpenAI fallback succeeded`)
    return openaiImg
  }

  console.log(`[linkedin-image] All models failed, returning null`)
  return null
}
