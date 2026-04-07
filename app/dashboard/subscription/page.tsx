"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

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
  const { data: session, status } = useSession()
  const [currentPlan, setCurrentPlan] = useState<"starter" | "pro" | "agency">("starter")
  const [upgrading, setUpgrading] = useState<string | null>(null)
  const [upgraded, setUpgraded] = useState<string | null>(null)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  const handleUpgrade = (planId: "starter" | "pro" | "agency") => {
    if (currentPlan === planId) return
    setUpgrading(planId)
    setTimeout(() => {
      setCurrentPlan(planId)
      setUpgrading(null)
      setUpgraded(planId)
      setTimeout(() => setUpgraded(null), 3000)
    }, 1200)
  }

  if (status !== "authenticated") return null

  const planColors: Record<string, string> = {
    starter: "bg-blue-100 text-blue-700 border-blue-200",
    pro: "bg-violet-100 text-violet-700 border-violet-200",
    agency: "bg-amber-100 text-amber-700 border-amber-200",
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-1 text-[#1b1916]">Subscription</h1>
          <p className="text-slate-600">Manage your plan and billing</p>
        </div>

        {/* Current plan */}
        <Card className="bg-white border-black/10 mb-8">
          <CardHeader>
            <CardTitle className="text-[#1b1916]">Current Plan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Badge className={`capitalize text-sm px-3 py-1 ${planColors[currentPlan]}`}>{currentPlan}</Badge>
                  <span className="text-slate-500 text-sm">Active</span>
                </div>
                <p className="text-slate-600 text-sm">
                  Next renewal: —
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-[#1b1916]">
                  {plans.find((p) => p.id === currentPlan)?.price}
                  <span className="text-slate-500 text-base font-normal">/month</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {upgraded && (
          <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-300 text-green-700 text-sm">
            ✅ Plan upgraded to <span className="font-semibold capitalize">{upgraded}</span> successfully!
          </div>
        )}

        {/* Plan selection */}
        <h2 className="text-xl font-semibold mb-4 text-[#1b1916]">Change Plan</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isCurrent = currentPlan === plan.id
            const isUpgrading = upgrading === plan.id
            return (
              <Card
                key={plan.id}
                className={`border ${
                  plan.highlight
                    ? "border-violet-400 bg-violet-50"
                    : isCurrent
                    ? "border-green-400 bg-green-50"
                    : "border-black/10 bg-white"
                }`}
              >
                <CardHeader>
                  <CardTitle className="text-[#1b1916]">{plan.name}</CardTitle>
                  <div className="flex items-end gap-1">
                    <span className="text-4xl font-extrabold text-[#1b1916]">{plan.price}</span>
                    <span className="text-slate-500 mb-1">{plan.period}</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
                        <span className="text-green-600">✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={isCurrent || isUpgrading !== null}
                    className={`w-full ${
                      isCurrent
                        ? "bg-green-100 text-green-700 border border-green-300 cursor-default"
                        : plan.highlight
                        ? "bg-violet-600 hover:bg-violet-500 text-white"
                        : "bg-[#ebe9e5] hover:bg-[#dedad4] text-[#1b1916] border border-black/10"
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
        <Card className="bg-white border-black/10 mt-8">
          <CardHeader>
            <CardTitle className="text-[#1b1916] text-lg">Billing Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Payment method</span>
              <span className="text-[#1b1916]">•••• •••• •••• 4242</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Billing email</span>
              <span className="text-[#1b1916]">{session?.user?.email}</span>
            </div>
            <Button variant="outline" className="mt-4 border-slate-200 text-slate-600 hover:bg-[#ebe9e5]">
              Update Payment Method
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
