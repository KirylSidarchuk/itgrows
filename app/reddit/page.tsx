import type { Metadata } from "next"
import Link from "next/link"
import RequestForm from "./RequestForm"

// Server-rendered and static: the substance has to be in the HTML for search engines and
// assistants. Every claim here is something the engine does today, checked on its first run
// (2026-10-14); nothing about results we have not measured yet.
export const metadata: Metadata = {
  title: "A daily Reddit plan for your product | ItGrows",
  description:
    "Give us your site and your goal. Every morning: 3–5 things to do on Reddit, with the thread, the reason and the reply written. You post from your own account; we check what happened.",
  alternates: { canonical: "https://www.itgrows.ai/reddit" },
  openGraph: {
    title: "A daily Reddit plan for your product",
    description: "3–5 Reddit actions a day with replies written. You post, we check the result. Closed beta.",
    url: "https://www.itgrows.ai/reddit",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "A daily Reddit plan for your product",
    description: "3–5 Reddit actions a day with replies written. You post, we check the result. Closed beta.",
  },
}

const STEPS = [
  {
    t: "Your site in, a profile out",
    d: "We read your site: what you sell, who buys, who they compare you with, how they would ask for it on Reddit. Then we ask the few things a site never says: which account will post, what you must never claim, how you count a result.",
  },
  {
    t: "Reddit, read for you",
    d: "We find the threads where your buyers ask, check each one line by line (who asked, what they need, who already got recommended, whether you are named), and read each community’s own rules on self-promotion.",
  },
  {
    t: "A two-week strategy",
    d: "Which communities to answer in, which to post in, which to leave alone, how often your product may be mentioned there, and how to warm up an account that is new.",
  },
  {
    t: "Every morning, 3–5 tasks",
    d: "Rebuilt daily, because a fresh thread is worth most in its first day or two. Each task has the thread, why it is worth it today, the reply written, and anything to confirm before posting. Fewer tasks when the threads are not good enough.",
  },
  {
    t: "You post, we check",
    d: "You paste the link to what you posted. The next day we look again: is it still up, did moderators remove it, did anyone answer. Tomorrow’s plan learns from that.",
  },
]

const NOT = [
  "We never post for you. A person posts from their own account.",
  "No fake accounts, no fake customers, no vote buying.",
  "Your product is mentioned only with a plain disclosure, and only where the community allows it.",
  "No links unless someone in the thread asks for one.",
]

const FAQS = [
  {
    q: "Why don’t you post automatically?",
    a: "Because it gets accounts banned. Communities like r/3Dprinting ban undisclosed promotion permanently, and moderators recognise automated posting quickly. What survives is a real person giving a useful answer and saying who they work for. We automate everything up to that point.",
  },
  {
    q: "Do you use the Reddit API?",
    a: "No. Reddit stops accepting new public API requests on 31 October 2026 and closes the public API in March 2027. We find and read threads through a web search service, so the planner does not depend on Reddit’s API decisions.",
  },
  {
    q: "Can you guarantee I won’t be banned?",
    a: "No one can. We plan within each community’s written rules and keep product mentions rare and disclosed. Moderators still decide. If a comment is removed, we see it the next day and the plan changes.",
  },
  {
    q: "What does it cost?",
    a: "Nothing during the closed beta. We will set a price once we have measured results on the first projects.",
  },
  {
    q: "How do you measure results?",
    a: "Two layers. Whether each task was done and stayed up, from the link you paste. And what it brought: replies, and clicks, installs or sign-ups through your own tracking links. Votes are only approximate without Reddit’s API, so we do not report them as exact.",
  },
]

function jsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  }
}

