"use client"

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import Link from "next/link"

function SignupForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") ?? "/cabinet"

  const [name, setName] = useState("")
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
          <div className="text-center mb-6">
            <Link href="/">
              <span className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-pink-500 bg-clip-text text-transparent">
                ItGrows.ai
              </span>
            </Link>
          </div>
          <div className="bg-white border border-black/10 rounded-2xl p-8">
            {/* Step indicator */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-7 h-7 rounded-full bg-violet-100 flex items-center justify-center text-xs font-bold text-violet-600">✓</div>
              <div className="flex-1 h-0.5 bg-violet-200" />
              <div className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center text-xs font-bold text-white">2</div>
              <div className="flex-1 h-0.5 bg-slate-200" />
              <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-400">3</div>
            </div>

            <div className="text-4xl mb-3 text-center">📬</div>
            <h1 className="text-xl font-bold text-[#1b1916] text-center mb-1">Check your inbox</h1>
            <p className="text-slate-500 text-sm text-center mb-5">
              We just sent a 6-digit code to<br />
              <strong className="text-[#1b1916]">{email}</strong>
            </p>

            {/* Instruction box */}
            <div className="bg-violet-50 border border-violet-100 rounded-xl p-4 mb-5 text-sm text-slate-600 space-y-1.5">
              <p className="font-semibold text-[#1b1916] mb-2">How to sign in:</p>
              <p>1️⃣ Open your email app (Gmail, Outlook, etc.)</p>
              <p>2️⃣ Find the email from <strong>noreply@itgrows.ai</strong></p>
              <p>3️⃣ Copy the 6-digit code from the email</p>
              <p>4️⃣ Paste it below and click Continue</p>
              <p className="text-slate-400 text-xs pt-1">⚠️ Don&apos;t see it? Check your <strong>Spam</strong> or <strong>Promotions</strong> folder</p>
            </div>

            <form onSubmit={handleVerifyPin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1b1916] mb-1.5">
                  6-digit code from email
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
                {loading ? "Verifying..." : "Continue →"}
              </button>
            </form>

            <div className="mt-5 pt-5 border-t border-black/5 text-center">
              <p className="text-xs text-slate-400 mb-2">Code expires in 15 minutes</p>
              <button
                type="button"
                onClick={() => { setStep("email"); setPin(""); setError("") }}
                className="text-sm text-violet-600 hover:underline font-medium"
              >
                ← Use a different email
              </button>
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
