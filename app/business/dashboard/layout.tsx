import { auth } from "@/auth"
import { redirect } from "next/navigation"
import BusinessSidebar from "@/components/dashboard/BusinessSidebar"
import GeoPurchaseConversion from "@/components/GeoPurchaseConversion"
import SignupConversion from "@/components/SignupConversion"
import { geoRole } from "@/lib/geo-role"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) {
    redirect("/login")
  }
  const role = await geoRole(session.user.id)

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
      <BusinessSidebar client={role.client} hasLinkedin={role.hasLinkedin} />
      <main className="flex-1 overflow-auto min-w-0">{children}</main>
      <GeoPurchaseConversion />
      <SignupConversion userId={session.user.id} />
    </div>
  )
}
