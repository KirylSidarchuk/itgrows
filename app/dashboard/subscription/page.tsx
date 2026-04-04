"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getUser, setUser, type User } from "@/lib/auth"

const plans = [
  {
    id: "starter" as const,
    name: "Starter",
    price: "$49",
    period: "/month",
    features: ["10 AI articles/month", "30 social posts/month", "1 Google Ads campaign", "5 AI images/month", "Email support"],
  },
  {
    id: "pro" as const,
    name: "Pro",
    price: "$149",
    period: "/month",
    features: ["50 AI articles/month", "Unlimited social posts", "5 Google Ads campaigns", "50 AI images/month", "Priority support", "Advanced analytics"],
    highlight: true,
  },
  {
    id: "agency" as const,
    name: "Agency",
    price: "$399",
    period: "/month",
    features: ["Unlimited everything", "Dedicated account manager", "White-label reports", "API access"],
  },
]

export default function SubscriptionPage() {
  const router = useRouter()
  const [user, setUserState] = useState<User | null>(null)
  const [upgrading, setUpgrading] = useState<string | null>(null)
  const [upgraded, setUpgraded] = useState<string | null>(null)

  useEffect(() => {
    const u = getUser()
    if (!u) {
      router.push("/login")
      return
    }
    setUserState(u)
  }, [router])

  const handleUpgrade = (planId: "starter" | "pro" | "agency") => {
    if (!user || user.plan === planId) return
    setUpgrading(planId)
    setTimeout(() => {
      const updated = { ...user, plan: planId }
      setUser(updated)
      setUserState(updated)
      setUpgrading(null)
      setUpgraded(planId)
      setTimeout(() => setUpgraded(null), 3000)
    }, 1200)
  }

  if (!user) return null

  const planColors: Record<string, string> = {
    starter: "bg-blue-900/40 text-blue-300 border-blue-700",
    pro: "bg-violet-900/40 text-violet-300 border-violet-700",
    agency: "bg-amber-900/40 text-amber-300 border-amber-700",
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-1">Subscription</h1>
          <p className="text-slate-400">Manage your plan and billing</p>
        </div>

        {/* Current plan */}
        <Card className="bg-slate-800/60 border-white/10 mb-8">
          <CardHeader>
            <CardTitle className="text-white">Current Plan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Badge className={`capitalize text-sm px-3 py-1 ${planColors[user.plan]}`}>{user.plan}</Badge>
                  <span className="text-slate-400 text-sm">Active</span>
                </div>
                <p className="text-slate-400 text-sm">
                  Next renewal: {new Date(user.planExpiry).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-white">
                  {plans.find((p) => p.id === user.plan)?.price}
                  <span className="text-slate-400 text-base font-normal">/month</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {upgraded && (
          <div className="mb-6 p-4 rounded-xl bg-green-900/20 border border-green-500/30 text-green-400 text-sm">
            ✅ Plan upgraded to <span className="font-semibold capitalize">{upgraded}</span> successfully!
          </div>
        )}

        {/* Plan selection */}
        <h2 className="text-xl font-semibold mb-4">Change Plan</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isCurrent = user.plan === plan.id
            const isUpgrading = upgrading === plan.id
            return (
              <Card
                key={plan.id}
                className={`border ${
                  plan.highlight
                    ? "border-violet-500 bg-violet-950/30"
                    : isCurrent
                    ? "border-green-500/40 bg-green-950/20"
                    : "border-white/10 bg-slate-800/60"
                }`}
              >
                <CardHeader>
                  <CardTitle className="text-white">{plan.name}</CardTitle>
                  <div className="flex items-end gap-1">
                    <span className="text-4xl font-extrabold text-white">{plan.price}</span>
                    <span className="text-slate-400 mb-1">{plan.period}</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-slate-300">
                        <span className="text-green-400">✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={isCurrent || isUpgrading !== null}
                    className={`w-full ${
                      isCurrent
                        ? "bg-green-900/30 text-green-400 border border-green-500/30 cursor-default"
                        : plan.highlight
                        ? "bg-violet-600 hover:bg-violet-500 text-white"
                        : "bg-white/10 hover:bg-white/20 text-white"
                    }`}
                  >
                    {isCurrent ? "Current Plan" : isUpgrading ? "Upgrading..." : "Switch to " + plan.name}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Billing info */}
        <Card className="bg-slate-800/60 border-white/10 mt-8">
          <CardHeader>
            <CardTitle className="text-white text-lg">Billing Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Payment method</span>
              <span className="text-white">•••• •••• •••• 4242</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Billing email</span>
              <span className="text-white">{user.email}</span>
            </div>
            <Button variant="outline" className="mt-4 border-white/10 text-slate-300 hover:bg-white/5">
              Update Payment Method
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
