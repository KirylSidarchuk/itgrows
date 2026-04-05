import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { users, verificationTokens } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const token = searchParams.get("token")
  const email = searchParams.get("email")

  if (!token || !email) {
    return NextResponse.redirect(new URL("/login?error=invalid-token", req.url))
  }

  try {
    const [vToken] = await db.select().from(verificationTokens)
      .where(and(eq(verificationTokens.token, token), eq(verificationTokens.identifier, email)))

    if (!vToken) {
      return NextResponse.redirect(new URL("/login?error=invalid-token", req.url))
    }

    if (new Date() > vToken.expires) {
      return NextResponse.redirect(new URL("/login?error=token-expired", req.url))
    }

    // Mark email as verified
    await db.update(users)
      .set({ emailVerified: new Date() })
      .where(eq(users.email, email))

    // Delete used token
    await db.delete(verificationTokens)
      .where(eq(verificationTokens.token, token))

    return NextResponse.redirect(new URL("/login?verified=1", req.url))
  } catch (err) {
    console.error("Verify email error:", err)
    return NextResponse.redirect(new URL("/login?error=server-error", req.url))
  }
}
