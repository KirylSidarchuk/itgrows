"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import Link from "next/link"

export default function SignupPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (password.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Signup failed")
        setLoading(false)
        return
      }
      // Show check-email message instead of auto-login
      setDone(true)
      setLoading(false)
    } catch {
      setError("Something went wrong")
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
            <p className="text-slate-500 text-sm">We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account.</p>
            <p className="text-slate-400 text-xs mt-4">Didn&apos;t receive it? Check your spam folder.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f3f2f1] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/">
            <span className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-pink-500 bg-clip-text text-transparent">
              ItGrows.ai
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-[#1b1916] mt-4">Create your account</h1>
          <p className="text-slate-500 text-sm mt-1">Start growing your business today</p>
        </div>
        <div className="bg-white border border-black/10 rounded-2xl p-8">
          <button
            type="button"
            onClick={() => signIn("google", { callbackUrl: "/cabinet" })}
            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-black/10 bg-white hover:bg-[#f3f2f1] text-[#1b1916] text-sm font-medium transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
              <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-black/10" />
            <span className="text-xs text-slate-400">or</span>
            <div className="flex-1 h-px bg-black/10" />
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#1b1916] mb-1.5">Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-black/10 bg-[#f3f2f1] text-[#1b1916] text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                placeholder="Your name"
              />
            </div>
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
            <div>
              <label className="block text-sm font-medium text-[#1b1916] mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-black/10 bg-[#f3f2f1] text-[#1b1916] text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                placeholder="At least 8 characters"
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>
          <p className="text-center text-sm text-slate-500 mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-violet-600 hover:underline font-medium">Sign in</Link>
          </p>
        </div>
        <p className="text-center text-xs text-slate-400 mt-6">
          By signing up you agree to our{" "}
          <Link href="/terms" className="text-violet-600 hover:underline">Terms of Service</Link>
          {" "}and{" "}
          <Link href="/privacy" className="text-violet-600 hover:underline">Privacy Policy</Link>
        </p>
      </div>
    </div>
  )
}
