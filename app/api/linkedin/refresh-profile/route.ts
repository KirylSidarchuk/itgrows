import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { linkedinAccounts, linkedinBriefs } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"

const LLM_BASE_URL = "http://34.60.133.229:4000"
const LLM_MODEL = "gemini-2.5-flash-lite"
const LLM_API_KEY = "jtotFgxS1WQorT52LZym2ncyYzboliS6p04RqUwneFI"

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const userId = session.user.id

    // Accept optional profileUrl from request body
    const { profileUrl } = await req.json().catch(() => ({} as { profileUrl?: string })) as { profileUrl?: string }

    // Extract vanityName from profileUrl if provided
    const profileUrlVanity = profileUrl
      ? (profileUrl.match(/linkedin\.com\/in\/([^/?\s]+)/)?.[1] ?? null)
      : null

    // Get the user's personal LinkedIn account
    const [account] = await db
      .select()
      .from(linkedinAccounts)
      .where(and(eq(linkedinAccounts.userId, userId), eq(linkedinAccounts.pageType, "personal")))
      .limit(1)

    if (!account) {
      return NextResponse.json({
        success: false,
        reason: "no_account",
        message: "No LinkedIn account connected.",
      }, { status: 400 })
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
        console.log("[refresh-profile] /v2/me ok — vanityName:", vanityName, "headline:", profileHeadline)
        // Persist vanityName to DB if it was missing (fixes accounts connected before pageHandle was stored)
        if (vanityName && !account.pageHandle) {
          await db
            .update(linkedinAccounts)
            .set({ pageHandle: vanityName })
            .where(eq(linkedinAccounts.id, account.id))
          account.pageHandle = vanityName
          console.log("[refresh-profile] persisted vanityName to DB:", vanityName)
        }
        // If profileUrl provided a vanityName that overrides existing, update DB
        if (profileUrlVanity && profileUrlVanity !== account.pageHandle) {
          await db
            .update(linkedinAccounts)
            .set({ pageHandle: profileUrlVanity })
            .where(eq(linkedinAccounts.id, account.id))
          account.pageHandle = profileUrlVanity
          console.log("[refresh-profile] updated pageHandle from profileUrl:", profileUrlVanity)
        }
      } else {
        console.log("[refresh-profile] /v2/me failed — status:", meRes.status)
      }
    } catch (e) {
      console.log("[refresh-profile] /v2/me threw:", e)
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

    // Try to scrape public profile for richer data (headline, position, about)
    let scrapedHeadline: string | null = null
    let scrapedPosition: string | null = null
    let scrapedCompany: string | null = null
    let scrapedAbout: string | null = null
    const scraperVanity = profileUrlVanity ?? vanityName ?? account.pageHandle ?? null
    console.log("[refresh-profile] scraperVanity:", scraperVanity, "| vanityName:", vanityName, "| account.pageHandle:", account.pageHandle)
    if (scraperVanity) {
      try {
        const scraperUrl = process.env.LINKEDIN_SCRAPER_URL ?? "http://136.114.136.34:3002"
        const scraperKey = process.env.LINKEDIN_SCRAPER_KEY ?? "itgrows-scraper-2026"
        const scraperEndpoint = `${scraperUrl}/scrape?url=https://www.linkedin.com/in/${scraperVanity}`
        console.log("[refresh-profile] scraper fetch →", scraperEndpoint)
        const scraperRes = await fetch(scraperEndpoint, {
          headers: { "X-Scraper-Key": scraperKey },
          signal: AbortSignal.timeout(20000),
        })
        console.log("[refresh-profile] scraper status:", scraperRes.status)
        if (scraperRes.ok) {
          const scraped = await scraperRes.json() as {
            headline?: string | null
            currentPosition?: string | null
            currentCompany?: string | null
            about?: string | null
          }
          console.log("[refresh-profile] scraped data:", JSON.stringify(scraped))
          scrapedHeadline = scraped.headline ?? null
          scrapedPosition = scraped.currentPosition ?? null
          scrapedCompany = scraped.currentCompany ?? null
          scrapedAbout = scraped.about ?? null
        } else {
          const body = await scraperRes.text()
          console.log("[refresh-profile] scraper non-ok body:", body.slice(0, 200))
        }
      } catch (e) {
        console.log("[refresh-profile] scraper threw:", e)
      }
    } else {
      console.log("[refresh-profile] skipping scraper — no vanity name available")
    }

    // Merge: prefer scraped data over API data
    const effectiveHeadline = scrapedHeadline ?? profileHeadline
    const effectiveTitle = scrapedPosition ?? currentTitle
    const effectiveCompany = scrapedCompany ?? currentCompany

    console.log("[refresh-profile] effective data — headline:", effectiveHeadline, "| title:", effectiveTitle, "| company:", effectiveCompany)
    if (!effectiveHeadline && !effectiveTitle && !effectiveCompany) {
      console.log("[refresh-profile] → returning insufficient_data")
      return NextResponse.json({
        success: false,
        reason: "insufficient_data",
        message: "Your LinkedIn profile doesn't have enough public data (headline, current position) to auto-fill. Please fill in manually.",
      }, { status: 422 })
    }

    // Build profile summary for LLM
    const profileSummary = [
      profileName ? `Name: ${profileName}` : null,
      scraperVanity ? `LinkedIn URL: linkedin.com/in/${scraperVanity}` : null,
      effectiveHeadline ? `Headline: ${effectiveHeadline}` : null,
      effectiveTitle ? `Current job title: ${effectiveTitle}` : null,
      effectiveCompany ? `Current company: ${effectiveCompany}` : null,
      scrapedAbout ? `About: ${scrapedAbout.slice(0, 500)}` : null,
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
      companyName: inferred.company_name || effectiveCompany || null,
      targetAudience: inferred.target_audience || null,
      goals: inferred.goals || null,
      profileUrl: profileUrl || (scraperVanity ? `https://www.linkedin.com/in/${scraperVanity}` : null),
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

    return NextResponse.json({ success: true, brief })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
