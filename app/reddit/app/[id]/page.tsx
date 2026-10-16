import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import { getProjectAccess, getRedditUser } from "@/lib/reddit/access"
import AppShell from "../AppShell"
import ProjectClient from "./ProjectClient"

export const metadata: Metadata = {
  title: "Reddit plan | ItGrows",
  robots: { index: false, follow: false },
}

export const dynamic = "force-dynamic"

export default async function RedditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getRedditUser()
  if (!user) redirect(`/login?callbackUrl=/reddit/app/${id}`)
  if (!user.beta) redirect("/reddit/app")
  const access = await getProjectAccess(user, id)
  if (!access) notFound()

  return (
    <AppShell email={user.email}>
      <ProjectClient id={id} />
    </AppShell>
  )
}
