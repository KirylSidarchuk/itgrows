"use client"

import { useSession } from "next-auth/react"
import { useLocale, useT } from "@/components/i18n/LocaleProvider"
import { rewardUntil, useGuestReward } from "@/lib/geo-guest-reward"
import { rich } from "@/lib/i18n/rich"
import ns from "@/lib/i18n/messages/guestReward"
import wheel from "@/lib/i18n/messages/exitWheel"

// The reminder of a reward won on the website's wheel (components/geo/ExitWheelModal.tsx), for a
// signed-out visitor whose browser holds one that can still be claimed (lib/geo-guest-reward.ts): the
// reward, the date it is kept until, and what claims it. Nothing for anyone else, nor for a signed-in
// visitor (the account takes it in the cabinet), and nothing in the server HTML: it shows once the
// browser knows. Where (`where`):
//   "check":  under the quick check's form (app/business/AuditForm.tsx: the home page in every
//             language, /business/ai-visibility-checker), before a check: check the site, create the
//             free account.
//   "gate":   at the quick check's account offer (app/business/AiAnswers.tsx): it moves into the
//             account once the free report is ready.
//   "signup", "login": /signup and /login on the way to the AI-visibility cabinet.
// `onTint`: on a coloured card (a white note instead of a violet one). Texts:
// lib/i18n/messages/guestReward.ts; the reward's name from the wheel's own texts (exitWheel.ts). No
// prices: the rewards by name only.

export type GuestRewardPlace = "check" | "gate" | "signup" | "login"

function Gift() {
  return (
    <svg aria-hidden viewBox="0 0 20 20" fill="none" className="mt-0.5 h-4 w-4 shrink-0 text-violet-600">
      <rect x="2.75" y="7" width="14.5" height="3.75" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4.25 10.75v5.5a1 1 0 0 0 1 1h9.5a1 1 0 0 0 1-1v-5.5M10 7v10.25" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M10 7S9.1 3.25 6.9 3.25a1.75 1.75 0 0 0 0 3.5C8.2 6.75 10 7 10 7Zm0 0s.9-3.75 3.1-3.75a1.75 1.75 0 0 1 0 3.5C11.8 6.75 10 7 10 7Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function GuestRewardNote({
  where,
  onTint = false,
  className = "",
}: {
  where: GuestRewardPlace
  onTint?: boolean
  className?: string
}) {
  const { status } = useSession()
  const reward = useGuestReward(status === "unauthenticated")
  const m = useT(ns)
  const names = useT(wheel).rewards
  const locale = useLocale()
  if (!reward) return null
  const text = m[where](names[reward.id], rewardUntil(locale, reward.expiresAt))
  return (
    <p
      className={`flex items-start gap-2.5 rounded-xl border border-violet-200 px-3.5 py-2.5 text-left text-[13px] leading-snug text-[#1b1916] sm:text-sm ${
        onTint ? "bg-white" : "bg-violet-50"
      } ${className}`}
    >
      <Gift />
      <span className="min-w-0">{rich(text, { b: (c) => <b className="font-semibold">{c}</b> })}</span>
    </p>
  )
}
