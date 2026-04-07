import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"

const VM_UPLOAD_URL = "http://136.114.136.34:4001/upload"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { base64, mimeType, filename } = await req.json()

  if (!base64) {
    return NextResponse.json({ error: "No base64 data provided" }, { status: 400 })
  }

  const uploadRes = await fetch(VM_UPLOAD_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ base64, mimeType, filename }),
  })

  if (!uploadRes.ok) {
    const err = await uploadRes.text()
    return NextResponse.json({ error: `Upload failed: ${err}` }, { status: 500 })
  }

  const data = await uploadRes.json()
  return NextResponse.json({ url: data.url })
}
