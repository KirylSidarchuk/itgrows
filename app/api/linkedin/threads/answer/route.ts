import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { postThreads } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

// The author's answer to the one question asked at the end of a batch.
//
// This is the only thing that moves a thread's state. The system may notice that something looks
// like it has shifted and ask; deciding that someone has changed their mind is not a judgement a
// machine gets to make, and every row it writes here records that a person set it.
//
// Reached from a link in an email, so it has to work in one click with no session. The thread id
// is a v4 UUID — unguessable, and the worst a leaked one allows is setting a state on a single
// thread, which its owner can change back.

export const dynamic = "force-dynamic"

const ANSWERS: Record<string, { state: string; said: string }> = {
  same: { state: "provisional", said: "still stands" },
  refined: { state: "refinement", said: "refined" },
  changed: { state: "challenge", said: "changed" },
  resting: { state: "resting", said: "done with for now" },
}

function page(title: string, body: string) {
  return new Response(
    `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
     <title>${title}</title>
     <div style="font:16px/1.6 -apple-system,Segoe UI,Roboto,sans-serif;max-width:36rem;margin:14vh auto;padding:0 1.5rem;color:#1b1916">
       <h1 style="font-size:22px;margin:0 0 12px">${title}</h1>
       <p style="margin:0;color:#555">${body}</p>
     </div>`,
    { headers: { "content-type": "text/html; charset=utf-8" } }
  )
}

export async function GET(req: NextRequest) {
  const p = new URL(req.url).searchParams
  const threadId = p.get("thread") ?? ""
  const answer = p.get("answer") ?? ""

  const choice = ANSWERS[answer]
  if (!choice || !/^[0-9a-f-]{36}$/i.test(threadId)) {
    return page("That link did not work", "Nothing has been changed.")
  }

  const [thread] = await db
    .select({ id: postThreads.id, name: postThreads.name })
    .from(postThreads)
    .where(eq(postThreads.id, threadId))
    .limit(1)

  if (!thread) {
    return page("That link did not work", "Nothing has been changed.")
  }

  await db
    .update(postThreads)
    .set({ state: choice.state, stateSetBy: "author", updatedAt: new Date() })
    .where(eq(postThreads.id, threadId))

  return page(
    "Noted",
    `&ldquo;${thread.name}&rdquo; is marked as <b>${choice.said}</b>. The next batch will treat it that way. ` +
    `Nothing else has changed, and you can say otherwise at any point.`
  )
}
