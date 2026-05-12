export type PlanName = "personal" | "duo" | "allin" | "personal_annual" | "personal_annual_discount" | "duo_annual" | "allin_annual"

export function hasAccess(user: {
  subscriptionStatus: string | null
  subscriptionPlan: string | null
  trialEndsAt: Date | null
}): boolean {
  const active = user.subscriptionStatus === "active" || user.subscriptionStatus === "past_due" || user.subscriptionStatus === "trialing"
  if (active && user.subscriptionPlan) {
    return true
  }
  if (user.trialEndsAt && user.trialEndsAt > new Date()) {
    return true
  }
  return false
}

export function getAccountSlots(user: {
  subscriptionStatus: string | null
  subscriptionPlan: string | null
  trialEndsAt: Date | null
}): number {
  const active = user.subscriptionStatus === "active" || user.subscriptionStatus === "past_due" || user.subscriptionStatus === "trialing"
  if (active) {
    if (user.subscriptionPlan === "allin" || user.subscriptionPlan === "allin_annual") return 3
    if (user.subscriptionPlan === "duo" || user.subscriptionPlan === "duo_annual") return 2
    if (user.subscriptionPlan === "personal" || user.subscriptionPlan === "personal_annual" || user.subscriptionPlan === "personal_annual_discount") return 1
  }
  if (user.trialEndsAt && user.trialEndsAt > new Date()) {
    return 1
  }
  return 0
}

export function getPostsPerWeek(user: {
  subscriptionStatus: string | null
  subscriptionPlan: string | null
  trialEndsAt: Date | null
}): number {
  const active = user.subscriptionStatus === "active" || user.subscriptionStatus === "past_due" || user.subscriptionStatus === "trialing"
  if (active) {
    if (user.subscriptionPlan === "allin" || user.subscriptionPlan === "duo" || user.subscriptionPlan === "allin_annual" || user.subscriptionPlan === "duo_annual") return 7
  }
  return 5
}
