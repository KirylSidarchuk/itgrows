import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"

const PROXY_URL = "http://34.60.133.229:4000"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { title, keywords } = await req.json()

  // Build image prompt using LLM
  const promptRes = await fetch(`${PROXY_URL}/v1/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gemini-2.0-flash",
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
  const promptData = await promptRes.json()
  const imagePrompt = promptData.choices?.[0]?.message?.content?.trim() || `Professional blog cover for: ${title}`

  // Generate image
  const imgRes = await fetch(`${PROXY_URL}/images/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gemini-3-pro-image-preview",
      prompt: imagePrompt,
    }),
  })

  if (!imgRes.ok) {
    const err = await imgRes.text()
    return NextResponse.json({ error: `Image generation failed: ${err}` }, { status: 500 })
  }

  const imgData = await imgRes.json()
  const parts = imgData?.candidates?.[0]?.content?.parts || []
  const inlineData = parts.find((p: { inlineData?: { data?: string; mimeType?: string } }) => p?.inlineData)?.inlineData

  if (!inlineData?.data) {
    return NextResponse.json({ error: "No image in response", raw: imgData }, { status: 500 })
  }

  const mimeType = inlineData.mimeType || "image/jpeg"
  const dataUrl = `data:${mimeType};base64,${inlineData.data}`
  return NextResponse.json({ url: dataUrl, prompt: imagePrompt })
}
