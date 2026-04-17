import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { linkedinAccounts, linkedinBriefs } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"

const LLM_BASE_URL = "http://34.60.133.229:4000"
const LLM_MODEL = "gemini-2.0-flash"
const LLM_API_KEY = "any-key"

export async function POST() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const userId = session.user.id

    // Get the user's personal LinkedIn account
    const [account] = await db
      .select()
      .from(linkedinAccounts)
      .where(and(eq(linkedinAccounts.userId, userId), eq(linkedinAccounts.pageType, "personal")))
      .limit(1)

    if (!account) {
      return NextResponse.json({ error: "No LinkedIn account connected" }, { status: 400 })
    }

    const accessToken = account.accessToken

    // Fetch basic profile via OpenID userinfo
    let profileName: string | null = null
    try {
      const profileRes = await fetch("https://api.linkedin.com/v2/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (profileRes.ok) {
        const profile = await profileRes.json() as { name?: string; given_name?: string }
        profileName = profile.name ?? profile.given_name ?? null
      }
    } catch {
      // non-fatal
    }

    // Fetch headline and vanityName from /v2/me
    let profileHeadline: string | null = null
    let vanityName: string | null = null
    try {
      const meRes = await fetch(
        "https://api.linkedin.com/v2/me?projection=(id,localizedFirstName,localizedLastName,headline,localizedHeadline,vanityName)",
        { headers: { Authorization: `Bearer ${accessToken}` } }
      )
      if (meRes.ok) {
        const meData = await meRes.json() as {
          localizedHeadline?: string
          vanityName?: string
        }
        profileHeadline = meData.localizedHeadline ?? null
        vanityName = meData.vanityName ?? null
      }
    } catch {
      // non-fatal
    }

    // Fetch current position
    let currentTitle: string | null = null
    let currentCompany: string | null = null
    try {
      const posRes = await fetch(
        "https://api.linkedin.com/v2/positions?projection=(elements*(title,companyName,description))",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "X-Restli-Protocol-Version": "2.0.0",
          },
        }
      )
      if (posRes.ok) {
        const posData = await posRes.json() as {
          elements?: Array<{ title?: string; companyName?: string }>
        }
        if (posData.elements && posData.elements.length > 0) {
          currentTitle = posData.elements[0].title ?? null
          currentCompany = posData.elements[0].companyName ?? null
        }
      }
    } catch {
      // non-fatal
    }

    if (!profileHeadline && !currentTitle && !currentCompany) {
      return NextResponse.json({ error: "Not enough profile data to infer brief" }, { status: 422 })
    }

    // Build profile summary for LLM
    const profileSummary = [
      profileName ? `Name: ${profileName}` : null,
      vanityName ? `LinkedIn URL: linkedin.com/in/${vanityName}` : null,
      profileHeadline ? `Headline: ${profileHeadline}` : null,
      currentTitle ? `Current job title: ${currentTitle}` : null,
      currentCompany ? `Current company: ${currentCompany}` : null,
    ].filter(Boolean).join("\n")

    // Call LLM to infer brief
    const llmRes = await fetch(`${LLM_BASE_URL}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LLM_API_KEY}`,
      },
      body: JSON.stringify({
        model: LLM_MODEL,
        messages: [{
          role: "user",
          content: `Based on this LinkedIn profile, infer content brief fields for a LinkedIn content strategy.

Profile:
${profileSummary}

IMPORTANT: Only use information explicitly present in the profile above. Do NOT invent or assume any data not provided. If a field cannot be determined from the profile, return null for that field.

Return ONLY valid JSON with these keys:
- niche: industry or market only if clearly identifiable from the profile (e.g. "SaaS", "B2B marketing", "fintech"), or null
- tone: one of "professional", "casual", or "inspirational" — default to "professional" if unclear
- company_name: company name only if explicitly present in the profile, or null
- target_audience: who they likely address only if inferable from the profile, or null
- goals: likely LinkedIn goals only if inferable from the profile, or null

Return only the JSON object, no markdown, no extra text.`,
        }],
        temperature: 0.3,
        max_tokens: 300,
      }),
    })

    if (!llmRes.ok) {
      return NextResponse.json({ error: "LLM inference failed" }, { status: 502 })
    }

    const llmData = await llmRes.json() as { choices?: Array<{ message: { content: string } }> }
    const rawContent = llmData.choices?.[0]?.message?.content?.trim() ?? ""
    const jsonMatch = rawContent.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json({ error: "LLM returned invalid JSON" }, { status: 502 })
    }

    const inferred = JSON.parse(jsonMatch[0]) as {
      niche?: string | null
      tone?: string | null
      company_name?: string | null
      target_audience?: string | null
      goals?: string | null
    }
    const tone = ["professional", "casual", "inspirational"].includes(inferred.tone ?? "")
      ? inferred.tone!
      : "professional"

    // Only persist fields with real values — never store hallucinated data
    const briefValues = {
      userId,
      niche: inferred.niche || null,
      tone,
      companyName: inferred.company_name || currentCompany || null,
      targetAudience: inferred.target_audience || null,
      goals: inferred.goals || null,
      isAutoFilled: true,
      updatedAt: new Date(),
    }

    // Upsert brief
    const [brief] = await db
      .insert(linkedinBriefs)
      .values(briefValues)
      .onConflictDoUpdate({
        target: linkedinBriefs.userId,
        set: briefValues,
      })
      .returning()

    return NextResponse.json({ brief })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
