"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"

function ResetForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get("token")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!token) router.push("/login")
  }, [token, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (password !== confirm) { setError("Passwords don't match"); return }
    if (password.length < 8) { setError("Password must be at least 8 characters"); return }
    setLoading(true)
    try {
      const res = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? "Failed to reset password"); setLoading(false); return }
      router.push("/login?reset=1")
    } catch {
      setError("Something went wrong")
      setLoading(false)
    }
  }

  return (
    <div className="bg-white border border-black/10 rounded-2xl p-8">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[#1b1916] mb-1.5">New password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
            className="w-full px-4 py-2.5 rounded-xl border border-black/10 bg-[#f3f2f1] text-[#1b1916] text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            placeholder="At least 8 characters" />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#1b1916] mb-1.5">Confirm password</label>
          <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required
            className="w-full px-4 py-2.5 rounded-xl border border-black/10 bg-[#f3f2f1] text-[#1b1916] text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            placeholder="Repeat your password" />
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button type="submit" disabled={loading}
          className="w-full py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50">
          {loading ? "Saving..." : "Set new password"}
        </button>
      </form>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-[#f3f2f1] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/"><span className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-pink-500 bg-clip-text text-transparent">ItGrows.ai</span></Link>
          <h1 className="text-2xl font-bold text-[#1b1916] mt-4">Set new password</h1>
          <p className="text-slate-500 text-sm mt-1">Choose a strong password for your account</p>
        </div>
        <Suspense>
          <ResetForm />
        </Suspense>
      </div>
    </div>
  )
}
