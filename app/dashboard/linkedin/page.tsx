"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Suspense } from "react"

interface LinkedInAccount {
  id: string
  pageType: "personal" | "organization"
  pageName: string | null
  pageHandle: string | null
  linkedinPersonUrn: string | null
  linkedinOrgUrn: string | null
  expiresAt: string | null
  createdAt: string | null
}

function LinkedInPageContent() {
  const searchParams = useSearchParams()
  const [accounts, setAccounts] = useState<LinkedInAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"posts" | "schedule">("posts")
  const [disconnecting, setDisconnecting] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  const connected = searchParams.get("connected")
  const error = searchParams.get("error")

  useEffect(() => {
    if (connected === "1") {
      setStatusMessage("LinkedIn connected successfully!")
    } else if (error) {
      const messages: Record<string, string> = {
        oauth_denied: "LinkedIn authorization was denied.",
        token_failed: "Failed to obtain access token from LinkedIn.",
        server_error: "A server error occurred during connection.",
      }
      setStatusMessage(messages[error] ?? "Connection failed. Please try again.")
    }
  }, [connected, error])

  useEffect(() => {
    fetch("/api/linkedin/pages")
      .then((r) => r.json())
      .then((data) => {
        setAccounts(data.accounts ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  async function handleDisconnect(id?: string) {
    setDisconnecting(id ?? "all")
    const url = id ? `/api/linkedin/disconnect?id=${id}` : "/api/linkedin/disconnect"
    await fetch(url, { method: "DELETE" })
    setAccounts((prev) => (id ? prev.filter((a) => a.id !== id) : []))
    setDisconnecting(null)
  }

  const isConnected = accounts.length > 0

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1b1916] mb-1">LinkedIn</h1>
        <p className="text-sm text-slate-500">Connect your LinkedIn account to schedule and publish posts.</p>
      </div>

      {statusMessage && (
        <div
          className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium ${
            connected === "1"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {statusMessage}
        </div>
      )}

      {!isConnected && !loading && (
        <Card className="bg-white/70 backdrop-blur border-white/50 shadow-sm mb-6">
          <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
            <div className="w-14 h-14 bg-[#0077B5] rounded-2xl flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="white" className="w-8 h-8">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
            </div>
            <div className="text-center">
              <h2 className="text-lg font-semibold text-[#1b1916] mb-1">Connect LinkedIn</h2>
              <p className="text-sm text-slate-500 max-w-sm">
                Link your LinkedIn personal profile or company page to schedule posts and track performance.
              </p>
            </div>
            <a href="/api/linkedin/connect">
              <Button className="bg-[#0077B5] hover:bg-[#005f8e] text-white px-6">
                Connect LinkedIn
              </Button>
            </a>
          </CardContent>
        </Card>
      )}

      {isConnected && (
        <>
          <Card className="bg-white/70 backdrop-blur border-white/50 shadow-sm mb-6">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-[#1b1916]">Connected Accounts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {accounts.map((account) => (
                <div
                  key={account.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-white/60 bg-white/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-[#0077B5] rounded-lg flex items-center justify-center shrink-0">
                      <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#1b1916]">
                        {account.pageName ?? (account.pageType === "personal" ? "Personal Profile" : "Company Page")}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge
                          variant="outline"
                          className="text-xs border-violet-200 text-violet-600 px-1.5 py-0"
                        >
                          {account.pageType === "personal" ? "Personal" : "Organization"}
                        </Badge>
                        {account.pageHandle && (
                          <span className="text-xs text-slate-400">@{account.pageHandle}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-red-200 text-red-600 hover:bg-red-50 text-xs"
                    disabled={disconnecting === account.id}
                    onClick={() => handleDisconnect(account.id)}
                  >
                    {disconnecting === account.id ? "Disconnecting..." : "Disconnect"}
                  </Button>
                </div>
              ))}

              <div className="pt-2">
                <a href="/api/linkedin/connect">
                  <Button size="sm" variant="outline" className="border-violet-300 text-violet-600 hover:bg-violet-50 text-xs">
                    + Connect another account
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <div className="flex gap-1 mb-4 bg-white/50 rounded-xl p-1 w-fit">
            {(["posts", "schedule"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
                  activeTab === tab
                    ? "bg-white shadow-sm text-violet-700"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {tab === "posts" ? "Posts" : "Schedule"}
              </button>
            ))}
          </div>

          {activeTab === "posts" && (
            <Card className="bg-white/70 backdrop-blur border-white/50 shadow-sm">
              <CardContent className="py-10 flex flex-col items-center gap-3 text-center">
                <div className="text-3xl">📝</div>
                <p className="text-sm font-medium text-[#1b1916]">No posts yet</p>
                <p className="text-xs text-slate-400 max-w-xs">
                  Generate and schedule posts from the Schedule tab. They will appear here once created.
                </p>
              </CardContent>
            </Card>
          )}

          {activeTab === "schedule" && (
            <Card className="bg-white/70 backdrop-blur border-white/50 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-[#1b1916]">Generate Posts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Niche / Topic</label>
                  <input
                    type="text"
                    placeholder="e.g. SaaS growth, B2B marketing..."
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white/80 focus:outline-none focus:ring-2 focus:ring-violet-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Tone</label>
                  <select className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white/80 focus:outline-none focus:ring-2 focus:ring-violet-400">
                    <option>Professional</option>
                    <option>Casual</option>
                    <option>Inspirational</option>
                    <option>Educational</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Goals</label>
                  <input
                    type="text"
                    placeholder="e.g. drive traffic, build authority..."
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white/80 focus:outline-none focus:ring-2 focus:ring-violet-400"
                  />
                </div>
                <Button className="bg-gradient-to-r from-violet-600 to-pink-500 text-white hover:opacity-90 w-full">
                  Generate Posts
                </Button>
                <p className="text-xs text-slate-400 text-center">Post generation coming soon.</p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}

export default function LinkedInPage() {
  return (
    <Suspense>
      <LinkedInPageContent />
    </Suspense>
  )
}
