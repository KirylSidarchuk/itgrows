import { auth } from "@/auth"
import { redirect } from "next/navigation"
import BusinessSidebar from "@/components/dashboard/BusinessSidebar"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) {
    redirect("/login")
  }

  return (
    <div className="min-h-screen text-[#1b1916] flex" style={{ background: "linear-gradient(135deg, #c8edfb 0%, #ddd4f8 45%, #f9d8f0 100%)", minHeight: "100vh" }}>
      <BusinessSidebar />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
