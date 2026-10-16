import { db } from "@/lib/db"
import { and, eq, gt } from "drizzle-orm"
import { redditInvites, redditProjectMembers, redditProjects } from "./db"

// A usable invite: exists, not revoked, not expired. Returns the project it opens.
export async function findInvite(token: string) {
  if (!/^[A-Za-z0-9_-]{16,64}$/.test(token)) return null
  const [row] = await db
    .select({ projectId: redditInvites.projectId, expiresAt: redditInvites.expiresAt })
    .from(redditInvites)
    .where(and(eq(redditInvites.token, token), eq(redditInvites.revoked, false), gt(redditInvites.expiresAt, new Date())))
    .limit(1)
  if (!row) return null
  const [project] = await db
    .select({ id: redditProjects.id, siteUrl: redditProjects.siteUrl, profile: redditProjects.profile, userId: redditProjects.userId })
    .from(redditProjects)
    .where(eq(redditProjects.id, row.projectId))
    .limit(1)
  return project ? { project, expiresAt: row.expiresAt } : null
}

export async function isMember(projectId: string, email: string) {
  const [m] = await db
    .select({ email: redditProjectMembers.email })
    .from(redditProjectMembers)
    .where(and(eq(redditProjectMembers.projectId, projectId), eq(redditProjectMembers.email, email)))
    .limit(1)
  return !!m
}

export const cleanCommunities = (raw: unknown) => {
  const list = Array.isArray(raw) ? raw.map(String) : String(raw ?? "").split(/[,\s]+/)
  const names = list
    .map((s) => s.trim().replace(/^\/?r\//i, "").replace(/[^A-Za-z0-9_]/g, ""))
    .filter(Boolean)
    .map((n) => `r/${n}`)
  return Array.from(new Set(names)).slice(0, 20)
}

export const cleanUsername = (raw: unknown) => String(raw ?? "").trim().replace(/^\/?u\//i, "").replace(/[^A-Za-z0-9_-]/g, "").slice(0, 40) || null
