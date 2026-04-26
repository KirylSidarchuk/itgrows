import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { linkedinAccounts, linkedinBriefs } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"

const LLM_BASE_URL = "http://34.60.133.229:4000"
const LLM_MODEL = "gemini-2.5-flash-lite"
const LLM_API_KEY = "jtotFgxS1WQorT52LZym2ncyYzboliS6p04RqUwneFI"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get("code")
  const state = searchParams.get("state") // userId
  const error = searchParams.get("error")

  if (error || !code || !state) {
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/cabinet?error=oauth_denied`)
  }

  try {
    // Exchange code for access token
    const tokenRes = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: `${process.env.NEXTAUTH_URL}/api/linkedin/callback`,
        client_id: process.env.LINKEDIN_CLIENT_ID!,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
      }),
    })

    if (!tokenRes.ok) {
      const errText = await tokenRes.text()
      console.error("LinkedIn token exchange failed:", errText)
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/cabinet?error=token_failed`)
    }

    const tokenData = await tokenRes.json() as {
      access_token: string
      expires_in: number
    }

    const accessToken = tokenData.access_token
    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000)

    // Fetch user profile via OpenID userinfo endpoint
    const profileRes = await fetch("https://api.linkedin.com/v2/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    let personUrn: string | null = null
    let pageName: string | null = null
    let pageHandle: string | null = null
    let profileHeadline: string | null = null

    if (profileRes.ok) {
      const profile = await profileRes.json() as {
        sub?: string
        name?: string
        email?: string
        given_name?: string
        family_name?: string
      }
      // sub is the person URN id (numeric), build urn
      if (profile.sub) {
        personUrn = `urn:li:person:${profile.sub}`
      }
      pageName = profile.name ?? profile.given_name ?? null
    }

    // Fetch additional LinkedIn profile data (headline, vanityName)
    try {
      const meRes = await fetch(
        "https://api.linkedin.com/v2/me?projection=(id,localizedFirstName,localizedLastName,headline,localizedHeadline,vanityName)",
        { headers: { Authorization: `Bearer ${accessToken}` } }
      )
      if (meRes.ok) {
        const meData = await meRes.json() as {
          localizedHeadline?: string
          headline?: { localized?: Record<string, string> }
          vanityName?: string
        }
        profileHeadline = meData.localizedHeadline ?? null
        if (!pageHandle && meData.vanityName) {
          pageHandle = meData.vanityName
        }
      }
    } catch {
      // Non-fatal: continue without headline
    }

    // Fetch positions (job history) — may fail on some accounts
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
          const first = posData.elements[0]
          currentTitle = first.title ?? null
          currentCompany = first.companyName ?? null
        }
      }
    } catch {
      // Non-fatal: continue without positions
    }

    // Save personal account
    const userId = state

    // Upsert personal account — replace if already exists
    const existing = await db
      .select({ id: linkedinAccounts.id })
      .from(linkedinAccounts)
      .where(and(eq(linkedinAccounts.userId, userId), eq(linkedinAccounts.pageType, "personal")))
      .limit(1)

    if (existing.length > 0) {
      await db
        .update(linkedinAccounts)
        .set({
          accessToken,
          expiresAt,
          linkedinPersonUrn: personUrn,
          pageName,
          pageHandle,
        })
        .where(eq(linkedinAccounts.id, existing[0].id))
    } else {
      await db.insert(linkedinAccounts).values({
        userId,
        accessToken,
        expiresAt,
        linkedinPersonUrn: personUrn,
        pageType: "personal",
        pageName,
        pageHandle,
      })
    }

    // Try to scrape public profile for richer data
    let scrapedHeadline: string | null = null
    let scrapedPosition: string | null = null
    let scrapedCompany: string | null = null
    let scrapedAbout: string | null = null
    if (pageHandle) {
      try {
        const scraperUrl = process.env.LINKEDIN_SCRAPER_URL ?? "http://136.114.136.34:3002"
        const scraperKey = process.env.LINKEDIN_SCRAPER_KEY ?? "itgrows-scraper-2026"
        const scraperRes = await fetch(
          `${scraperUrl}/scrape?url=https://www.linkedin.com/in/${pageHandle}`,
          {
            headers: { "X-Scraper-Key": scraperKey },
            signal: AbortSignal.timeout(20000),
          }
        )
        if (scraperRes.ok) {
          const scraped = await scraperRes.json() as {
            headline?: string | null
            currentPosition?: string | null
            currentCompany?: string | null
            about?: string | null
          }
          scrapedHeadline = scraped.headline ?? null
          scrapedPosition = scraped.currentPosition ?? null
          scrapedCompany = scraped.currentCompany ?? null
          scrapedAbout = scraped.about ?? null
        }
      } catch {
        // Non-fatal: fall back to API data
      }
    }

    // Merge: prefer scraped data over API data
    const effectiveHeadline = scrapedHeadline ?? profileHeadline
    const effectiveTitle = scrapedPosition ?? currentTitle
    const effectiveCompany = scrapedCompany ?? currentCompany

    // Auto-fill content brief if no brief exists yet
    try {
      const existingBrief = await db
        .select({ id: linkedinBriefs.id })
        .from(linkedinBriefs)
        .where(eq(linkedinBriefs.userId, userId))
        .limit(1)

      const hasRealProfileData = !!(effectiveHeadline || effectiveTitle || effectiveCompany)
      if (existingBrief.length === 0 && hasRealProfileData) {
        // Build profile summary for LLM
        const profileSummary = [
          effectiveHeadline ? `Headline: ${effectiveHeadline}` : null,
          effectiveTitle ? `Current job title: ${effectiveTitle}` : null,
          effectiveCompany ? `Current company: ${effectiveCompany}` : null,
          scrapedAbout ? `About: ${scrapedAbout.slice(0, 500)}` : null,
        ].filter(Boolean).join("\n")

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

        if (llmRes.ok) {
          const llmData = await llmRes.json() as { choices?: Array<{ message: { content: string } }> }
          const rawContent = llmData.choices?.[0]?.message?.content?.trim() ?? ""
          const jsonMatch = rawContent.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
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

            // Only save fields that have real values — never persist hallucinated nulls as empty strings
            await db.insert(linkedinBriefs).values({
              userId,
              niche: inferred.niche || null,
              tone,
              companyName: inferred.company_name || effectiveCompany || null,
              targetAudience: inferred.target_audience || null,
              goals: inferred.goals || null,
              isAutoFilled: true,
              updatedAt: new Date(),
            }).onConflictDoNothing()
          }
        }
      } else if (existingBrief.length === 0 && !hasRealProfileData) {
        console.log("Skipping brief auto-fill: insufficient profile data (no headline, position, or scraped data available)")
      }
    } catch (briefErr) {
      console.error("Auto-fill brief error (non-fatal):", briefErr)
    }

    // Fetch org pages where user is admin
    try {
      const orgsRes = await fetch(
        "https://api.linkedin.com/v2/organizationAcls?q=roleAssignee&role=ADMINISTRATOR&state=APPROVED",
        { headers: { Authorization: `Bearer ${accessToken}` } }
      )

      if (orgsRes.ok) {
        const orgsData = await orgsRes.json() as {
          elements?: Array<{
            organization: string // urn:li:organization:xxx
          }>
        }

        if (orgsData.elements && orgsData.elements.length > 0) {
          for (const elem of orgsData.elements) {
            const orgUrn = elem.organization
            const orgId = orgUrn.split(":").pop()

            // Fetch org details
            let orgName: string | null = null
            let orgHandle: string | null = null
            try {
              const orgRes = await fetch(
                `https://api.linkedin.com/v2/organizations/${orgId}`,
                { headers: { Authorization: `Bearer ${accessToken}` } }
              )
              if (orgRes.ok) {
                const orgDetail = await orgRes.json() as {
                  localizedName?: string
                  vanityName?: string
                }
                orgName = orgDetail.localizedName ?? null
                orgHandle = orgDetail.vanityName ?? null
              }
            } catch {
              // ignore org detail fetch errors
            }

            // Upsert org account
            const existingOrg = await db
              .select({ id: linkedinAccounts.id })
              .from(linkedinAccounts)
              .where(and(eq(linkedinAccounts.userId, userId), eq(linkedinAccounts.linkedinOrgUrn, orgUrn)))
              .limit(1)

            if (existingOrg.length > 0) {
              await db
                .update(linkedinAccounts)
                .set({ accessToken, expiresAt, pageName: orgName, pageHandle: orgHandle })
                .where(eq(linkedinAccounts.id, existingOrg[0].id))
            } else {
              await db.insert(linkedinAccounts).values({
                userId,
                accessToken,
                expiresAt,
                linkedinPersonUrn: personUrn,
                linkedinOrgUrn: orgUrn,
                pageType: "organization",
                pageName: orgName,
                pageHandle: orgHandle,
              })
            }
          }
        }
      }
    } catch (orgErr) {
      console.error("Failed to fetch LinkedIn organizations:", orgErr)
      // Non-fatal: personal account is already saved
    }

    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/cabinet?connected=1`)
  } catch (err) {
    console.error("LinkedIn callback error:", err)
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/cabinet?error=server_error`)
  }
}
