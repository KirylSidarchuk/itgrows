import { NextRequest, NextResponse } from "next/server"
import type { BlogPost } from "../route"

async function getBlobPosts(): Promise<BlogPost[]> {
  const token = process.env.BLOB_READ_WRITE_TOKEN
  if (!token) return []

  try {
    const { list } = await import("@vercel/blob")
    const { blobs } = await list({ prefix: "blog-posts" })
    const blogBlob = blobs.find((b) => b.pathname === "blog-posts.json")
    if (!blogBlob) return []
    const res = await fetch(blogBlob.url)
    if (!res.ok) return []
    return (await res.json()) as BlogPost[]
  } catch {
    return []
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  const posts = await getBlobPosts()
  const post = posts.find((p) => p.slug === slug)

  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 })
  }

  return NextResponse.json({ post })
}
