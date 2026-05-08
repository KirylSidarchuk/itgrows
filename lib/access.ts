export function hasAccess(user: {
  subscriptionStatus: string | null
  subscriptionPlan: string | null
  trialEndsAt: Date | null
}): boolean {
  if (
    (user.subscriptionStatus === "active" || user.subscriptionStatus === "past_due") &&
    (user.subscriptionPlan === "personal" || user.subscriptionPlan === "personal_annual")
  ) {
    return true
  }
  if (user.trialEndsAt && user.trialEndsAt > new Date()) {
    return true
  }
  return false
}
