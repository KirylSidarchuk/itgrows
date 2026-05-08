import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { twitterAccounts, oauthState } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { generateInitialXPosts } from "@/lib/x-generate"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get("code")
  const state = searchParams.get("state")
  const error = searchParams.get("error")

  if (error || !code || !state) {
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/cabinet?error=oauth_denied`)
  }

  // Look up state in DB
  const stateRows = await db
    .select()
    .from(oauthState)
    .where(and(eq(oauthState.state, state), eq(oauthState.platform, "twitter")))
    .limit(1)

  if (stateRows.length === 0) {
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/cabinet?error=oauth_denied`)
  }

  const stateRow = stateRows[0]
  const userId = stateRow.userId
  const codeVerifier = stateRow.codeVerifier
  const accountType = stateRow.accountType ?? "personal"

  // Delete the used state row
  await db.delete(oauthState).where(eq(oauthState.id, stateRow.id))

  try {
    // Exchange code for tokens using Basic auth (confidential client)
    const clientId = process.env.TWITTER_CLIENT_ID!
    const clientSecret = process.env.TWITTER_CLIENT_SECRET!
    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64")

    const tokenRes = await fetch("https://api.twitter.com/2/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Basic ${basicAuth}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: "https://itgrows.ai/api/x/callback",
        code_verifier: codeVerifier,
      }),
    })

    if (!tokenRes.ok) {
      const errText = await tokenRes.text()
      console.error("Twitter token exchange failed:", errText)
      const detail = encodeURIComponent(errText.slice(0, 200))
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/cabinet?error=token_failed&detail=${detail}`)
    }

    const tokenData = await tokenRes.json() as {
      access_token: string
      refresh_token?: string
      expires_in?: number
      token_type: string
    }

    const accessToken = tokenData.access_token
    const refreshToken = tokenData.refresh_token ?? null
    const expiresAt = tokenData.expires_in
      ? new Date(Date.now() + tokenData.expires_in * 1000)
      : null

    // Get user info
    const userRes = await fetch("https://api.twitter.com/2/users/me?user.fields=name,username", {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    if (!userRes.ok) {
      const errText = await userRes.text()
      console.error("Twitter user info failed:", errText)
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/cabinet?error=user_info_failed`)
    }

    const userData = await userRes.json() as {
      data: {
        id: string
        name: string
        username: string
      }
    }

    const twitterUserId = userData.data.id
    const username = userData.data.username
    const displayName = userData.data.name ?? null

    // Upsert twitterAccounts — keyed by (userId, accountType)
    const existing = await db
      .select({ id: twitterAccounts.id })
      .from(twitterAccounts)
      .where(and(
        eq(twitterAccounts.userId, userId),
        eq(twitterAccounts.accountType, accountType)
      ))
      .limit(1)

    if (existing.length > 0) {
      await db
        .update(twitterAccounts)
        .set({ accessToken, refreshToken, expiresAt, username, displayName, twitterUserId })
        .where(eq(twitterAccounts.id, existing[0].id))
    } else {
      await db.insert(twitterAccounts).values({
        userId,
        twitterUserId,
        username,
        displayName,
        accessToken,
        refreshToken,
        expiresAt,
        accountType,
      })
    }

    // Fire-and-forget: generate initial X posts if user has none
    generateInitialXPosts(userId, accountType).catch(() => {})

    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/cabinet?x_connected=1`)
  } catch (err) {
    console.error("Twitter callback error:", err)
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/cabinet?error=server_error`)
  }
}
