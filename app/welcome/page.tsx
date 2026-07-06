"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import { track } from "@vercel/analytics"

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

function PersonalWelcomeContent() {
  const searchParams = useSearchParams()
  const subscribed = searchParams.get("subscribed") === "1"
  const [linkedinConnected, setLinkedinConnected] = useState<boolean | null>(null)

  useEffect(() => {
    if (!subscribed) return
    // Fire the real purchase conversion only on actual subscribe, once per checkout
    // (sessionStorage guards against refresh double-counting).
    if (typeof window !== "undefined" && typeof window.gtag === "function") {
      if (!sessionStorage.getItem("itgrows_purchase_fired")) {
        sessionStorage.setItem("itgrows_purchase_fired", "1")
        window.gtag("event", "conversion", {
          send_to: "AW-18160234884/ESZmCNuErMgcEITjvNND",
          transaction_id: String(Date.now()),
        })
        track("purchase_completed")
      }
    }
  }, [subscribed])

  useEffect(() => {
    fetch("/api/linkedin/pages")
      .then((r) => r.json())
      .then((data) => {
        setLinkedinConnected(Array.isArray(data?.accounts) && data.accounts.length > 0)
      })
      .catch(() => setLinkedinConnected(false))
  }, [])

  const isConnected = linkedinConnected === true

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center text-center px-6"
      style={{ backgroundColor: "#f3f2f1", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}
    >
      <div className="max-w-lg mx-auto">
        {/* Logo */}
        <Link href="/" className="inline-block mb-10 text-xl font-bold bg-gradient-to-r from-violet-600 to-cyan-600 bg-clip-text text-transparent">
          ItGrows.ai
        </Link>

        {/* Subscription activated banner */}
        {subscribed && (
          <div className="mb-6 rounded-xl bg-green-50 border border-green-200 px-6 py-4 text-green-800 text-sm font-medium">
            You&apos;re in! Your 14-day free trial has started — you won&apos;t be charged until it ends.
          </div>
        )}

        {/* Icon */}
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-600 to-pink-600 flex items-center justify-center text-4xl mx-auto mb-8 shadow-lg shadow-violet-200">
          🎉
        </div>

        <h1 className="text-4xl font-extrabold text-[#1b1916] mb-4 leading-tight">
          Welcome to ItGrows!
        </h1>

        {isConnected ? (
          <>
            <p className="text-lg text-slate-600 mb-3 leading-relaxed">
              Your posting autopilot is now active.
            </p>
            <p className="text-sm text-slate-500 mb-10">
              LinkedIn is already connected — we&apos;ll start generating and publishing posts automatically.
            </p>
            <Link href="/cabinet">
              <Button
                size="lg"
                className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white px-10 py-6 text-lg rounded-xl"
              >
                Go to Cabinet →
              </Button>
            </Link>
            <p className="mt-6 text-xs text-slate-400">
              Posts start within 24 hours
            </p>
          </>
        ) : (
          <>
            <p className="text-lg text-slate-600 mb-3 leading-relaxed">
              Your posting autopilot is now active.
            </p>
            <p className="text-sm text-slate-500 mb-10">
              Connect your LinkedIn account and fill a 2-minute brief — then we&apos;ll start generating your posts automatically.
            </p>
            <Link href="/cabinet">
              <Button
                size="lg"
                className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white px-10 py-6 text-lg rounded-xl"
              >
                Set Up LinkedIn →
              </Button>
            </Link>
            <p className="mt-6 text-xs text-slate-400">
              Takes less than 3 minutes · Posts start within 24 hours
            </p>
          </>
        )}
      </div>
    </div>
  )
}

export default function PersonalWelcomePage() {
  return (
    <Suspense>
      <PersonalWelcomeContent />
    </Suspense>
  )
}
