import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { siteReportsFor } from "@/lib/geo-report"

// Everything the AI-visibility page shows, for the sites the signed-in user follows (built in
// lib/geo-report.ts): the detailed report whole where it is paid for, a preview where it is not.

export const dynamic = "force-dynamic"

export async function GET() {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  return NextResponse.json({ sites: await siteReportsFor(userId) })
}
