import { robotsTxt } from "@/lib/site-robots"

// /robots.txt: the rules of lib/site-robots.ts and the Content-Signal line. Built once, like the
// app/robots.ts it replaces (13 Nov 2026), and sent with the headers Next sent for that file.
export const dynamic = "force-static"

export function GET(): Response {
  return new Response(robotsTxt(), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  })
}
