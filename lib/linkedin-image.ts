import { callLLM } from "@/lib/llm-client"

const PROXY_URL = "http://34.60.133.229:4000"
const LLM_API_KEY = "jtotFgxS1WQorT52LZym2ncyYzboliS6p04RqUwneFI"

/**
 * Generates a LinkedIn post cover image as a base64 data URL.
 * Returns null if generation fails.
 */
export async function generatePostImage(postContent: string, niche: string): Promise<string | null> {
  try {
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

    const imgStart = Date.now()
    console.log(`[LLM] ${new Date().toISOString()} | caller=linkedin-image/generate | model=gemini-3-pro-image-preview | images/generate`)
    const imgRes = await fetch(`${PROXY_URL}/images/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${LLM_API_KEY}` },
      body: JSON.stringify({
        model: "gemini-3-pro-image-preview",
        prompt: imagePrompt,
      }),
    })
    const imgDuration = Date.now() - imgStart
    if (!imgRes.ok) {
      console.log(`[LLM] ${new Date().toISOString()} | caller=linkedin-image/generate | model=gemini-3-pro-image-preview | status=${imgRes.status} | duration=${imgDuration}ms | FAILED`)
      return null
    }
    console.log(`[LLM] ${new Date().toISOString()} | caller=linkedin-image/generate | model=gemini-3-pro-image-preview | status=200 | duration=${imgDuration}ms | OK`)

    const imgData = await imgRes.json() as {
      candidates?: Array<{ content: { parts: Array<{ inlineData?: { data?: string; mimeType?: string } }> } }>
    }
    const parts = imgData?.candidates?.[0]?.content?.parts || []
    const inlineData = parts.find((p) => p?.inlineData)?.inlineData
    if (!inlineData?.data) return null

    const mimeType = inlineData.mimeType || "image/jpeg"
    return `data:${mimeType};base64,${inlineData.data}`
  } catch {
    return null
  }
}
