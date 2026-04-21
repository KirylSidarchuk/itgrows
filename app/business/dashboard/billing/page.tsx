"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface SubscriptionInfo {
  status: string
  plan: string | null
  endDate: string | null
  hasCustomer: boolean
}

export default function BillingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [subscribing, setSubscribing] = useState<string | null>(null)
  const [cancelling, setCancelling] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  useEffect(() => {
    if (searchParams.get("success") === "1") {
      setMessage({ type: "success", text: "Subscription activated successfully! Welcome aboard." })
    } else if (searchParams.get("cancelled") === "1") {
      setMessage({ type: "error", text: "Checkout was cancelled. No charges were made." })
    }
  }, [searchParams])

  useEffect(() => {
    if (status === "authenticated") {
      fetchSubscription()
    }
  }, [status])

  async function fetchSubscription() {
    setLoading(true)
    try {
      const res = await fetch("/api/stripe/subscription")
      if (res.ok) {
        const data = await res.json()
        setSubscription(data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubscribe(plan: "monthly" | "annual") {
    setSubscribing(plan)
    setMessage(null)
    try {
      const res = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setMessage({ type: "error", text: data.error ?? "Failed to create checkout session" })
        setSubscribing(null)
      }
    } catch {
      setMessage({ type: "error", text: "Something went wrong. Please try again." })
      setSubscribing(null)
    }
  }

  async function handleCancel() {
    if (!confirm("Are you sure you want to cancel your subscription? It will remain active until the end of the billing period.")) return
    setCancelling(true)
    setMessage(null)
    try {
      const res = await fetch("/api/stripe/cancel-subscription", { method: "POST" })
      const data = await res.json()
      if (res.ok) {
        setMessage({ type: "success", text: "Subscription will be cancelled at the end of the billing period." })
        await fetchSubscription()
      } else {
        setMessage({ type: "error", text: data.error ?? "Failed to cancel subscription" })
      }
    } catch {
      setMessage({ type: "error", text: "Something went wrong. Please try again." })
    } finally {
      setCancelling(false)
    }
  }

  if (status !== "authenticated" || loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-64">
        <div className="text-slate-500 text-sm">Loading billing information...</div>
      </div>
    )
  }

  const isActive = subscription?.status === "active"
  const isMonthly = subscription?.plan === "monthly"
  const isAnnual = subscription?.plan === "annual"
  const endDate = subscription?.endDate
    ? new Date(subscription.endDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : null

  return (
    <div className="p-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-1 text-[#1b1916]">Billing</h1>
          <p className="text-slate-600">Manage your subscription and billing</p>
        </div>

        {message && (
          <div
            className={`mb-6 p-4 rounded-xl text-sm border ${
              message.type === "success"
                ? "bg-green-50 border-green-300 text-green-700"
                : "bg-red-50 border-red-300 text-red-700"
            }`}
          >
            {message.type === "success" ? "✅ " : "⚠️ "}
            {message.text}
          </div>
        )}

        {/* Current subscription status */}
        <Card className="bg-white border-black/10 mb-8">
          <CardHeader>
            <CardTitle className="text-[#1b1916]">Current Plan</CardTitle>
          </CardHeader>
          <CardContent>
            {isActive ? (
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <Badge className="bg-violet-100 text-violet-700 border-violet-200 capitalize text-sm px-3 py-1">
                      {subscription?.plan === "monthly" ? "Monthly" : "Annual"}
                    </Badge>
                    <Badge className="bg-green-100 text-green-700 border-green-200 text-sm px-3 py-1">
                      Active
                    </Badge>
                  </div>
                  {endDate && (
                    <p className="text-slate-600 text-sm">
                      Next renewal: <span className="font-medium text-[#1b1916]">{endDate}</span>
                    </p>
                  )}
                  <p className="text-slate-500 text-xs mt-1">Billing email: {session?.user?.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-[#1b1916]">
                    {isMonthly ? "$99" : "$999"}
                    <span className="text-slate-500 text-base font-normal">
                      {isMonthly ? "/mo" : "/yr"}
                    </span>
                  </p>
                  <Button
                    onClick={handleCancel}
                    disabled={cancelling}
                    variant="outline"
                    className="mt-3 text-sm border-red-200 text-red-600 hover:bg-red-50"
                  >
                    {cancelling ? "Cancelling..." : "Cancel Subscription"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Badge className="bg-slate-100 text-slate-600 border-slate-200 text-sm px-3 py-1">
                  No active plan
                </Badge>
                <span className="text-slate-500 text-sm">Subscribe below to get started</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Plans */}
        {!isActive && (
          <>
            <h2 className="text-xl font-semibold mb-4 text-[#1b1916]">Choose a Plan</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Monthly Plan */}
              <Card className="border-black/10 bg-white hover:border-violet-300 transition-colors">
                <CardHeader>
                  <CardTitle className="text-[#1b1916]">Monthly</CardTitle>
                  <div className="flex items-end gap-1">
                    <span className="text-4xl font-extrabold text-[#1b1916]">$99</span>
                    <span className="text-slate-500 mb-1">/month</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    {[
                      "Full access to all features",
                      "AI content generation",
                      "SEO autopilot",
                      "Google Ads management",
                      "Priority support",
                    ].map((f, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
                        <span className="text-green-600">✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    onClick={() => handleSubscribe("monthly")}
                    disabled={subscribing !== null}
                    className="w-full bg-violet-600 hover:bg-violet-500 text-white"
                  >
                    {subscribing === "monthly" ? "Redirecting to Stripe..." : "Subscribe Monthly — $99/mo"}
                  </Button>
                </CardContent>
              </Card>

              {/* Annual Plan */}
              <Card className="border-violet-400 bg-violet-50">
                <CardHeader>
                  <div className="flex items-center justify-between mb-1">
                    <CardTitle className="text-[#1b1916]">Annual</CardTitle>
                    <Badge className="bg-violet-600 text-white text-xs px-2 py-1">Save 16%</Badge>
                  </div>
                  <div className="flex items-end gap-1">
                    <span className="text-4xl font-extrabold text-[#1b1916]">$999</span>
                    <span className="text-slate-500 mb-1">/year</span>
                  </div>
                  <p className="text-sm text-violet-600 font-medium">≈ $83/month — save $189/yr</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    {[
                      "Full access to all features",
                      "AI content generation",
                      "SEO autopilot",
                      "Google Ads management",
                      "Priority support",
                      "2 months free vs monthly",
                    ].map((f, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
                        <span className="text-green-600">✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    onClick={() => handleSubscribe("annual")}
                    disabled={subscribing !== null}
                    className="w-full bg-violet-600 hover:bg-violet-500 text-white"
                  >
                    {subscribing === "annual" ? "Redirecting to Stripe..." : "Subscribe Yearly — $999/yr"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {/* Already subscribed — show plan details */}
        {isActive && (
          <div className="mt-4">
            <h2 className="text-xl font-semibold mb-4 text-[#1b1916]">Plan Details</h2>
            <Card className="bg-white border-black/10">
              <CardContent className="pt-6 space-y-3">
                {[
                  "Full access to all features",
                  "AI content generation",
                  "SEO autopilot",
                  "Google Ads management",
                  "Priority support",
                ].map((f, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-slate-600">
                    <span className="text-green-600">✓</span>
                    {f}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
