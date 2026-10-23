import { Fragment, isValidElement, type ReactNode } from "react"

// Inline markup inside a translated sentence. Word order differs between languages, so a link or
// a bold word cannot be glued between two strings in code; the message carries simple tags and
// the code says what each tag renders as:
//
//   en: { crawlerTip: "Check that crawlers can read you: <link>AI crawler check</link>." }
//   {rich(m.crawlerTip, { link: (c) => <LocaleLink href="/business/ai-crawler-checker">{c}</LocaleLink> })}
//
// Tags have no attributes: <b>, <code>, <link>, <link2>… and self-closing <br/>. They may nest.
// A tag without a renderer shows its text only. Works in server and client components.

type Render = (chunks: ReactNode) => ReactNode

const TAG_SOURCE = String.raw`<(\/)?([a-zA-Z][\w-]*)\s*(\/)?>`

export function rich(message: string, tags: Readonly<Record<string, Render>> = {}): ReactNode {
  type Frame = { name: string; raw: string; children: ReactNode[] }
  const stack: Frame[] = [{ name: "", raw: "", children: [] }]
  let key = 0
  let last = 0
  const keyed = (node: ReactNode): ReactNode =>
    isValidElement(node) || Array.isArray(node) ? <Fragment key={key++}>{node}</Fragment> : node
  const unwrap = (children: ReactNode[]): ReactNode => (children.length === 1 ? children[0] : children)

  // A regex of its own per call: a renderer may call rich() again while this loop runs.
  const TAG = new RegExp(TAG_SOURCE, "g")
  for (let m = TAG.exec(message); m; m = TAG.exec(message)) {
    const [raw, closing, name, selfClosing] = m
    const top = stack[stack.length - 1]
    if (m.index > last) top.children.push(message.slice(last, m.index))
    last = m.index + raw.length
    if (selfClosing) {
      const render = tags[name]
      top.children.push(keyed(render ? render(null) : null))
    } else if (!closing) {
      stack.push({ name, raw, children: [] })
    } else if (stack.length > 1 && top.name === name) {
      stack.pop()
      const render = tags[name]
      const inner = unwrap(top.children)
      stack[stack.length - 1].children.push(keyed(render ? render(inner) : inner))
    } else {
      top.children.push(raw)
    }
  }
  const rest = stack[stack.length - 1]
  if (last < message.length) rest.children.push(message.slice(last))
  // Unclosed tags: keep their text, drop nothing.
  while (stack.length > 1) {
    const open = stack.pop()!
    stack[stack.length - 1].children.push(open.raw, ...open.children)
  }
  return unwrap(stack[0].children)
}
