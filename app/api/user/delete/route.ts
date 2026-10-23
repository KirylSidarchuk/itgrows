import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq, sql, type SQL } from "drizzle-orm"
import Stripe from "stripe"
import { sendOwner } from "@/lib/telegram"

// Account deletion (the cabinet's "Delete account"; app/privacy/page.tsx, "How long we keep data",
// lists what goes). Two steps:
//  1) Stripe: every subscription of the customer that can still charge is cancelled at once. If that
//     fails, nothing is deleted: the answer is 502 and the owner gets a Telegram message.
//  2) The database, in one transaction: everything kept under the user's id, then the user. The
//     answers the assistants gave about a website stay with that website (geo_sites, geo_runs,
//     geo_launch): runs the user started keep no link to them (requested_by is cleared).
// Stripe keeps the customer and its invoices (billing records).

type Row = Record<string, unknown>

const rows = (r: unknown): Row[] => (Array.isArray(r) ? (r as Row[]) : ((r as { rows?: Row[] }).rows ?? []))

// A subscription in one of these can no longer charge; every other status is cancelled.
const ENDED: ReadonlySet<Stripe.Subscription.Status> = new Set(["canceled", "incomplete_expired"])

async function cancelSubscriptions(customer: string): Promise<string[]> {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set")
  const stripe = new Stripe(key)
  const live: string[] = []
  for await (const sub of stripe.subscriptions.list({ customer, status: "all", limit: 100 })) {
    if (!ENDED.has(sub.status)) live.push(sub.id)
  }
  for (const id of live) await stripe.subscriptions.cancel(id)
  return live
}

// One statement of the deletion. `needs` lists the table.column pairs it uses: a statement whose
// table or column is missing in this database is skipped (and logged), so one missing table cannot
// keep an account from being deleted.
type Step = { needs: string[]; run: SQL }

function steps(uid: string, email: string): Step[] {
  const byText = (table: string, column = "user_id"): Step => ({
    needs: [`${table}.${column}`],
    run: sql`DELETE FROM ${sql.identifier(table)} WHERE ${sql.identifier(column)} = ${uid}`,
  })
  const byUuid = (table: string): Step => ({
    needs: [`${table}.user_id`],
    run: sql`DELETE FROM ${sql.identifier(table)} WHERE user_id = ${uid}::uuid`,
  })

  return [
    // Statistics of the user's posts, and the images of the user's library (uploaded by the user, or
    // used by the user's posts and by no one else's: lib/image-library.ts), before the posts go.
    {
      needs: [
        "post_metrics.post_id",
        "post_metrics.twitter_post_id_local",
        "linkedin_posts.user_id",
        "instagram_posts.user_id",
        "twitter_posts.user_id",
      ],
      run: sql`DELETE FROM post_metrics
        WHERE post_id IN (SELECT id FROM linkedin_posts WHERE user_id = ${uid})
           OR post_id IN (SELECT id FROM instagram_posts WHERE user_id = ${uid}::uuid)
           OR twitter_post_id_local IN (SELECT id FROM twitter_posts WHERE user_id = ${uid}::uuid)`,
    },
    {
      needs: [
        "images.user_id",
        "images.url",
        "linkedin_posts.user_id",
        "linkedin_posts.image_url",
        "instagram_posts.user_id",
        "instagram_posts.image_url",
      ],
      run: sql`DELETE FROM images i
        WHERE i.user_id = ${uid}
           OR (i.user_id IS NULL
               AND (EXISTS (SELECT 1 FROM linkedin_posts p WHERE p.user_id = ${uid} AND p.image_url = i.url)
                    OR EXISTS (SELECT 1 FROM instagram_posts p WHERE p.user_id = ${uid}::uuid AND p.image_url = i.url))
               AND NOT EXISTS (SELECT 1 FROM linkedin_posts p WHERE p.user_id <> ${uid} AND p.image_url = i.url)
               AND NOT EXISTS (SELECT 1 FROM instagram_posts p WHERE p.user_id <> ${uid}::uuid AND p.image_url = i.url))`,
    },

    // LinkedIn & X (and Instagram): posts, threads, briefs, connected accounts with their tokens.
    byText("linkedin_posts"),
    byText("linkedin_briefs"),
    byText("post_threads"),
    byText("linkedin_accounts"),
    byUuid("twitter_posts"),
    byText("twitter_briefs"),
    byText("twitter_company_briefs"),
    byUuid("twitter_accounts"),
    byUuid("instagram_posts"),
    byText("instagram_briefs"),
    byUuid("instagram_accounts"),
    byUuid("user_integrations"),
    byText("generation_rejections"),
    byText("oauth_state"),
    byUuid("usage_events"),

    // Articles, connected sites with their access details, tasks.
    byUuid("scheduled_posts"),
    byUuid("blog_posts"),
    byUuid("connected_sites"),
    byUuid("tasks"),

    // AI visibility: followed sites, plans, client records, launch steps and launch emails.
    byText("geo_step_done"),
    byText("geo_follow_claims"),
    byText("geo_follows"),
    byText("geo_client_sites"),
    byText("geo_clients"),
    byText("geo_launch_mail"),
    {
      needs: ["geo_runs.requested_by"],
      run: sql`UPDATE geo_runs SET requested_by = NULL WHERE requested_by = ${uid}`,
    },

    // Our analytics: events under the account, and those of the same browser id before sign-in.
    {
      needs: ["analytics_events.user_id", "analytics_events.anon_id"],
      run: sql`DELETE FROM analytics_events
        WHERE user_id = ${uid}::uuid
           OR (user_id IS NULL AND anon_id IN (
                SELECT DISTINCT anon_id FROM analytics_events
                WHERE user_id = ${uid}::uuid AND anon_id IS NOT NULL AND anon_id <> ''))`,
    },

    // Sign-in: reset tokens and any unused sign-in codes for the address (sessions go with the user).
    byUuid("password_reset_tokens"),
    ...(email
      ? [
          {
            needs: ["email_pins.email"],
            run: sql`DELETE FROM email_pins WHERE lower(email) = lower(${email})`,
          },
          {
            needs: ["verification_tokens.identifier"],
            run: sql`DELETE FROM verification_tokens WHERE lower(identifier) = lower(${email})`,
          },
        ]
      : []),
  ]
}

