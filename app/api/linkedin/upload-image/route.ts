import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { linkedinPosts } from "@/lib/db/schema"
import { and, eq } from "drizzle-orm"

// Let a customer put their own image on a post.
//
// Until now the only way to change an image was to generate another one, and a customer with
// something specific to say — a diagram, a photograph, anything the model will not invent — had
// no way to use it. Replacing the generated image was possible; supplying one was not.
//
// The image is stored exactly as generated ones are, as a data URL on the post, so nothing new
// has to be hosted or exposed and the publishing path is unchanged.

export const runtime = "nodejs"
export const maxDuration = 60

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"])
// Vercel caps a request body at 4.5 MB; base64 inflates by a third, so this is the real ceiling.
const MAX_BYTES = 3 * 1024 * 1024

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = (await req.json().catch(() => ({}))) as {
    postId?: string
    base64?: string
    mimeType?: string
  }
  const { postId, base64, mimeType } = body

  if (!postId || !base64 || !mimeType) {
    return NextResponse.json({ error: "postId, base64 and mimeType are required" }, { status: 400 })
  }
  if (!ALLOWED.has(mimeType)) {
    return NextResponse.json(
      { error: "Only JPEG, PNG and WebP images are supported." }, { status: 400 })
  }

  const clean = base64.includes(",") ? base64.slice(base64.indexOf(",") + 1) : base64
  let bytes: Buffer
  try {
    bytes = Buffer.from(clean, "base64")
  } catch {
    return NextResponse.json({ error: "Could not read the image data." }, { status: 400 })
  }
  if (bytes.length === 0) {
    return NextResponse.json({ error: "The image is empty." }, { status: 400 })
  }
  if (bytes.length > MAX_BYTES) {
    return NextResponse.json(
      { error: `Image is ${(bytes.length / 1048576).toFixed(1)} MB. Please use one under 3 MB.` },
      { status: 413 })
  }

  // The magic bytes have to agree with the declared type: a mislabelled file would publish as a
  // broken image on the customer's own profile, which they would see before we did.
  const sig = bytes.subarray(0, 12)
  const looksJpeg = sig[0] === 0xff && sig[1] === 0xd8
  const looksPng = sig[0] === 0x89 && sig[1] === 0x50 && sig[2] === 0x4e && sig[3] === 0x47
  const looksWebp = sig.subarray(0, 4).toString("ascii") === "RIFF" &&
    sig.subarray(8, 12).toString("ascii") === "WEBP"
  const matches =
    (mimeType === "image/jpeg" && looksJpeg) ||
    (mimeType === "image/png" && looksPng) ||
    (mimeType === "image/webp" && looksWebp)
  if (!matches) {
    return NextResponse.json(
      { error: "That file does not look like the image type it claims to be." }, { status: 400 })
  }

  const [post] = await db
    .select({ id: linkedinPosts.id, status: linkedinPosts.status })
    .from(linkedinPosts)
    .where(and(eq(linkedinPosts.id, postId), eq(linkedinPosts.userId, session.user.id)))
    .limit(1)

  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 })
  }
  // A published post is already on LinkedIn; changing the image here would only mislead.
  if (post.status === "published") {
    return NextResponse.json(
      { error: "This post is already published, so its image can no longer be changed." },
      { status: 409 })
  }

  const dataUrl = `data:${mimeType};base64,${bytes.toString("base64")}`
  await db.update(linkedinPosts)
    .set({ imageUrl: dataUrl })
    .where(eq(linkedinPosts.id, postId))

  return NextResponse.json({ ok: true, bytes: bytes.length })
}
