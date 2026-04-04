"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"

type Message = { role: "user" | "support"; text: string; ts: string }

const faqs = [
  { q: "How long does it take to generate an article?", a: "Most articles are generated within 2-5 minutes. Complex long-form content may take up to 10 minutes." },
  { q: "Can I edit AI-generated content?", a: "Yes! All generated content is fully editable before and after publishing. You have complete control." },
  { q: "Which social media platforms do you support?", a: "We support Instagram, Twitter/X, LinkedIn, Facebook, and TikTok (Beta)." },
  { q: "How do I connect my Google Ads account?", a: "Go to Settings > Integrations and click on Google Ads. You'll be guided through the OAuth setup." },
]

export default function SupportPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "support",
      text: "Hi there! 👋 I'm your ItGrows.ai support assistant. How can I help you today?",
      ts: new Date().toISOString(),
    },
  ])
  const [input, setInput] = useState("")
  const [subject, setSubject] = useState("")
  const [feedbackText, setFeedbackText] = useState("")
  const [feedbackSent, setFeedbackSent] = useState(false)

  const sendMessage = () => {
    if (!input.trim()) return
    const userMsg: Message = { role: "user", text: input, ts: new Date().toISOString() }
    setMessages((prev) => [...prev, userMsg])
    setInput("")

    // Auto reply
    setTimeout(() => {
      const reply: Message = {
        role: "support",
        text: "Thanks for your message! A support agent will get back to you within 2-4 hours. In the meantime, check our FAQ below for quick answers.",
        ts: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, reply])
    }, 1000)
  }

  const sendFeedback = () => {
    if (!feedbackText.trim()) return
    setFeedbackSent(true)
    setFeedbackText("")
    setSubject("")
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-1">Support & Feedback</h1>
          <p className="text-slate-400">We&apos;re here to help you grow</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Live Chat */}
          <Card className="bg-slate-800/60 border-white/10 flex flex-col h-[500px]">
            <CardHeader className="border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-pink-600 flex items-center justify-center text-sm">
                  GE
                </div>
                <div>
                  <CardTitle className="text-white text-base">Live Support</CardTitle>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-green-400"></span>
                    <span className="text-slate-400 text-xs">Online</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-4 overflow-hidden">
              <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-1">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm ${
                        msg.role === "user"
                          ? "bg-violet-600 text-white rounded-br-sm"
                          : "bg-slate-700 text-slate-200 rounded-bl-sm"
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Type a message..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  className="bg-slate-700 border-white/10 text-white placeholder:text-slate-500 focus:border-violet-500"
                />
                <Button onClick={sendMessage} className="bg-violet-600 hover:bg-violet-500 text-white shrink-0">
                  Send
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Feedback form */}
          <Card className="bg-slate-800/60 border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Send Feedback</CardTitle>
            </CardHeader>
            <CardContent>
              {feedbackSent ? (
                <div className="py-8 text-center">
                  <p className="text-4xl mb-4">🙏</p>
                  <h3 className="text-white text-lg font-semibold mb-2">Thank you!</h3>
                  <p className="text-slate-400 text-sm">Your feedback helps us improve ItGrows.ai.</p>
                  <Button
                    onClick={() => setFeedbackSent(false)}
                    variant="outline"
                    className="mt-6 border-white/10 text-slate-300 hover:bg-white/5"
                  >
                    Send Another
                  </Button>
                </div>
              ) : (
                <form onSubmit={(e) => { e.preventDefault(); sendFeedback() }} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-slate-300">Category</Label>
                    <div className="flex flex-wrap gap-2">
                      {["Bug Report", "Feature Request", "General Feedback", "Billing"].map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => setSubject(tag)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                            subject === tag
                              ? "bg-violet-600 text-white border-violet-600"
                              : "border-white/10 text-slate-400 hover:border-white/30"
                          }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="feedback" className="text-slate-300">Message</Label>
                    <Textarea
                      id="feedback"
                      placeholder="Tell us what's on your mind..."
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      rows={5}
                      required
                      className="bg-slate-700 border-white/10 text-white placeholder:text-slate-500 focus:border-violet-500 resize-none"
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
        <Card className="bg-slate-800/60 border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="border-b border-white/5 pb-4 last:border-0 last:pb-0">
                <h4 className="text-white font-medium mb-2">{faq.q}</h4>
                <p className="text-slate-400 text-sm leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
