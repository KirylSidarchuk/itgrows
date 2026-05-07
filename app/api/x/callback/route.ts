import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { twitterAccounts } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { cookies } from "next/headers"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get("code")
  const state = searchParams.get("state")
  const error = searchParams.get("error")

  const cookieStore = await cookies()
  const storedState = cookieStore.get("x_oauth_state")?.value
  const codeVerifier = cookieStore.get("x_oauth_code_verifier")?.value

  // Clear cookies
  cookieStore.delete("x_oauth_state")
  cookieStore.delete("x_oauth_code_verifier")

  if (error || !code || !state || !storedState || !codeVerifier) {
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/cabinet?error=oauth_denied`)
  }

  if (state !== storedState) {
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/cabinet?error=state_mismatch`)
  }

  try {
    // Exchange code for tokens
    const clientId = process.env.TWITTER_CLIENT_ID!
    const clientSecret = process.env.TWITTER_CLIENT_SECRET!
    const basicAuth = Buffer.from(`${encodeURIComponent(clientId)}:${encodeURIComponent(clientSecret)}`).toString("base64")

    const tokenRes = await fetch("https://api.twitter.com/2/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${basicAuth}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: "https://itgrows.ai/api/x/callback",
        code_verifier: codeVerifier,
        client_id: clientId,
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

    // We need userId — get from the state (using state as userId like LinkedIn does)
    // However the state was a random value for CSRF protection, not user ID.
    // We need to look up the user by session. Since there is no session here (redirect),
    // we stored the userId in a separate cookie.
    // Let's check a userId cookie we should have set.
    // Actually, we need to re-architect: store userId in another cookie during connect.
    // But we didn't do that. The LinkedIn callback gets userId from state directly.
    // Let's use state to hold userId instead of a random value — but then we lose CSRF protection.
    // Best solution: store userId in a separate httpOnly cookie alongside state.
    // Since we already cleared cookies, we need to re-read userId from the remaining cookie.
    // Wait — we deleted all cookies above. Let me check if userId_cookie was set separately.

    // Actually the cookies were deleted above but the userId cookie wasn't set.
    // We need to look at the session — but callbacks don't have auth() sessions easily.
    // The pattern used in LinkedIn is: state = userId (and CSRF is by-passed).
    // Let's use the same approach for simplicity: we won't use state for userId here
    // because we used state for CSRF. Instead, store userId in a third cookie.

    // Since we already deleted state/verifier cookies and don't have a userId cookie,
    // we must use auth() which may work in GET handlers.
    const { auth } = await import("@/auth")
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/login?callbackUrl=/cabinet`)
    }
    const userId = session.user.id

    // Upsert twitterAccounts
    const existing = await db
      .select({ id: twitterAccounts.id })
      .from(twitterAccounts)
      .where(and(
        eq(twitterAccounts.userId, userId),
        eq(twitterAccounts.twitterUserId, twitterUserId)
      ))
      .limit(1)

    if (existing.length > 0) {
      await db
        .update(twitterAccounts)
        .set({ accessToken, refreshToken, expiresAt, username, displayName })
        .where(eq(twitterAccounts.id, existing[0].id))
    } else {
      // Also remove any old twitter account for this user (one account per user)
      await db.delete(twitterAccounts).where(eq(twitterAccounts.userId, userId))

      await db.insert(twitterAccounts).values({
        userId,
        twitterUserId,
        username,
        displayName,
        accessToken,
        refreshToken,
        expiresAt,
      })
    }

    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/cabinet?x_connected=1`)
  } catch (err) {
    console.error("Twitter callback error:", err)
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/cabinet?error=server_error`)
  }
}
