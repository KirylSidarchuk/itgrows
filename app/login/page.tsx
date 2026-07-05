"use client"

import { Suspense, useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") ?? "/cabinet"

  const [email, setEmail] = useState("")
  const [pin, setPin] = useState("")
  const [step, setStep] = useState<"email" | "pin">("email")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSendPin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const res = await fetch("/api/auth/send-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Failed to send PIN")
        setLoading(false)
        return
      }
      setStep("pin")
    } catch {
      setError("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyPin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const res = await signIn("pin", {
        email,
        pin,
        redirect: false,
      })
      if (res?.error) {
        setError("Invalid or expired PIN. Please try again.")
        setLoading(false)
        return
      }
      router.push(callbackUrl)
    } catch {
      setError("Something went wrong")
      setLoading(false)
    }
  }

  if (step === "pin") {
    return (
      <div className="bg-white border border-black/10 rounded-2xl p-8">
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">📧</div>
          <p className="text-[#1b1916] font-medium text-sm">Code sent to</p>
          <p className="text-violet-600 font-semibold text-sm">{email}</p>
        </div>
        <form onSubmit={handleVerifyPin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#1b1916] mb-1.5">
              Enter 6-digit code
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              value={pin}
              onChange={e => setPin(e.target.value.replace(/[^0-9]/g, ""))}
              required
              autoFocus
              className="w-full px-4 py-3 rounded-xl border border-black/10 bg-[#f3f2f1] text-[#1b1916] text-2xl font-mono text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-violet-500"
              placeholder="000000"
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading || pin.length !== 6}
            className="w-full py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
          >
            {loading ? "Verifying..." : "Sign in"}
          </button>
        </form>
        <p className="text-center text-sm text-slate-500 mt-6">
          Didn&apos;t get the code?{" "}
          <button
            type="button"
            onClick={() => { setStep("email"); setPin(""); setError("") }}
            className="text-violet-600 hover:underline font-medium"
          >
            Try again
          </button>
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white border border-black/10 rounded-2xl p-8">
      {process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === "1" && (
        <>
          <button
            type="button"
            onClick={() => signIn("google", { callbackUrl })}
            className="w-full py-3 mb-4 flex items-center justify-center gap-2.5 border border-black/15 rounded-xl text-sm font-semibold text-[#1b1916] bg-white hover:bg-slate-50 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/><path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"/><path fill="#EA4335" d="M12 4.75c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.46 14.97.5 12 .5A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 6.68 9.14 4.75 12 4.75z"/></svg>
            Continue with Google
          </button>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px flex-1 bg-black/10" />
            <span className="text-xs text-slate-400">or</span>
            <div className="h-px flex-1 bg-black/10" />
          </div>
        </>
      )}
      <form onSubmit={handleSendPin} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[#1b1916] mb-1.5">Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoFocus
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
          {loading ? "Sending code..." : "Continue with email"}
        </button>
      </form>
      <p className="text-center text-sm text-slate-500 mt-6">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="text-violet-600 hover:underline font-medium">Sign up</Link>
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#f3f2f1] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/">
            <span className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-pink-500 bg-clip-text text-transparent">
              ItGrows.ai
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-[#1b1916] mt-4">Welcome back</h1>
          <p className="text-slate-500 text-sm mt-1">Sign in to your account</p>
        </div>
        <Suspense fallback={<div className="bg-white border border-black/10 rounded-2xl p-8 animate-pulse h-64" />}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}
