"use client"

import { useState } from "react"
import Link from "next/link"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      setDone(true)
    } catch {
      setError("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="min-h-screen bg-[#f3f2f1] flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <Link href="/"><span className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-pink-500 bg-clip-text text-transparent">ItGrows.ai</span></Link>
          <div className="mt-8 bg-white border border-black/10 rounded-2xl p-10">
            <div className="text-5xl mb-4">📧</div>
            <h2 className="text-xl font-bold text-[#1b1916] mb-2">Check your email</h2>
            <p className="text-slate-500 text-sm">If <strong>{email}</strong> is registered, you&apos;ll receive a password reset link shortly.</p>
            <Link href="/login" className="inline-block mt-6 text-violet-600 text-sm hover:underline">Back to sign in</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f3f2f1] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/"><span className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-pink-500 bg-clip-text text-transparent">ItGrows.ai</span></Link>
          <h1 className="text-2xl font-bold text-[#1b1916] mt-4">Forgot your password?</h1>
          <p className="text-slate-500 text-sm mt-1">Enter your email and we&apos;ll send a reset link</p>
        </div>
        <div className="bg-white border border-black/10 rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#1b1916] mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-black/10 bg-[#f3f2f1] text-[#1b1916] text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                placeholder="you@example.com"
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send reset link"}
            </button>
          </form>
          <p className="text-center text-sm text-slate-500 mt-6">
            Remember your password?{" "}
            <Link href="/login" className="text-violet-600 hover:underline font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
