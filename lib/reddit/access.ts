import { auth } from "@/auth"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { redditBetaUsers, redditProjects } from "./db"

export type RedditUser = { id: string; email: string; beta: boolean }

// Closed beta: the engine spends real money on every project every day (web searches and a
// planning model), so access is a row in reddit_beta_users, added by hand, not a plan flag.
export async function getRedditUser(): Promise<RedditUser | null> {
  const session = await auth()
  const id = session?.user?.id
  if (!id) return null
  const [u] = await db.select({ email: users.email }).from(users).where(eq(users.id, id)).limit(1)
  if (!u) return null
  const email = u.email.toLowerCase()
  const [b] = await db.select({ email: redditBetaUsers.email }).from(redditBetaUsers).where(eq(redditBetaUsers.email, email)).limit(1)
  return { id, email, beta: !!b }
}

export async function getOwnedProject(userId: string, projectId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(projectId)) return null
  const [p] = await db
    .select()
    .from(redditProjects)
    .where(and(eq(redditProjects.id, projectId), eq(redditProjects.userId, userId)))
    .limit(1)
  return p ?? null
}
