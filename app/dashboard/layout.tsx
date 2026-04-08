import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Sidebar from "@/components/dashboard/Sidebar"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) {
    redirect("/login")
  }

  return (
    <div className="min-h-screen text-[#1b1916] flex" style={{ background: "linear-gradient(135deg, #dff3fb 0%, #ede8fb 40%, #fde8f5 100%)" }}>
      <Sidebar />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
