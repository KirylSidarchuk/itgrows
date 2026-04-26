import { NextRequest, NextResponse } from "next/server"

const LLM_KEY = "jtotFgxS1WQorT52LZym2ncyYzboliS6p04RqUwneFI"
const LLM_BASE = "http://34.60.133.229:4000"

const IMAGE_MODELS = [
  "gemini-3-pro-image-preview",
  "gemini-2.5-pro",
  
]

async function generateImageForPost(postContent: string): Promise<string | null> {
  // Get a short image prompt
  let imagePrompt = "Professional LinkedIn post cover, business professional, modern office"
  try {
    const promptRes = await fetch(`${LLM_BASE}/v1/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${LLM_KEY}` },
      body: JSON.stringify({
        model: "gemini-2.5-flash-lite",
        messages: [{
          role: "user",
          content: `Write a 30-word image prompt for a LinkedIn post cover image. Post: "${postContent.slice(0, 200)}". Photorealistic, professional, no text in image. Return ONLY the prompt.`,
        }],
        max_tokens: 80,
        temperature: 0.7,
      }),
    })
    if (promptRes.ok) {
      const d = await promptRes.json() as { choices?: Array<{ message?: { content?: string } }> }
      const p = d.choices?.[0]?.message?.content?.trim()
      if (p) imagePrompt = p
    }
  } catch { /* use default */ }

  // Try each image model once
  for (const model of IMAGE_MODELS) {
    try {
      const imgRes = await fetch(`${LLM_BASE}/images/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${LLM_KEY}` },
        body: JSON.stringify({ model, prompt: imagePrompt }),
      })
      if (!imgRes.ok) continue
      const imgData = await imgRes.json() as {
        candidates?: Array<{ content: { parts: Array<{ inlineData?: { data?: string; mimeType?: string } }> } }>
      }
      const parts = imgData?.candidates?.[0]?.content?.parts ?? []
      const inlineData = parts.find((p) => p?.inlineData)?.inlineData
      if (inlineData?.data) {
        const mime = inlineData.mimeType ?? "image/jpeg"
        return `data:${mime};base64,${inlineData.data}`
      }
    } catch { /* try next model */ }
  }
  return null
}

export async function POST(req: NextRequest) {
  const body = await req.json() as { thoughts?: string }
  const thoughts = (body.thoughts ?? "").trim().slice(0, 1000)

  if (!thoughts || thoughts.length < 10) {
    return NextResponse.json({ error: "Too short" }, { status: 400 })
  }

  const currentYear = new Date().getFullYear()

  const prompt = `You are a top LinkedIn ghostwriter. A user shared a few thoughts about themselves:

"${thoughts}"

Write 3 distinct LinkedIn posts for this person. Each post should:
- Sound like a real human professional, NOT generic AI
- Be 150-250 words
- Have a strong hook (first line stops the scroll)
- Tell a story, share insight, or challenge a common belief
- End with a subtle call to action or thought-provoking question
- Be relevant to ${currentYear}
- NOT use clichés like "In today's fast-paced world", "game-changer", "leverage", "synergy"

Make each post feel different in tone and angle:
Post 1: Personal story or lesson learned
Post 2: Bold opinion or contrarian take
Post 3: Practical insight or framework

Return ONLY a JSON array of 3 strings, each string is one complete post. No markdown, no extra text.
Example format: ["post 1 text here", "post 2 text here", "post 3 text here"]`

  try {
    // Generate posts text
    const res = await fetch(`${LLM_BASE}/v1/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${LLM_KEY}` },
      body: JSON.stringify({
        model: "gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.85,
        max_tokens: 2000,
      }),
    })

    if (!res.ok) {
      return NextResponse.json({ error: "Generation failed" }, { status: 500 })
    }

    const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> }
    const text = data.choices?.[0]?.message?.content ?? ""

    const match = text.match(/\[[\s\S]*\]/)
    if (!match) {
      return NextResponse.json({ error: "Parse failed" }, { status: 500 })
    }

    const posts = JSON.parse(match[0]) as string[]
    if (!Array.isArray(posts) || posts.length === 0) {
      return NextResponse.json({ error: "Invalid response" }, { status: 500 })
    }

    const finalPosts = posts.slice(0, 3)

    // Generate images in parallel for all posts
    const images = await Promise.all(finalPosts.map((p) => generateImageForPost(p)))

    return NextResponse.json({ posts: finalPosts, images })
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
