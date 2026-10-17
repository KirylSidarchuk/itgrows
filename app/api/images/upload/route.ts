import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { storeImage } from "@/lib/image-store"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { base64, filename } = await req.json()

  if (!base64) {
    return NextResponse.json({ error: "No base64 data provided" }, { status: 400 })
  }

  const stored = await storeImage(base64, filename)
  if (!stored) {
    return NextResponse.json({ error: "Upload failed" }, { status: 502 })
  }

  return NextResponse.json({ url: stored.url, bytes: stored.bytes, reused: stored.reused })
}
