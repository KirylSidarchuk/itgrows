import { auth } from "@/auth"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { redditBetaUsers, redditProjectMembers, redditProjects } from "./db"

// beta: may use the planner. canCreate: may start projects of their own, which only people we
// added to the beta can; a team member works the projects they were added to.
export type RedditUser = { id: string; email: string; beta: boolean; canCreate: boolean }

// Closed beta: the engine spends real money on every project every day (web searches and a
// planning model), so access is a row in reddit_beta_users, added by hand, not a plan flag.
// Someone a project owner has added to their team is let in too: that is the owner's call.
export async function getRedditUser(): Promise<RedditUser | null> {
  const session = await auth()
  const id = session?.user?.id
  if (!id) return null
  const [u] = await db.select({ email: users.email }).from(users).where(eq(users.id, id)).limit(1)
  if (!u) return null
  const email = u.email.toLowerCase()
  const [b] = await db.select({ email: redditBetaUsers.email }).from(redditBetaUsers).where(eq(redditBetaUsers.email, email)).limit(1)
  if (b) return { id, email, beta: true, canCreate: true }
  const [m] = await db
    .select({ email: redditProjectMembers.email })
    .from(redditProjectMembers)
    .where(eq(redditProjectMembers.email, email))
    .limit(1)
  return { id, email, beta: !!m, canCreate: false }
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

export type ProjectAccess = { project: typeof redditProjects.$inferSelect; role: "owner" | "member" }

// The owner can change the project and the team; a member sees everything and works the tasks.
export async function getProjectAccess(user: RedditUser, projectId: string): Promise<ProjectAccess | null> {
  if (!/^[0-9a-f-]{36}$/i.test(projectId)) return null
  const [p] = await db.select().from(redditProjects).where(eq(redditProjects.id, projectId)).limit(1)
  if (!p) return null
  if (p.userId === user.id) return { project: p, role: "owner" }
  const [m] = await db
    .select({ email: redditProjectMembers.email })
    .from(redditProjectMembers)
    .where(and(eq(redditProjectMembers.projectId, projectId), eq(redditProjectMembers.email, user.email)))
    .limit(1)
  return m ? { project: p, role: "member" } : null
}
