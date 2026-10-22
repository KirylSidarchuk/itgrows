import { permanentRedirect } from "next/navigation"

// /business was merged into "/" on 22 Oct 2026 (owner's decision): the check, the cases, the plan,
// the request form (#apply) and the questions all live there now. next.config.ts sends /business to
// "/" with a permanent redirect before this page is reached; this is the same answer, in case that
// rule is ever dropped. Only the exact path moves: /business/blog, the tools, the sample report and
// the cabinet under /business/* stay where they are.
export default function BusinessPage() {
  permanentRedirect("/")
}
