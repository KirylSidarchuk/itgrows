// FAQ block plus its FAQPage markup, from one list so the two never drift apart.
export interface QA {
  q: string
  a: string
}

export function faqSchema(items: QA[]) {
  return {
    "@type": "FAQPage",
    mainEntity: items.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  }
}

export default function Faq({ items }: { items: QA[] }) {
  return (
    <section className="mt-12">
      <h2 className="text-2xl font-extrabold tracking-tight mb-5">Frequently Asked Questions</h2>
      <div className="space-y-5">
        {items.map((f) => (
          <div key={f.q}>
            <h3 className="font-bold">{f.q}</h3>
            <p className="text-slate-700 mt-1 leading-relaxed">{f.a}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
