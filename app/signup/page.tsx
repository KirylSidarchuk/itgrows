"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { login } from "@/lib/auth"

export default function SignupPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    if (password.length < 6) {
      setError("Password must be at least 6 characters.")
      setLoading(false)
      return
    }
    const user = login(email, password)
    if (user) {
      router.push("/dashboard")
    } else {
      setError("Something went wrong. Please try again.")
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
            <CardTitle className="text-[#1b1916] text-2xl">Start your free trial</CardTitle>
            <CardDescription className="text-slate-500">14 days free. No credit card required.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-[#1b1916]">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Your Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="bg-white border-slate-200 text-[#1b1916] placeholder:text-slate-400 focus:border-violet-500"
                />
              </div>
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
                  placeholder="Min. 6 characters"
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
                {loading ? "Creating account..." : "Create Free Account"}
              </Button>
            </form>
            <p className="mt-4 text-xs text-slate-500 text-center">
              By signing up, you agree to our Terms of Service and Privacy Policy.
            </p>
            <p className="mt-4 text-center text-sm text-slate-500">
              Already have an account?{" "}
              <Link href="/login" className="text-violet-600 hover:text-violet-500">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
