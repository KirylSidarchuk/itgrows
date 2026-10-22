import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { geoRole } from "@/lib/geo-role"

// The cabinet's front door. A client we publish for, whose report is not ready yet, starts at
// their articles; everyone else at the AI-visibility report.
export default async function DashboardHome() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login?callbackUrl=/business/dashboard")
  const role = await geoRole(session.user.id)
  redirect(role.client && !role.hasReport ? "/business/dashboard/articles" : "/business/dashboard/visibility")
}
