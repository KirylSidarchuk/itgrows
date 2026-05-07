import { NextResponse } from "next/server"
import { auth } from "@/auth"
import crypto from "crypto"
import { cookies } from "next/headers"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

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

  // Store in cookies
  const cookieStore = await cookies()
  cookieStore.set("x_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 600,
    path: "/",
    sameSite: "lax",
  })
  cookieStore.set("x_oauth_code_verifier", codeVerifier, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 600,
    path: "/",
    sameSite: "lax",
  })

  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.TWITTER_CLIENT_ID!,
    redirect_uri: "https://itgrows.ai/api/x/callback",
    scope: "tweet.read tweet.write users.read offline.access",
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  })

  return NextResponse.redirect(`https://twitter.com/i/oauth2/authorize?${params}`)
}
