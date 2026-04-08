import { NextRequest, NextResponse } from "next/server"

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

// GET — DEPRECATED: this legacy blob-based endpoint has no per-user data isolation.
// All scheduling is now handled by /api/schedule/posts (DB-backed, userId-scoped).
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET() {
  return NextResponse.json(
    { error: "This endpoint is deprecated. Use /api/schedule/posts instead." },
    { status: 410 }
  )
}

// POST — DEPRECATED: this legacy blob-based endpoint has no per-user data isolation.
// All scheduling is now handled by /api/schedule/posts (DB-backed, userId-scoped).
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function POST(_req: NextRequest) {
  return NextResponse.json(
    { error: "This endpoint is deprecated. Use /api/schedule/posts instead." },
    { status: 410 }
  )
}

// PATCH — DEPRECATED: this legacy blob-based endpoint has no per-user data isolation.
// All scheduling is now handled by /api/schedule/posts (DB-backed, userId-scoped).
// This endpoint is intentionally disabled to prevent cross-user data modification.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function PATCH(_req: NextRequest) {
  return NextResponse.json(
    { error: "This endpoint is deprecated. Use /api/schedule/posts instead." },
    { status: 410 }
  )
}
