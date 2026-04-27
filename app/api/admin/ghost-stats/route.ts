import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { ghostModeLogs } from "@/lib/db/schema"
import { sql } from "drizzle-orm"

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token")
  if (token !== process.env.ITGROWS_SITE_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const [totalRow] = await db
    .select({ count: sql<number>`count(*)::int`, successCount: sql<number>`sum(case when success then 1 else 0 end)::int` })
    .from(ghostModeLogs)

  const [todayRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(ghostModeLogs)
    .where(sql`created_at >= current_date`)

  const total = totalRow?.count ?? 0
  const successCount = totalRow?.successCount ?? 0
  const todayCount = todayRow?.count ?? 0
  const successRate = total > 0 ? Math.round((successCount / total) * 100) : null

  return NextResponse.json({
    ts: new Date().toISOString(),
    totalAllTime: total,
    totalToday: todayCount,
    successRate: successRate !== null ? `${successRate}%` : "n/a",
  })
}
