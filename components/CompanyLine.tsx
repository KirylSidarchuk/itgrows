// The company behind ItGrows, at the foot of our own public pages (Kiryl, 4 Nov 2026). The same words in
// every language, so it lives here and not in the messages. Client blogs (app/blog/sites) do not carry it.
export default function CompanyLine({ className = "", linkClassName = "hover:text-[#1b1916]" }: { className?: string; linkClassName?: string }) {
  return (
    <p className={`text-xs ${className}`}>
      Magiscan Inc. · 919 North Market Street, Wilmington, DE 19801, USA ·{" "}
      <a href="https://magiscan.app" className={`underline ${linkClassName}`}>magiscan.app</a>
    </p>
  )
}
