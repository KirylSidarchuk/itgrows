import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getRedditUser } from "@/lib/reddit/access"
import AppShell from "./AppShell"
import ProjectsClient from "./ProjectsClient"
import RequestForm from "../RequestForm"

export const metadata: Metadata = {
  title: "Reddit planner | ItGrows",
  robots: { index: false, follow: false },
}

export const dynamic = "force-dynamic"

export default async function RedditAppPage() {
  const user = await getRedditUser()
  if (!user) redirect("/login?callbackUrl=/reddit/app")

  if (!user.beta) {
    return (
      <AppShell email={user.email}>
        <div className="max-w-xl mx-auto">
          <h1 className="text-2xl font-bold mb-2">The Reddit planner is in closed beta</h1>
          <p className="text-slate-600 mb-6">
            Leave your site and what you want from Reddit. We add people a few at a time and reply by email.
          </p>
          <RequestForm defaultEmail={user.email} />
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell email={user.email}>
      <ProjectsClient />
    </AppShell>
  )
}
