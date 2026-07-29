import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"

// TEMP: full analytics inventory for an end-to-end audit. Token-gated, read-only. Remove after.
const TOKEN = "trace_7Kx9mQ2vLp8sRt4wYz"
type Row = Record<string, unknown>
const rows = (r: unknown): Row[] => (Array.isArray(r) ? (r as Row[]) : ((r as { rows?: Row[] }).rows ?? []))

export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get("token") !== TOKEN) return NextResponse.json({ error: "forbidden" }, { status: 403 })
  const days = Math.min(Number(req.nextUrl.searchParams.get("days") || 30), 60)
  try {
    // every event type: hits + distinct people
    const events = rows(await db.execute(sql`
      SELECT event, count(*)::int AS hits,
             count(DISTINCT coalesce(user_id::text, anon_id))::int AS people,
             to_char(min(created_at),'MM-DD') AS first_seen, to_char(max(created_at),'MM-DD') AS last_seen
      FROM analytics_events WHERE created_at > now() - interval '1 day' * ${days}
      GROUP BY event ORDER BY hits DESC`))

    // every distinct click label + where
    const clicks = rows(await db.execute(sql`
      SELECT coalesce(props->>'label','(no label)') AS label,
             regexp_replace(path, '\\?.*$', '') AS path_clean,
             count(*)::int AS n, count(DISTINCT coalesce(user_id::text, anon_id))::int AS ppl
      FROM analytics_events WHERE event='click' AND created_at > now() - interval '1 day' * ${days}
      GROUP BY 1,2 ORDER BY n DESC LIMIT 80`))

    // page inventory (cleaned of query strings)
    const paths = rows(await db.execute(sql`
      SELECT regexp_replace(path, '\\?.*$', '') AS path_clean,
             count(*) FILTER (WHERE event='page_view')::int AS pv,
             count(DISTINCT coalesce(user_id::text, anon_id))::int AS ppl
      FROM analytics_events WHERE created_at > now() - interval '1 day' * ${days}
      GROUP BY 1 ORDER BY pv DESC LIMIT 40`))

    // funnel: ordered by people desc, the canonical steps
    const funnelSteps = ['page_view','click','generate_preview_clicked','preview_rendered','preview_posts_shown',
      'start_trial_clicked','free_signup_clicked','persona_chip_clicked','topic_autofill','show_all_posts',
      'signup_view','signup_oauth_click','signup_email_submit','signup_complete','signup',
      'linkedin_connect_start','linkedin_connect_ok','linkedin_connect_fail','login_error']
    const funnel = rows(await db.execute(sql`
      SELECT event, count(DISTINCT coalesce(user_id::text, anon_id))::int AS people, count(*)::int AS hits
      FROM analytics_events WHERE event = ANY(${funnelSteps}) AND created_at > now() - interval '1 day' * ${days}
      GROUP BY event`))

    return NextResponse.json({ window_days: days, now: new Date().toISOString(), event_types: events, click_labels: clicks, page_paths: paths, funnel_events: funnel })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
