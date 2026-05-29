"use client"

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import Link from "next/link"

function SignupForm() {
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
      <div className="min-h-screen bg-[#f3f2f1] flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link href="/">
              <span className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-pink-500 bg-clip-text text-transparent">
                ItGrows.ai
              </span>
            </Link>
            <h1 className="text-2xl font-bold text-[#1b1916] mt-4">Check your email</h1>
            <p className="text-slate-500 text-sm mt-1">
              We sent a 6-digit code to <strong>{email}</strong>
            </p>
          </div>
          <div className="bg-white border border-black/10 rounded-2xl p-8">
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
                {loading ? "Verifying..." : "Continue"}
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
