"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

const faqs = [
  { q: "How long does it take to generate an article?", a: "Most articles are generated within 2-5 minutes. Complex long-form content may take up to 10 minutes." },
  { q: "Can I edit AI-generated content?", a: "Yes! All generated content is fully editable before and after publishing. You have complete control." },
  { q: "Which social media platforms do you support?", a: "We support Instagram, Twitter/X, LinkedIn, Facebook, and TikTok (Beta)." },
  { q: "How do I connect my Google Ads account?", a: "Go to Settings > Integrations and click on Google Ads. You'll be guided through the OAuth setup." },
]

export default function SupportPage() {
  const [subject, setSubject] = useState("")
  const [feedbackText, setFeedbackText] = useState("")
  const [feedbackSent, setFeedbackSent] = useState(false)

  const sendFeedback = async () => {
    if (!feedbackText.trim()) return
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: subject || "General Feedback", message: feedbackText }),
      })
    } catch { /* ignore */ }
    setFeedbackSent(true)
    setFeedbackText("")
    setSubject("")
  }

  return (
    <div className="p-8">
      <div className="w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-1 text-[#1b1916] dashboard-heading">Support & Feedback</h1>
          <p className="text-slate-600">We&apos;re here to help you grow</p>
        </div>

        {/* Feedback form */}
        <div className="mb-8">
          <Card className="bg-white border-black/10 w-full">
            <CardHeader>
              <CardTitle className="text-[#1b1916]">Send Feedback</CardTitle>
            </CardHeader>
            <CardContent>
              {feedbackSent ? (
                <div className="py-8 text-center">
                  <p className="text-4xl mb-4">🙏</p>
                  <h3 className="text-[#1b1916] text-lg font-semibold mb-2">Thank you!</h3>
                  <p className="text-slate-600 text-sm">Your feedback helps us improve itgrows.ai.</p>
                  <Button
                    onClick={() => setFeedbackSent(false)}
                    variant="outline"
                    className="mt-6 border-slate-200 text-slate-600 hover:bg-[#ebe9e5]"
                  >
                    Send Another
                  </Button>
                </div>
              ) : (
                <form onSubmit={(e) => { e.preventDefault(); sendFeedback() }} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[#1b1916]">Category</Label>
                    <div className="flex flex-wrap gap-2">
                      {["Bug Report", "Feature Request", "General Feedback", "Billing"].map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => setSubject(tag)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                            subject === tag
                              ? "bg-violet-600 text-white border-violet-600"
                              : "border-slate-200 text-slate-600 hover:border-slate-300"
                          }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="feedback" className="text-[#1b1916]">Message</Label>
                    <Textarea
                      id="feedback"
                      placeholder="Tell us what's on your mind..."
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      rows={5}
                      required
                      className="bg-white border-slate-200 text-[#1b1916] placeholder:text-slate-400 focus:border-violet-500 resize-none"
                    />
                  </div>
                  <Button type="submit" className="w-full bg-violet-600 hover:bg-violet-500 text-white">
                    Submit Feedback
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>

        {/* FAQ */}
        <Card className="bg-white border-black/10">
          <CardHeader>
            <CardTitle className="text-violet-700">Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="border-b border-black/5 pb-4 last:border-0 last:pb-0">
                <h4 className="text-violet-700 font-medium mb-2">{faq.q}</h4>
                <p className="text-gray-900 text-sm leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
