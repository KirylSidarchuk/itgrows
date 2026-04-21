import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function PersonalWelcomePage() {
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

        {/* Icon */}
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-600 to-pink-600 flex items-center justify-center text-4xl mx-auto mb-8 shadow-lg shadow-violet-200">
          🎉
        </div>

        <h1 className="text-4xl font-extrabold text-[#1b1916] mb-4 leading-tight">
          Welcome to ItGrows Personal!
        </h1>
        <p className="text-lg text-slate-600 mb-3 leading-relaxed">
          Your LinkedIn autopilot is now active.
        </p>
        <p className="text-sm text-slate-500 mb-10">
          Connect your LinkedIn account and fill a 2-minute brief — then we&apos;ll start generating your posts automatically.
        </p>

        <Link href="/personal/cabinet">
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
      </div>
    </div>
  )
}
