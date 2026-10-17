// Client for the image store on the VM.
//
// Posts image bytes to the store, which writes a file under /var/www/images and
// returns the public https URL. Callers keep the URL in the database instead of
// a multi-megabyte base64 data URL.
//
// Needs IMAGE_STORE_TOKEN. Without it the store answers 401, so a missing
// variable is reported rather than quietly turned into a fallback.

const STORE_URL = process.env.IMAGE_STORE_URL ?? "https://blogs.itgrows.ai/image-upload"
const STORE_TOKEN = process.env.IMAGE_STORE_TOKEN ?? ""

export interface StoredImage {
  url: string
  name: string
  bytes: number
  sha256: string
  reused: boolean
}

/**
 * Stores an image and returns its public URL, or null when the store could not
 * take it. Never throws: a failed store should not take a publish down with it,
 * but every failure is logged with its reason.
 */
export async function storeImage(
  source: string | Buffer,
  filename?: string
): Promise<StoredImage | null> {
  if (!STORE_TOKEN) {
    console.error("[image-store] IMAGE_STORE_TOKEN is not set — keeping the image inline")
    return null
  }

  const base64 = Buffer.isBuffer(source)
    ? source.toString("base64")
    : source.replace(/^data:[^;]+;base64,/, "")

  if (!base64) {
    console.error("[image-store] empty image payload")
    return null
  }

  try {
    const res = await fetch(STORE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${STORE_TOKEN}`,
      },
      body: JSON.stringify({ base64, filename }),
      signal: AbortSignal.timeout(60_000),
    })

    if (!res.ok) {
      console.error(`[image-store] HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`)
      return null
    }

    const data = (await res.json()) as Partial<StoredImage>
    if (!data.url) {
      console.error("[image-store] store returned no url")
      return null
    }
    return data as StoredImage
  } catch (err) {
    console.error("[image-store] request failed:", err)
    return null
  }
}

/** True when a stored value is a file URL rather than inline base64. */
export function isStoredUrl(value: string | null | undefined): boolean {
  return !!value && /^https?:\/\//i.test(value)
}

/**
 * Stores an image and indexes it in the library, returning the public URL or
 * null. The index row is best-effort: a stored file the library does not know
 * about is still a working image, so a failed insert must not lose the URL.
 */
export async function storeAndRecordImage(
  source: string | Buffer,
  meta: {
    filename?: string
    userId?: string | null
    kind?: "generated" | "uploaded" | "migrated"
    mime?: string | null
    prompt?: string | null
    alt?: string | null
  } = {}
): Promise<string | null> {
  const stored = await storeImage(source, meta.filename)
  if (!stored) return null

  try {
    const { db } = await import("@/lib/db")
    const { images } = await import("@/lib/db/schema")
    const { and, eq } = await import("drizzle-orm")

    const existing = await db
      .select({ id: images.id })
      .from(images)
      .where(
        meta.userId
          ? and(eq(images.sha256, stored.sha256), eq(images.userId, meta.userId))
          : eq(images.sha256, stored.sha256)
      )
      .limit(1)

    if (existing.length === 0) {
      await db.insert(images).values({
        userId: meta.userId ?? null,
        url: stored.url,
        name: stored.name,
        sha256: stored.sha256,
        bytes: stored.bytes,
        mime: meta.mime ?? null,
        source: meta.kind ?? "generated",
        prompt: meta.prompt ?? null,
        alt: meta.alt ?? null,
      })
    }
  } catch (err) {
    console.error("[image-store] stored the file but could not index it:", err)
  }

  return stored.url
}
