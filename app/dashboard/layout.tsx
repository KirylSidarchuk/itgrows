import { auth } from "@/auth"
import { redirect } from "next/navigation"

// Legacy /dashboard/* routes are all redirect stubs (to /cabinet or /business/dashboard/*).
// This layout only keeps the auth guard; the old SEO Sidebar was removed as dead code.
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) {
    redirect("/login")
  }

  return <>{children}</>
}
