import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { waitlist } from "@/lib/db/schema"

export async function POST(req: NextRequest) {
  const { email, platform } = await req.json() as { email?: string; platform?: string }
  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 })
  }
  await db.insert(waitlist).values({ email: email.toLowerCase(), platform: platform ?? "x" })
  return NextResponse.json({ success: true })
}
