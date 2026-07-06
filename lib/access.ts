export type PlanName = "personal" | "duo" | "allin" | "personal_annual" | "personal_annual_discount" | "duo_annual" | "allin_annual" | "company" | "company_annual"

export function hasAccess(user: {
  subscriptionStatus: string | null
  subscriptionPlan: string | null
  trialEndsAt: Date | null
}): boolean {
  // Access requires a real Stripe subscription (trialing counts — the trial is a
  // card-required Stripe trial now). The legacy cardless `trialEndsAt` grant was
  // removed: trials no longer exist without a Stripe subscription.
  const active = user.subscriptionStatus === "active" || user.subscriptionStatus === "past_due" || user.subscriptionStatus === "trialing"
  if (active && user.subscriptionPlan) {
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
    if (user.subscriptionPlan === "company" || user.subscriptionPlan === "company_annual") return 1
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
