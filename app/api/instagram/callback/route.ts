import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { instagramAccounts } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get("code")
  const state = searchParams.get("state") // userId
  const error = searchParams.get("error")

  if (error || !code || !state) {
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/cabinet?error=oauth_denied`)
  }

  try {
    // Exchange code for short-lived access token
    const tokenRes = await fetch("https://graph.facebook.com/v19.0/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.INSTAGRAM_CLIENT_ID!,
        client_secret: process.env.INSTAGRAM_CLIENT_SECRET!,
        grant_type: "authorization_code",
        redirect_uri: `${process.env.NEXTAUTH_URL}/api/instagram/callback`,
        code,
      }),
    })

    if (!tokenRes.ok) {
      const errText = await tokenRes.text()
      console.error("Instagram token exchange failed:", errText)
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/cabinet?error=token_failed`)
    }

    const tokenData = await tokenRes.json() as {
      access_token: string
      token_type: string
    }

    const shortLivedToken = tokenData.access_token

    // Exchange short-lived token for long-lived token
    const longTokenRes = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?` +
      new URLSearchParams({
        grant_type: "fb_exchange_token",
        client_id: process.env.INSTAGRAM_CLIENT_ID!,
        client_secret: process.env.INSTAGRAM_CLIENT_SECRET!,
        fb_exchange_token: shortLivedToken,
      })
    )

    let accessToken = shortLivedToken
    let tokenExpiresAt: Date | null = null

    if (longTokenRes.ok) {
      const longTokenData = await longTokenRes.json() as {
        access_token: string
        token_type: string
        expires_in?: number
      }
      accessToken = longTokenData.access_token
      if (longTokenData.expires_in) {
        tokenExpiresAt = new Date(Date.now() + longTokenData.expires_in * 1000)
      }
    } else {
      console.warn("Failed to get long-lived Instagram token, using short-lived token")
    }

    // Get Facebook pages the user manages
    const pagesRes = await fetch(
      `https://graph.facebook.com/v19.0/me/accounts?access_token=${accessToken}`
    )

    if (!pagesRes.ok) {
      console.error("Failed to fetch Facebook pages:", await pagesRes.text())
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/cabinet?error=pages_failed`)
    }

    const pagesData = await pagesRes.json() as {
      data?: Array<{
        id: string
        name: string
        access_token: string
      }>
    }

    const pages = pagesData.data ?? []

    // Find the first page with a linked Instagram Business Account
    let instagramUserId: string | null = null
    let instagramUsername: string | null = null
    let instagramName: string | null = null
    let instagramProfilePicture: string | null = null
    let pageAccessToken = accessToken

    for (const page of pages) {
      try {
        const igRes = await fetch(
          `https://graph.facebook.com/v19.0/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`
        )
        if (!igRes.ok) continue

        const igData = await igRes.json() as {
          instagram_business_account?: { id: string }
        }

        if (!igData.instagram_business_account?.id) continue

        instagramUserId = igData.instagram_business_account.id
        pageAccessToken = page.access_token

        // Fetch Instagram profile details
        const profileRes = await fetch(
          `https://graph.facebook.com/v19.0/${instagramUserId}?fields=username,name,profile_picture_url&access_token=${pageAccessToken}`
        )
        if (profileRes.ok) {
          const profile = await profileRes.json() as {
            username?: string
            name?: string
            profile_picture_url?: string
          }
          instagramUsername = profile.username ?? null
          instagramName = profile.name ?? null
          instagramProfilePicture = profile.profile_picture_url ?? null
        }

        break
      } catch {
        // Try next page
      }
    }

    if (!instagramUserId) {
      console.warn("No Instagram Business Account found for user:", state)
      // Still save the connection with what we have — user can link page later
    }

    const userId = state

    // Upsert instagram account — one per user
    const existing = await db
      .select({ id: instagramAccounts.id })
      .from(instagramAccounts)
      .where(eq(instagramAccounts.userId, userId))
      .limit(1)

    if (existing.length > 0) {
      await db
        .update(instagramAccounts)
        .set({
          instagramUserId,
          username: instagramUsername,
          name: instagramName,
          profilePicture: instagramProfilePicture,
          accessToken: pageAccessToken,
          tokenExpiresAt,
          updatedAt: new Date(),
        })
        .where(eq(instagramAccounts.id, existing[0].id))
    } else {
      await db.insert(instagramAccounts).values({
        userId,
        instagramUserId,
        username: instagramUsername,
        name: instagramName,
        profilePicture: instagramProfilePicture,
        accessToken: pageAccessToken,
        tokenExpiresAt,
        updatedAt: new Date(),
      })
    }

    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/cabinet?connected=instagram`)
  } catch (err) {
    console.error("Instagram callback error:", err)
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/cabinet?error=server_error`)
  }
}
