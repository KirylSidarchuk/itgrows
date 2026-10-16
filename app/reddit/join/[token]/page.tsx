import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { findInvite, isMember } from "@/lib/reddit/invite"
import AppShell from "../../app/AppShell"
import JoinClient from "./JoinClient"

export const metadata: Metadata = {
  title: "Join a Reddit team | ItGrows",
  robots: { index: false, follow: false },
}

export const dynamic = "force-dynamic"

export default async function JoinPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const found = await findInvite(token)
  if (!found) {
    return (
      <AppShell>
        <div className="max-w-xl mx-auto grid gap-2">
          <h1 className="text-2xl font-bold">This invite link no longer works</h1>
          <p className="text-slate-600">It has expired or was revoked. Ask the person who sent it for a new one.</p>
        </div>
      </AppShell>
    )
  }

  const session = await auth()
  if (!session?.user?.id) redirect(`/login?callbackUrl=/reddit/join/${token}`)
  const [u] = await db.select({ email: users.email }).from(users).where(eq(users.id, session.user.id)).limit(1)
  if (!u) redirect(`/login?callbackUrl=/reddit/join/${token}`)
  const email = u.email.toLowerCase()
  if (found.project.userId === session.user.id || (await isMember(found.project.id, email))) {
    redirect(`/reddit/app/${found.project.id}`)
  }

  const name = (found.project.profile as { product_name?: string } | null)?.product_name ?? found.project.siteUrl
  return (
    <AppShell email={email}>
      <JoinClient token={token} productName={name} email={email} />
    </AppShell>
  )
}
