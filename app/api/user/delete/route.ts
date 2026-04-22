import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import {
  users,
  linkedinAccounts,
  linkedinPosts,
  linkedinBriefs,
  connectedSites,
  tasks,
  blogPosts,
  scheduledPosts,
  passwordResetTokens,
} from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import Stripe from "stripe"

export async function DELETE() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const userId = session.user.id

    // Get user for Stripe cancellation
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1)

    // Cancel Stripe subscription if active
    if (user?.stripeCustomerId) {
      try {
        const stripeKey = process.env.STRIPE_SECRET_KEY
        if (stripeKey) {
          const stripe = new Stripe(stripeKey)
          const subscriptions = await stripe.subscriptions.list({ customer: user.stripeCustomerId, status: "active" })
          const pastDueSubs = await stripe.subscriptions.list({ customer: user.stripeCustomerId, status: "past_due" })
          const allSubs = [...subscriptions.data, ...pastDueSubs.data]
          for (const sub of allSubs) { await stripe.subscriptions.cancel(sub.id) }
        }
      } catch (stripeErr) {
        console.error("[delete-account] Stripe cancellation error:", stripeErr)
        // Non-fatal — continue with deletion
      }
    }

    // Delete all user data in order (respecting FK constraints)
    // linkedinPosts uses text user_id (not FK), delete first
    await db.delete(linkedinPosts).where(eq(linkedinPosts.userId, userId))
    // linkedinBriefs uses text user_id (not FK), delete next
    await db.delete(linkedinBriefs).where(eq(linkedinBriefs.userId, userId))
    // These have ON DELETE CASCADE but we delete explicitly for safety
    await db.delete(linkedinAccounts).where(eq(linkedinAccounts.userId, userId))
    await db.delete(scheduledPosts).where(eq(scheduledPosts.userId, userId))
    await db.delete(blogPosts).where(eq(blogPosts.userId, userId))
    await db.delete(tasks).where(eq(tasks.userId, userId))
    await db.delete(connectedSites).where(eq(connectedSites.userId, userId))
    await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, userId))

    // Delete user last (sessions have ON DELETE CASCADE)
    await db.delete(users).where(eq(users.id, userId))

    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    console.error("[delete-account] Error:", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
