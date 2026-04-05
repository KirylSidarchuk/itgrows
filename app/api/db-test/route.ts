import { NextResponse } from "next/server"
import postgres from "postgres"

export async function GET() {
  const url = process.env.DATABASE_URL
  if (!url) return NextResponse.json({ error: "No DATABASE_URL" })

  try {
    const sql = postgres(url, { ssl: false, connect_timeout: 10 })
    const result = await sql`SELECT version()`
    await sql.end()
    return NextResponse.json({ ok: true, version: result[0].version, url_prefix: url.slice(0, 30) })
  } catch (err) {
    const e = err as Error
    return NextResponse.json({ error: e.message, code: (e as { code?: string }).code, stack: e.stack?.slice(0, 300) })
  }
}
