import { NextResponse } from "next/server"
import { auth } from "@/auth"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const params = new URLSearchParams({
    client_id: process.env.INSTAGRAM_CLIENT_ID!,
    redirect_uri: `${process.env.NEXTAUTH_URL}/api/instagram/callback`,
    scope: "instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement",
    response_type: "code",
    state: session.user.id,
  })

  return NextResponse.redirect(`https://www.facebook.com/v19.0/dialog/oauth?${params}`)
}
