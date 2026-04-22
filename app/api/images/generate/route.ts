import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"

export const maxDuration = 300

const PROXY_URL = "http://34.60.133.229:4000"
const LLM_API_KEY = "jtotFgxS1WQorT52LZym2ncyYzboliS6p04RqUwneFI"
const LLM_MODELS = ["gemini-2.0-flash-lite", "gemini-2.0-flash", "gemini-1.5-flash"]

export async function POST(req: NextRequest) {
  const internalSecret = process.env.CRON_SECRET
  const isInternal = internalSecret && req.headers.get("x-internal-secret") === internalSecret
  if (!isInternal) {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { title, keywords } = await req.json()

  // Build image prompt using LLM with retry + fallback models
  let imagePrompt = `Professional blog cover for: ${title}`
  let lastPromptError = ""
  for (let attempt = 0; attempt < LLM_MODELS.length; attempt++) {
    if (attempt > 0) await new Promise(r => setTimeout(r, 3000))
    try {
      const promptRes = await fetch(`${PROXY_URL}/v1/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${LLM_API_KEY}` },
        body: JSON.stringify({
          model: LLM_MODELS[attempt],
          messages: [{
            role: "user",
            content: `Create a concise image generation prompt (max 50 words) for a blog article cover image.
Article title: "${title}"
Keywords: ${Array.isArray(keywords) ? keywords.join(", ") : keywords}
The image should be: professional, photorealistic, suitable for a blog cover (1200x630px), no text in image.
Return ONLY the image prompt, nothing else.`
          }],
          temperature: 0.7,
        }),
      })
      if (!promptRes.ok) {
        lastPromptError = await promptRes.text()
        console.warn(`[images/generate] LLM prompt attempt ${attempt + 1} (${LLM_MODELS[attempt]}) failed: ${lastPromptError}`)
        continue
      }
      const promptData = await promptRes.json()
      const text = promptData.choices?.[0]?.message?.content?.trim()
      if (text) { imagePrompt = text; break }
    } catch (e) {
      lastPromptError = e instanceof Error ? e.message : String(e)
      console.warn(`[images/generate] LLM prompt attempt ${attempt + 1} (${LLM_MODELS[attempt]}) error: ${lastPromptError}`)
    }
  }

  // Generate image with retry
  let imgData: unknown = null
  let lastImgError = ""
  const IMAGE_MODELS = ["gemini-3-pro-image-preview", "gemini-2.0-flash-preview-image-generation"]
  for (let attempt = 0; attempt < IMAGE_MODELS.length; attempt++) {
    if (attempt > 0) await new Promise(r => setTimeout(r, 3000))
    try {
      const imgRes = await fetch(`${PROXY_URL}/images/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${LLM_API_KEY}` },
        body: JSON.stringify({
          model: IMAGE_MODELS[attempt],
          prompt: imagePrompt,
        }),
      })
      if (!imgRes.ok) {
        lastImgError = await imgRes.text()
        console.warn(`[images/generate] Image attempt ${attempt + 1} (${IMAGE_MODELS[attempt]}) failed: ${lastImgError}`)
        continue
      }
      imgData = await imgRes.json()
      const parts = (imgData as { candidates?: Array<{ content?: { parts?: unknown[] } }> })?.candidates?.[0]?.content?.parts || []
      const inlineData = (parts as Array<{ inlineData?: { data?: string; mimeType?: string } }>).find(p => p?.inlineData)?.inlineData
      if (inlineData?.data) break
      imgData = null
    } catch (e) {
      lastImgError = e instanceof Error ? e.message : String(e)
      console.warn(`[images/generate] Image attempt ${attempt + 1} (${IMAGE_MODELS[attempt]}) error: ${lastImgError}`)
    }
  }

  if (!imgData) {
    return NextResponse.json({ error: `Image generation failed after all attempts. Last error: ${lastImgError}` }, { status: 500 })
  }

  const parts = (imgData as { candidates?: Array<{ content?: { parts?: unknown[] } }> })?.candidates?.[0]?.content?.parts || []
  const inlineData = (parts as Array<{ inlineData?: { data?: string; mimeType?: string } }>).find(p => p?.inlineData)?.inlineData

  if (!inlineData?.data) {
    return NextResponse.json({ error: "No image in response", raw: imgData }, { status: 500 })
  }

  const mimeType = inlineData.mimeType || "image/jpeg"
  const dataUrl = `data:${mimeType};base64,${inlineData.data}`
  return NextResponse.json({ url: dataUrl, prompt: imagePrompt })
}
