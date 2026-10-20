import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"
import BusinessSidebar from "@/components/dashboard/BusinessSidebar"

type Row = Record<string, unknown>
const rows = (r: unknown): Row[] => (Array.isArray(r) ? (r as Row[]) : ((r as { rows?: Row[] }).rows ?? []))

/** Accounts that only came for the free AI-visibility report see a short menu; anyone who has set
 * up publishing or pays keeps everything. */
async function menuFor(userId: string | undefined) {
  if (!userId) return { fullAccess: true, follows: false }
  try {
    const [u] = rows(
      await db.execute(sql`
        SELECT u.onboarding_completed, u.subscription_status,
               EXISTS (SELECT 1 FROM geo_follows f WHERE f.user_id = u.id::text) AS follows
        FROM users u WHERE u.id = ${userId}`)
    )
    if (!u) return { fullAccess: true, follows: false }
    const paying = ["active", "trialing", "past_due"].includes(String(u.subscription_status ?? ""))
    return { fullAccess: Boolean(u.onboarding_completed) || paying, follows: Boolean(u.follows) }
  } catch {
    // The menu must never take the cabinet down: when in doubt, show everything.
    return { fullAccess: true, follows: false }
  }
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) {
    redirect("/login")
  }
  const menu = await menuFor(session.user.id)

  return (
    <div
      className="min-h-screen text-[#1b1916] flex flex-col lg:flex-row"
      style={{
        background: "linear-gradient(135deg, #c8edfb 0%, #ddd4f8 45%, #f9d8f0 100%)",
        minHeight: "100vh",
        // The global --font-sans token points at itself, so pages without their own font fall back to
        // the browser serif. Geist is already loaded by the root layout; use it here.
        fontFamily: "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <BusinessSidebar fullAccess={menu.fullAccess} follows={menu.follows} />
      <main className="flex-1 overflow-auto min-w-0">{children}</main>
    </div>
  )
}
