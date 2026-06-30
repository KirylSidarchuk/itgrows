import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { twitterAccounts, twitterPosts, users } from "@/lib/db/schema"
import { eq, and, lte } from "drizzle-orm"
import { sendEmail } from "@/lib/email"
import { xTokenExpiredEmail, xPostFailedEmail } from "@/lib/email-templates"
import { hasAccess } from "@/lib/access"

async function refreshTwitterToken(account: typeof twitterAccounts.$inferSelect): Promise<string | null> {
  if (!account.refreshToken) return null

  const clientId = process.env.TWITTER_CLIENT_ID!
  const clientSecret = process.env.TWITTER_CLIENT_SECRET!
  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64")

  const res = await fetch("https://api.twitter.com/2/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basicAuth}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: account.refreshToken,
      client_id: clientId,
    }),
  })

  if (!res.ok) {
    console.error("[publish-x] Token refresh failed:", await res.text())
    return null
  }

  const data = await res.json() as { access_token: string; refresh_token?: string; expires_in?: number }

  // Update token in DB
  await db.update(twitterAccounts).set({
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? account.refreshToken,
    expiresAt: data.expires_in ? new Date(Date.now() + data.expires_in * 1000) : null,
  }).where(eq(twitterAccounts.id, account.id))

  return data.access_token
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("Authorization")
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const now = new Date()

    // Find all scheduled posts due to publish
    const duePosts = await db
      .select()
      .from(twitterPosts)
      .where(
        and(
          eq(twitterPosts.status, "scheduled"),
          lte(twitterPosts.scheduledAt, now)
        )
      )

    let published = 0
    let failed = 0
    let skipped = 0

    // Track accounts that hit rate limits or are suspended this run — skip remaining posts
    const rateLimitedAccounts = new Set<string>() // accountId
    const suspendedAccounts = new Set<string>()   // accountId
    // Limit to 1 post per account per cron run to avoid burst publishing
    const publishedThisRun = new Set<string>()    // accountId

    for (const post of duePosts) {
      // Get user info for failure emails + access check
      const [postUser] = await db
        .select({ email: users.email, name: users.name, subscriptionPlan: users.subscriptionPlan, subscriptionStatus: users.subscriptionStatus, trialEndsAt: users.trialEndsAt })
        .from(users)
        .where(eq(users.id, post.userId))
        .limit(1)

      // Stop publishing once the subscription/trial lapses (mirrors publish-linkedin).
      if (!postUser || !hasAccess({ subscriptionStatus: postUser.subscriptionStatus ?? null, subscriptionPlan: postUser.subscriptionPlan ?? null, trialEndsAt: postUser.trialEndsAt ?? null })) {
        await db
          .update(twitterPosts)
          .set({ status: "failed", errorMessage: "subscription_required" })
          .where(eq(twitterPosts.id, post.id))
        failed++
        continue
      }

      // Get Twitter account for this user matching the post's accountType
      const [account] = await db
        .select()
        .from(twitterAccounts)
        .where(and(eq(twitterAccounts.userId, post.userId), eq(twitterAccounts.accountType, post.accountType)))
        .limit(1)

      if (!account) {
        await db
          .update(twitterPosts)
          .set({ status: "failed", errorMessage: `No Twitter ${post.accountType} account connected` })
          .where(eq(twitterPosts.id, post.id))
        failed++
        if (postUser?.email) {
          await sendEmail({
            to: postUser.email,
            subject: "Action required: Reconnect your X account to ItGrows",
            html: xTokenExpiredEmail(postUser.name ?? "there"),
          })
        }
        continue
      }

      // Skip accounts that already hit rate limit or are suspended this run
      if (rateLimitedAccounts.has(account.id) || suspendedAccounts.has(account.id)) {
        skipped++
        continue
      }

      // Only 1 post per account per cron run — skip any extras
      if (publishedThisRun.has(account.id)) {
        skipped++
        continue
      }

      // Refresh token if expired or expiring within 5 minutes
      let accessToken = account.accessToken

      if (account.expiresAt && account.expiresAt <= new Date(Date.now() + 5 * 60 * 1000)) {
        const newToken = await refreshTwitterToken(account)
        if (newToken) {
          accessToken = newToken
        } else {
          await db.update(twitterPosts).set({ status: "failed", errorMessage: "Token refresh failed" }).where(eq(twitterPosts.id, post.id))
          failed++
          if (postUser?.email) {
            await sendEmail({
              to: postUser.email,
              subject: "Action required: Reconnect your X account to ItGrows",
              html: xTokenExpiredEmail(postUser.name ?? "there"),
            })
          }
          continue
        }
      }

      // Post to Twitter API v2
      try {
        const tweetRes = await fetch("https://api.twitter.com/2/tweets", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ text: post.content }),
        })

        if (!tweetRes.ok) {
          const errText = await tweetRes.text()
          const status = tweetRes.status

          if (status === 429) {
            // Rate limited — stop publishing for this account today
            rateLimitedAccounts.add(account.id)
            console.warn(`[publish-x] Rate limited (429) for account ${account.id}, skipping remaining posts`)
            skipped++
            continue
          }

          if (status === 403) {
            // Account suspended or forbidden — stop publishing, notify user
            suspendedAccounts.add(account.id)
            console.error(`[publish-x] Account suspended (403) for account ${account.id}: ${errText}`)
            if (postUser?.email) {
              await sendEmail({
                to: postUser.email,
                subject: "⚠️ Your X account may be suspended",
                html: xTokenExpiredEmail(postUser.name ?? "there"),
              })
            }
            skipped++
            continue
          }

          await db
            .update(twitterPosts)
            .set({ status: "failed", errorMessage: `Twitter API ${status}: ${errText}` })
            .where(eq(twitterPosts.id, post.id))
          failed++
          console.error(`[publish-x] Failed to publish post ${post.id}:`, errText)
          if (postUser?.email) {
            await sendEmail({
              to: postUser.email,
              subject: "⚠️ Your X post could not be published",
              html: xPostFailedEmail(postUser.name ?? "there", post.content, `Twitter API ${status}: ${errText}`),
            })
          }
          continue
        }

        const tweetData = await tweetRes.json() as { data?: { id: string } }
        const twitterPostId = tweetData.data?.id ?? null

        await db
          .update(twitterPosts)
          .set({
            status: "published",
            publishedAt: new Date(),
            twitterPostId,
            errorMessage: null,
          })
          .where(eq(twitterPosts.id, post.id))
        published++
        publishedThisRun.add(account.id)
      } catch (postErr) {
        const errMsg = postErr instanceof Error ? postErr.message : "Unknown error"
        await db
          .update(twitterPosts)
          .set({ status: "failed", errorMessage: errMsg })
          .where(eq(twitterPosts.id, post.id))
        failed++
        console.error(`[publish-x] Exception publishing post ${post.id}:`, errMsg)
        if (postUser?.email) {
          await sendEmail({
            to: postUser.email,
            subject: "⚠️ Your X post could not be published",
            html: xPostFailedEmail(postUser.name ?? "there", post.content, errMsg),
          })
        }
      }
    }

    return NextResponse.json({ published, failed, skipped, total: duePosts.length })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    console.error("[publish-x] cron error:", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