async function deleteAccountData(uid: string, email: string) {
  await db.transaction(async (tx) => {
    const present = new Set(
      rows(
        await tx.execute(sql`
          SELECT table_name, column_name FROM information_schema.columns WHERE table_schema = current_schema()`)
      ).map((r) => `${r.table_name}.${r.column_name}`)
    )
    for (const step of steps(uid, email)) {
      const missing = step.needs.filter((n) => !present.has(n))
      if (missing.length) {
        console.warn("[delete-account] skipped, not in this database:", missing.join(", "))
        continue
      }
      await tx.execute(step.run)
    }
    await tx.delete(users).where(eq(users.id, uid))
  })
}

export async function DELETE() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const userId = session.user.id

  let who = userId
  let email = ""
  let cancelled: string[] = []
  try {
    const [user] = await db
      .select({ email: users.email, name: users.name, stripeCustomerId: users.stripeCustomerId })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)
    email = user?.email ?? ""
    who = `${user?.name ?? ""} ${email}`.trim() || userId

    if (user?.stripeCustomerId) {
      try {
        cancelled = await cancelSubscriptions(user.stripeCustomerId)
      } catch (stripeErr) {
        const reason = stripeErr instanceof Error ? stripeErr.message : String(stripeErr)
        console.error("[delete-account] Stripe cancellation failed:", reason)
        void sendOwner(
          `⚠️ Удаление аккаунта не прошло: Stripe не отменил подписки, аккаунт оставлен\n👤 ${who}\n🧾 ${user.stripeCustomerId}\n${reason.slice(0, 300)}`
        )
        return NextResponse.json({ error: "Could not cancel the subscription. Please try again." }, { status: 502 })
      }
    }

    await deleteAccountData(userId, email)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    console.error("[delete-account] Error:", message)
    void sendOwner(
      `⚠️ Удаление аккаунта не прошло (база)${cancelled.length ? `, подписки уже отменены: ${cancelled.join(", ")}` : ""}\n👤 ${who}\n${message.slice(0, 300)}`
    )
    return NextResponse.json({ error: message }, { status: 500 })
  }

  void sendOwner(`🗑 Аккаунт удалён\n👤 ${who}${cancelled.length ? `\n❌ Отменены подписки: ${cancelled.join(", ")}` : ""}`)
  return NextResponse.json({ success: true })
}
