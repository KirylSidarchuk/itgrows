"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { login } from "@/lib/auth"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    const user = login(email, password)
    if (user) {
      router.push("/dashboard")
    } else {
      setError("Invalid email or password. Password must be at least 6 characters.")
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#f3f2f1] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/">
            <span className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-pink-500 bg-clip-text text-transparent">
              itgrows.ai
            </span>
          </Link>
        </div>
        <Card className="bg-white border-black/10 shadow-sm">
          <CardHeader>
            <CardTitle className="text-[#1b1916] text-2xl">Welcome back</CardTitle>
            <CardDescription className="text-slate-500">Sign in to your account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[#1b1916]">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-white border-slate-200 text-[#1b1916] placeholder:text-slate-400 focus:border-violet-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-[#1b1916]">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-white border-slate-200 text-[#1b1916] placeholder:text-slate-400 focus:border-violet-500"
                />
              </div>
              {error && (
                <p className="text-red-500 text-sm">{error}</p>
              )}
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[#1b1916] hover:bg-[#2d2a25] text-[#f3f2f1]"
              >
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
            <p className="mt-6 text-center text-sm text-slate-500">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="text-violet-600 hover:text-violet-500">
                Sign up free
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
