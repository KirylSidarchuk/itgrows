import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { images } from "@/lib/db/schema"
import { eq, desc, and, isNull, or } from "drizzle-orm"
import { storeAndRecordImage } from "@/lib/image-store"

const MAX_BYTES = 12 * 1024 * 1024

// The customer's image library: everything they uploaded, plus the covers
// generated for their own posts. Reusing one costs nothing, which is the point —
// a good image should not have to be generated twice.
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") ?? 60), 200)
  const mine = req.nextUrl.searchParams.get("mine") === "1"

  const rows = await db
    .select({
      id: images.id,
      url: images.url,
      bytes: images.bytes,
      source: images.source,
      alt: images.alt,
      prompt: images.prompt,
      createdAt: images.createdAt,
    })
    .from(images)
    .where(
      mine
        ? eq(images.userId, session.user.id)
        : or(eq(images.userId, session.user.id), isNull(images.userId))
    )
    .orderBy(desc(images.createdAt))
    .limit(limit)

  return NextResponse.json({ images: rows })
}

// Adds an image to the library without attaching it to a post, so a customer can
// build the library up front.
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { base64, filename, alt } = (await req.json()) as {
    base64?: string
    filename?: string
    alt?: string
  }
  if (!base64) return NextResponse.json({ error: "No image data" }, { status: 400 })

  const clean = base64.includes(",") ? base64.slice(base64.indexOf(",") + 1) : base64
  const bytes = Buffer.from(clean, "base64")
  if (bytes.length === 0) return NextResponse.json({ error: "The image is empty." }, { status: 400 })
  if (bytes.length > MAX_BYTES) {
    return NextResponse.json(
      { error: `Image is ${(bytes.length / 1048576).toFixed(1)} MB. Please use one under 12 MB.` },
      { status: 413 })
  }

  const url = await storeAndRecordImage(bytes, {
    filename: filename ?? "library-image",
    userId: session.user.id,
    kind: "uploaded",
    alt: alt ?? null,
  })

  if (!url) return NextResponse.json({ error: "Could not store the image." }, { status: 502 })
  return NextResponse.json({ url, bytes: bytes.length })
}

// Removes an image from the library listing. The file itself stays, because a
// published post may already point at it.
export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const id = req.nextUrl.searchParams.get("id")
  if (!id) return NextResponse.json({ error: "No id" }, { status: 400 })

  await db.delete(images).where(and(eq(images.id, id), eq(images.userId, session.user.id)))
  return NextResponse.json({ ok: true })
}
