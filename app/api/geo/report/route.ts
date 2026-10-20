import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"

// Everything the AI-visibility page shows, for the sites the signed-in user follows: the latest
// finished report in full, the one in progress if any, the history of summaries for the trend, and
// the instant check (shown unblurred while the full report is still running).

export const dynamic = "force-dynamic"

type Row = Record<string, unknown>
const rows = (r: unknown): Row[] => (Array.isArray(r) ? (r as Row[]) : ((r as { rows?: Row[] }).rows ?? []))

export async function GET() {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  const follows = rows(
    await db.execute(sql`
      SELECT s.id, s.domain, s.profile->>'business_name' AS business, s.profile->>'language' AS language,
             nullif(s.profile->>'local_city', '') AS city, s.profile->>'offering' AS offering,
             f.plan, f.created_at AS followed_at
      FROM geo_follows f JOIN geo_sites s ON s.id = f.site_id
      WHERE f.user_id = ${userId}
      ORDER BY f.created_at`)
  )

  const sites = []
  for (const f of follows) {
    const runs = rows(
      await db.execute(sql`
        SELECT id, kind, status, engines, samples, jsonb_array_length(questions) AS n_questions,
               summary, error, progress, created_at, started_at, finished_at
        FROM geo_runs
        WHERE site_id = ${f.id} AND kind IN ('baseline', 'weekly')
        ORDER BY created_at DESC LIMIT 60`)
    )
    const done = runs.filter((r) => r.status === "done")
    const pending = runs.find((r) => r.status === "queued" || r.status === "running") ?? null
    const latestId = done[0]?.id as string | undefined
    const latest = latestId
      ? rows(await db.execute(sql`SELECT results FROM geo_runs WHERE id = ${latestId}::uuid`))[0]
      : null
    const teaser =
      rows(
        await db.execute(sql`
          SELECT engines, summary, results, finished_at FROM geo_runs
          WHERE site_id = ${f.id} AND kind = 'teaser' AND status = 'done'
          ORDER BY created_at DESC LIMIT 1`)
      )[0] ?? null

    sites.push({
      domain: f.domain,
      business: f.business,
      language: f.language,
      city: f.city,
      offering: f.offering,
      plan: f.plan,
      followedAt: f.followed_at,
      pending: pending && {
        kind: pending.kind,
        status: pending.status,
        createdAt: pending.created_at,
        startedAt: pending.started_at,
        questions: pending.n_questions,
        engines: pending.engines,
        samples: pending.samples,
        progress: pending.progress ?? null,
      },
      failed: !done.length && !pending && runs[0]?.status === "failed",
      latest: done[0] && {
        kind: done[0].kind,
        finishedAt: done[0].finished_at,
        engines: done[0].engines,
        samples: done[0].samples,
        summary: done[0].summary,
        rows: latest?.results ?? [],
      },
      history: done
        .slice()
        .reverse()
        .map((r) => ({ kind: r.kind, finishedAt: r.finished_at, samples: r.samples, questions: r.n_questions, summary: r.summary })),
      teaser: teaser && {
        engines: teaser.engines,
        summary: teaser.summary,
        rows: teaser.results,
        finishedAt: teaser.finished_at,
      },
    })
  }

  return NextResponse.json({ sites })
}