export default function RedditLanding() {
  return (
    <div
      className="min-h-screen text-[#1b1916] scroll-smooth"
      style={{ backgroundColor: "#f3f2f1", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd()) }} />

      <nav className="border-b border-black/10 px-4 sm:px-6 py-4 sticky top-0 z-50" style={{ backgroundColor: "#f3f2f1" }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold bg-gradient-to-r from-violet-600 to-cyan-600 bg-clip-text text-transparent shrink-0">
            <img src="/logo.jpg" className="h-8 w-8 rounded-lg" alt="ItGrows" />
            <span>ItGrows.ai</span>
          </Link>
          <div className="hidden md:flex items-center gap-7">
            <a href="#how" className="text-sm text-slate-600 hover:text-[#1b1916] font-medium">How it works</a>
            <a href="#example" className="text-sm text-slate-600 hover:text-[#1b1916] font-medium">Example</a>
            <a href="#faq" className="text-sm text-slate-600 hover:text-[#1b1916] font-medium">FAQ</a>
          </div>
          <a href="#apply" className="rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold px-4 py-2.5 shrink-0">
            Request access
          </a>
        </div>
      </nav>

      <section className="relative px-4 sm:px-6 pt-12 sm:pt-16 pb-12 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-orange-100/60 to-transparent pointer-events-none" />
        <div className="relative max-w-3xl mx-auto text-center">
          <p className="text-[11px] uppercase tracking-[0.15em] font-bold text-orange-700 mb-4">Reddit planner · closed beta</p>
          <h1 className="text-3xl sm:text-5xl font-extrabold leading-[1.08] mb-5 tracking-tight">
            A daily Reddit plan for your product
          </h1>
          <p className="text-base sm:text-xl text-slate-600 max-w-2xl mx-auto mb-8">
            Give us your site and what you want from Reddit. Every morning you get 3–5 things to do there: which thread, why
            today, and the reply already written. You post from your own account. We check what happened.
          </p>
          <a href="#apply" className="inline-block rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold px-6 py-3">
            Request beta access
          </a>
        </div>
      </section>

      <section id="how" className="px-4 sm:px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold mb-8">How it works</h2>
          <ol className="grid gap-4">
            {STEPS.map((s, i) => (
              <li key={s.t} className="bg-white border border-black/10 rounded-2xl p-5 grid grid-cols-[2rem_1fr] gap-3">
                <span className="text-violet-600 font-bold tabular-nums">{i + 1}</span>
                <div className="min-w-0">
                  <h3 className="font-semibold mb-1">{s.t}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{s.d}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="example" className="px-4 sm:px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">One task, as it arrives</h2>
          <p className="text-slate-600 mb-6">From the first run for a phone 3D-scanning app, 14 October 2026. Shortened.</p>
          <article className="bg-white border border-black/10 rounded-2xl p-5 grid gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold rounded-full px-2.5 py-0.5 bg-amber-100 text-amber-800">P1</span>
              <span className="text-xs font-semibold rounded-full px-2.5 py-0.5 bg-violet-100 text-violet-800">Reply</span>
              <span className="text-sm text-slate-500">r/3Dprinting</span>
            </div>
            <h3 className="font-semibold">What’s the easiest way to do detailed 3d scanning for printing?</h3>
            <p className="text-sm text-slate-600">
              Shows up in search for the cheap-scanning question, and no answer yet explains how to capture the fine detail the
              person actually needs.
            </p>
            <div className="bg-[#f6f5f4] rounded-xl p-4 text-sm leading-relaxed whitespace-pre-wrap">
              {"Good news: rocks are close to the ideal photogrammetry subject. They’re matte, full of texture and don’t move, so you probably don’t need to pay a service if you have a reasonably recent phone.\n\n- Shoot in soft, even light. Overcast daylight is great.\n- Set the rock on a lazy susan with a plain background. Take a photo every 10 to 15 degrees at a low angle, then repeat higher.\n- Flip it over and do the bottom as a second set…"}
            </div>
            <p className="text-sm">
              <span className="font-semibold">Before posting:</span>{" "}
              <span className="text-slate-700">confirm the thread is still open; keep it brand-free (the account is still warming up).</span>
            </p>
          </article>
          <p className="text-sm text-slate-500 mt-4">
            That run made 19 searches, found 53 threads and checked 8 of them line by line. 4 became tasks; 5 were left alone, each
            with a reason, such as another company’s launch thread or a community that forbids commercial posts.
          </p>
        </div>
      </section>

      <section className="px-4 sm:px-6 py-12">
        <div className="max-w-4xl mx-auto bg-white border border-black/10 rounded-2xl p-6">
          <h2 className="text-xl font-bold mb-4">What it will not do</h2>
          <ul className="grid gap-2 text-slate-700">
            {NOT.map((n) => (
              <li key={n} className="flex gap-2">
                <span className="text-violet-600">—</span>
                <span>{n}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="faq" className="px-4 sm:px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold mb-6">Questions</h2>
          <div className="grid gap-3">
            {FAQS.map((f) => (
              <details key={f.q} className="bg-white border border-black/10 rounded-2xl p-5">
                <summary className="font-semibold cursor-pointer">{f.q}</summary>
                <p className="text-sm text-slate-600 leading-relaxed mt-3">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section id="apply" className="px-4 sm:px-6 py-12 pb-20">
        <div className="max-w-xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold mb-2 text-center">Request beta access</h2>
          <p className="text-slate-600 text-center mb-6">
            Free during the beta. We add projects a few at a time. Already in?{" "}
            <Link href="/reddit/app" className="text-violet-700 hover:underline">
              Open the planner
            </Link>
          </p>
          <RequestForm />
        </div>
      </section>

      <footer className="border-t border-black/10 px-4 sm:px-6 py-8 text-sm text-slate-500">
        <div className="max-w-6xl mx-auto flex flex-wrap gap-4 justify-between">
          <span>© ItGrows.ai</span>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-[#1b1916]">Privacy</Link>
            <Link href="/terms" className="hover:text-[#1b1916]">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
