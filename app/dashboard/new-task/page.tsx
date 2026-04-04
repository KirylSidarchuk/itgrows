"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { addTask, type TaskType } from "@/lib/tasks"

const taskTypes = [
  { value: "seo_article", label: "SEO Article", icon: "✍️", desc: "AI writes and publishes an SEO-optimized blog post" },
  { value: "social_post", label: "Social Post", icon: "📱", desc: "Create and schedule posts for social media" },
  { value: "google_ads", label: "Google Ads", icon: "🎯", desc: "Configure and launch a Google Ads campaign" },
  { value: "image_generation", label: "Image Generation", icon: "🖼️", desc: "Generate custom AI images for your content" },
]

export default function NewTaskPage() {
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [type, setType] = useState<TaskType>("seo_article")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    addTask({ title, description, type })
    setSuccess(true)
    setTimeout(() => {
      router.push("/dashboard/tasks")
    }, 1200)
  }

  return (
    <div className="p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-1">New Task</h1>
          <p className="text-slate-400">Create a new content automation task</p>
        </div>

        {success ? (
          <Card className="bg-green-900/20 border-green-500/30">
            <CardContent className="py-12 text-center">
              <p className="text-4xl mb-4">✅</p>
              <h3 className="text-white text-xl font-semibold mb-2">Task created!</h3>
              <p className="text-slate-400">Redirecting to your tasks...</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-slate-800/60 border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Task Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Task type */}
                <div className="space-y-3">
                  <Label className="text-slate-300">Task Type</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {taskTypes.map((t) => (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => setType(t.value as TaskType)}
                        className={`p-4 rounded-xl border text-left transition-all ${
                          type === t.value
                            ? "border-violet-500 bg-violet-500/10"
                            : "border-white/10 bg-slate-700/40 hover:border-white/20"
                        }`}
                      >
                        <div className="text-2xl mb-2">{t.icon}</div>
                        <div className="text-white text-sm font-medium">{t.label}</div>
                        <div className="text-slate-400 text-xs mt-1">{t.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-slate-300">Task Title</Label>
                  <Input
                    id="title"
                    placeholder="e.g. Write article about AI marketing trends"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="bg-slate-700 border-white/10 text-white placeholder:text-slate-500 focus:border-violet-500"
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-slate-300">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe what you need — target keywords, audience, tone, length, platforms, etc."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    className="bg-slate-700 border-white/10 text-white placeholder:text-slate-500 focus:border-violet-500 resize-none"
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    className="border-white/10 text-slate-300 hover:bg-white/5"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading || !title}
                    className="flex-1 bg-violet-600 hover:bg-violet-500 text-white"
                  >
                    {loading ? "Creating..." : "Create Task"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
