import { ImageResponse } from "next/og"

// Share image for the AI-visibility pages ("/" and /business). public/og-image.png shows the
// LinkedIn/X product and stays on those pages. No guarantee here (30 Oct 2026): an image cannot link to
// its conditions.
export async function GET() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: "72px 80px", background: "#1b1916", color: "#ffffff" }}>
        <div style={{ display: "flex", fontSize: 30, fontWeight: 700, color: "#a78bfa" }}>ItGrows.ai</div>
        <div style={{ display: "flex", fontSize: 66, fontWeight: 800, lineHeight: 1.08, marginTop: 28 }}>
          Your customers ask ChatGPT who to pick. Make it you.
        </div>
        <div style={{ display: "flex", fontSize: 30, color: "#cbd5e1", marginTop: 32 }}>Free 30-second check · see who gets named instead of you</div>
      </div>
    ),
    { width: 1200, height: 630, headers: { "Cache-Control": "public, max-age=86400, s-maxage=86400" } },
  )
}
