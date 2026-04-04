import { NextRequest, NextResponse } from "next/server"

export interface BlogPost {
  id: string
  slug: string
  title: string
  content: string
  metaDescription: string
  keywords: string[]
  keyword: string
  publishedAt: string
  status: "published"
}

function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim() +
    "-" +
    Date.now().toString(36)
  )
}

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

async function saveBlobPosts(posts: BlogPost[]): Promise<boolean> {
  const token = process.env.BLOB_READ_WRITE_TOKEN
  if (!token) return false

  try {
    const { put } = await import("@vercel/blob")
    await put("blog-posts.json", JSON.stringify(posts), {
      access: "public",
      contentType: "application/json",
      allowOverwrite: true,
    })
    return true
  } catch {
    return false
  }
}

export async function GET() {
  const hasBlobToken = !!process.env.BLOB_READ_WRITE_TOKEN

  if (!hasBlobToken) {
    return NextResponse.json({ posts: [], storage: "none" })
  }

  const posts = await getBlobPosts()
  return NextResponse.json({ posts, storage: "blob" })
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      title: string
      content: string
      metaDescription: string
      keywords: string[]
      keyword: string
    }

    if (!body.title || !body.content) {
      return NextResponse.json({ success: false, error: "Missing title or content" }, { status: 400 })
    }

    const post: BlogPost = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      slug: slugify(body.title),
      title: body.title,
      content: body.content,
      metaDescription: body.metaDescription || "",
      keywords: body.keywords || [],
      keyword: body.keyword || "",
      publishedAt: new Date().toISOString(),
      status: "published",
    }

    const hasBlobToken = !!process.env.BLOB_READ_WRITE_TOKEN

    if (!hasBlobToken) {
      return NextResponse.json(
        {
          success: false,
          post,
          storage: "none",
          error: "BLOB_READ_WRITE_TOKEN not configured. Post saved client-side as fallback.",
        },
        { status: 200 }
      )
    }

    const existing = await getBlobPosts()
    existing.unshift(post)
    const saved = await saveBlobPosts(existing)

    if (!saved) {
      return NextResponse.json(
        { success: false, post, storage: "error", error: "Failed to save to Vercel Blob" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, post, storage: "blob" })
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}
