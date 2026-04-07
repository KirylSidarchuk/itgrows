import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"

export interface ScheduledPost {
  id: string
  keyword: string
  language: string
  tone: string
  scheduledDate: string
  status: "scheduled" | "generating" | "published" | "failed"
  taskId?: string
  blogPostSlug?: string
}

// In-memory fallback for dev (no Vercel Blob token)
const memoryStore: ScheduledPost[] = []

const BLOB_FILENAME = "scheduled-posts.json"

async function getScheduledPosts(): Promise<ScheduledPost[]> {
  const token = process.env.BLOB_READ_WRITE_TOKEN
  if (!token) return [...memoryStore]

  try {
    const { list } = await import("@vercel/blob")
    const { blobs } = await list({ prefix: "scheduled-posts" })
    const blob = blobs.find((b) => b.pathname === BLOB_FILENAME)
    if (!blob) return []
    const res = await fetch(blob.url)
    if (!res.ok) return []
    return (await res.json()) as ScheduledPost[]
  } catch {
    return []
  }
}

async function saveScheduledPosts(posts: ScheduledPost[]): Promise<boolean> {
  const token = process.env.BLOB_READ_WRITE_TOKEN
  if (!token) {
    // In-memory fallback
    memoryStore.length = 0
    memoryStore.push(...posts)
    return true
  }

  try {
    const { put } = await import("@vercel/blob")
    await put(BLOB_FILENAME, JSON.stringify(posts), {
      access: "public",
      contentType: "application/json",
      allowOverwrite: true,
    })
    return true
  } catch {
    return false
  }
}

// GET — return all scheduled posts
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const posts = await getScheduledPosts()
  return NextResponse.json({ posts })
}

// POST — add a new scheduled post
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = (await req.json()) as Omit<ScheduledPost, "id">

    if (!body.keyword || !body.scheduledDate) {
      return NextResponse.json({ error: "keyword and scheduledDate are required" }, { status: 400 })
    }

    const post: ScheduledPost = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      keyword: body.keyword,
      language: body.language || "en",
      tone: body.tone || "Professional",
      scheduledDate: body.scheduledDate,
      status: "scheduled",
    }

    const existing = await getScheduledPosts()
    existing.push(post)
    await saveScheduledPosts(existing)

    return NextResponse.json({ post })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

// PATCH — update status (and optionally taskId/blogPostSlug)
export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = (await req.json()) as {
      id: string
      status?: ScheduledPost["status"]
      taskId?: string
      blogPostSlug?: string
    }

    if (!body.id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 })
    }

    const posts = await getScheduledPosts()
    const idx = posts.findIndex((p) => p.id === body.id)
    if (idx === -1) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    if (body.status) posts[idx].status = body.status
    if (body.taskId) posts[idx].taskId = body.taskId
    if (body.blogPostSlug) posts[idx].blogPostSlug = body.blogPostSlug

    await saveScheduledPosts(posts)

    return NextResponse.json({ post: posts[idx] })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
