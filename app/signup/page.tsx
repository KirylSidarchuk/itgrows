"use client"

import { useState, useRef, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import Link from "next/link"

function SignupForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") ?? "/cabinet"

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [digits, setDigits] = useState(["", "", "", "", "", ""])
  const [step, setStep] = useState<"email" | "pin">("email")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [timeLeft, setTimeLeft] = useState(900) // 15 minutes
  const [resending, setResending] = useState(false)
  const digitRefs = useRef<(HTMLInputElement | null)[]>([])

  const pin = digits.join("")

  useEffect(() => {
    if (step !== "pin") return
    setTimeLeft(900)
    const interval = setInterval(() => {
      setTimeLeft(t => (t > 0 ? t - 1 : 0))
    }, 1000)
    return () => clearInterval(interval)
  }, [step])

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`

  const handleDigitChange = (i: number, val: string) => {
    const v = val.replace(/[^0-9]/g, "").slice(-1)
    const next = [...digits]
    next[i] = v
    setDigits(next)
    if (v && i < 5) digitRefs.current[i + 1]?.focus()
  }

  const handleDigitKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      digitRefs.current[i - 1]?.focus()
    }
  }

  const handleDigitPaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData("text").replace(/[^0-9]/g, "").slice(0, 6)
    if (text.length === 6) {
      setDigits(text.split(""))
      digitRefs.current[5]?.focus()
    }
  }

  const handleResend = async () => {
    setResending(true)
    setError("")
    try {
      await fetch("/api/auth/send-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name }),
      })
      setTimeLeft(900)
      setDigits(["", "", "", "", "", ""])
      digitRefs.current[0]?.focus()
    } finally {
      setResending(false)
    }
  }

  const handleSendPin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const res = await fetch("/api/auth/send-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name }),
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
      const res = await signIn("pin", { email, pin, redirect: false })
      if (res?.error) {
        setError("Invalid or expired code. Please try again.")
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
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "linear-gradient(135deg, #ede9fe 0%, #f5f3ff 50%, #ede9fe 100%)" }}>
        {/* Blobs */}
        <div className="fixed top-10 left-10 w-64 h-64 rounded-full opacity-30 pointer-events-none" style={{ background: "radial-gradient(circle, #a78bfa, transparent)" }} />
        <div className="fixed bottom-10 right-10 w-64 h-64 rounded-full opacity-20 pointer-events-none" style={{ background: "radial-gradient(circle, #c4b5fd, transparent)" }} />

        <div className="w-full max-w-md relative z-10">
          <div className="text-center mb-6">
            <Link href="/">
              <span className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-pink-500 bg-clip-text text-transparent">ItGrows.ai</span>
            </Link>
          </div>

          <div className="bg-white rounded-3xl shadow-xl p-8">
            {/* Step indicator */}
            <div className="flex items-center mb-8">
              <div className="flex flex-col items-center gap-1">
                <div className="w-9 h-9 rounded-full bg-violet-100 border-2 border-violet-300 flex items-center justify-center">
                  <svg className="w-4 h-4 text-violet-600" fill="none" viewBox="0 0 16 16"><path d="M3 8l3 3 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <span className="text-xs text-slate-400">Account</span>
              </div>
              <div className="flex-1 h-0.5 bg-violet-300 mx-2 mb-4" />
              <div className="flex flex-col items-center gap-1">
                <div className="w-9 h-9 rounded-full bg-violet-600 flex items-center justify-center">
                  <span className="text-white text-sm font-bold">2</span>
                </div>
                <span className="text-xs font-semibold text-violet-600">Verify email</span>
              </div>
              <div className="flex-1 h-0.5 bg-slate-200 mx-2 mb-4" />
              <div className="flex flex-col items-center gap-1">
                <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center">
                  <span className="text-slate-400 text-sm font-bold">3</span>
                </div>
                <span className="text-xs text-slate-400">Complete</span>
              </div>
            </div>

            {/* Icon */}
            <div className="flex justify-center mb-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-violet-100 flex items-center justify-center">
                  <svg className="w-8 h-8 text-violet-600" fill="none" viewBox="0 0 24 24"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white" />
              </div>
            </div>

            <h1 className="text-2xl font-bold text-[#1b1916] text-center mb-2">Check your email</h1>
            <p className="text-slate-500 text-sm text-center mb-2">We&apos;ve sent a 6-digit code to</p>
            <div className="flex justify-center mb-6">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-violet-200 bg-violet-50 text-violet-700 text-sm font-medium">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 16 16"><path d="M2 5l5.3 3.5a1 1 0 001.4 0L14 5M3 13h10a1 1 0 001-1V4a1 1 0 00-1-1H3a1 1 0 00-1 1v8a1 1 0 001 1z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
                {email}
              </span>
            </div>

            <form onSubmit={handleVerifyPin}>
              <label className="block text-sm font-medium text-[#1b1916] mb-3">Enter 6-digit code</label>
              {/* OTP boxes */}
              <div className="flex gap-2 mb-5" onPaste={handleDigitPaste}>
                {digits.map((d, i) => (
                  <input
                    key={i}
                    ref={el => { digitRefs.current[i] = el }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={d}
                    onChange={e => handleDigitChange(i, e.target.value)}
                    onKeyDown={e => handleDigitKeyDown(i, e)}
                    autoFocus={i === 0}
                    className="flex-1 h-14 rounded-xl border-2 text-center text-xl font-bold text-[#1b1916] transition-colors focus:outline-none focus:border-violet-500"
                    style={{ borderColor: d ? "#7c3aed" : "#e2e8f0", background: d ? "#f5f3ff" : "#f8fafc" }}
                  />
                ))}
              </div>

              {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

              <button
                type="submit"
                disabled={loading || pin.length !== 6}
                className="w-full py-3.5 rounded-xl text-white text-sm font-semibold transition-all disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)" }}
              >
                {loading ? "Verifying..." : "Continue →"}
              </button>
            </form>

            {/* Timer + Resend */}
            <div className="flex items-center justify-between mt-4">
              <span className="flex items-center gap-1.5 text-xs text-slate-400">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.2"/><path d="M8 5v3.5l2 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
                Code expires in {formatTime(timeLeft)}
              </span>
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="flex items-center gap-1 text-xs font-semibold text-violet-600 hover:text-violet-500 disabled:opacity-50"
              >
                {resending ? "Sending..." : "Resend code"}
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 16 16"><path d="M13.5 8A5.5 5.5 0 112.5 8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><path d="M13.5 5v3h-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            </div>

            {/* Can't find box */}
            <div className="mt-5 flex items-start gap-3 bg-slate-50 rounded-xl p-4">
              <svg className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              <div>
                <p className="text-sm font-medium text-[#1b1916]">Can&apos;t find the email?</p>
                <p className="text-xs text-slate-500 mt-0.5">Check your spam or promotions folder.</p>
              </div>
            </div>
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
          <form onSubmit={handleSendPin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#1b1916] mb-1.5">Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                autoFocus
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

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  )
}
