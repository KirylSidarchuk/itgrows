import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import crypto from "crypto"
import { db } from "@/lib/db"
import { oauthState } from "@/lib/db/schema"
import { and, eq } from "drizzle-orm"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const accountType = searchParams.get("type") === "company" ? "company" : "personal"

  // Generate PKCE code_verifier (43-128 chars, URL-safe)
  const codeVerifier = crypto.randomBytes(32).toString("base64url")

  // Generate code_challenge = base64url(SHA256(code_verifier))
  const codeChallenge = crypto
    .createHash("sha256")
    .update(codeVerifier)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "")

  // Generate random state
  const state = crypto.randomBytes(16).toString("hex")

  // Clean up old states for this user
  await db
    .delete(oauthState)
    .where(and(eq(oauthState.userId, session.user.id), eq(oauthState.platform, "twitter")))

  // Store state + codeVerifier in DB
  await db.insert(oauthState).values({
    userId: session.user.id,
    state,
    codeVerifier,
    platform: "twitter",
    accountType,
  })

  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.TWITTER_CLIENT_ID!,
    redirect_uri: "https://itgrows.ai/api/x/callback",
    scope: "tweet.read tweet.write users.read offline.access",
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    prompt: "login",
  })

  return NextResponse.redirect(`https://twitter.com/i/oauth2/authorize?${params}`)
}
