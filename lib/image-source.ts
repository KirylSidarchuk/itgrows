// Loads a post image regardless of how it is stored.
//
// Images used to live in Postgres as base64 data URLs. They are moving to files
// on the VM, served at http://136.114.136.34/images/<name>. Both forms have to
// keep working: rows written before the move still hold data URLs, and nothing
// rewrites them in place.

const MAX_IMAGE_BYTES = 12 * 1024 * 1024
const FETCH_TIMEOUT_MS = 20_000

function looksLikeImage(buf: Buffer): boolean {
  if (buf.length < 12) return false
  // JPEG
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return true
  // PNG
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return true
  // GIF
  if (buf.subarray(0, 3).toString("latin1") === "GIF") return true
  // WEBP
  if (buf.subarray(0, 4).toString("latin1") === "RIFF" && buf.subarray(8, 12).toString("latin1") === "WEBP") return true
  return false
}

/**
 * Returns the raw image bytes for a stored image reference.
 * Accepts a base64 data URL or an http(s) URL. Throws with a specific reason
 * on anything else — a silent empty buffer would publish a broken post.
 */
export async function loadImageBuffer(src: string | null | undefined): Promise<Buffer> {
  if (!src || !src.trim()) {
    throw new Error("image source is empty")
  }

  let buf: Buffer

  if (src.startsWith("data:")) {
    const base64 = src.replace(/^data:[^;]+;base64,/, "")
    if (base64 === src) {
      throw new Error("data URL is not base64-encoded")
    }
    buf = Buffer.from(base64, "base64")
  } else if (/^https?:\/\//i.test(src)) {
    const res = await fetch(src, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) })
    if (!res.ok) {
      throw new Error(`image fetch failed: HTTP ${res.status} for ${src}`)
    }
    buf = Buffer.from(await res.arrayBuffer())
  } else {
    throw new Error(`unsupported image source: ${src.slice(0, 40)}`)
  }

  if (buf.length === 0) {
    throw new Error("image source decoded to zero bytes")
  }
  if (buf.length > MAX_IMAGE_BYTES) {
    throw new Error(`image too large: ${buf.length} bytes`)
  }
  if (!looksLikeImage(buf)) {
    throw new Error("image source did not decode to a recognised image format")
  }

  return buf
}

/** True when the reference is a stored file rather than inline base64. */
export function isFileUrl(src: string | null | undefined): boolean {
  return !!src && /^https?:\/\//i.test(src)
}
