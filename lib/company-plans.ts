// LinkedIn Company Page subscription plans (quota-based).
// A user buys one of these; it grants a quota of activatable Company Pages.
// Activation (app/api/linkedin/organizations/activate) is free within quota.

export type CompanyPlan = "single" | "two" | "unlimited"

export const COMPANY_PLAN_PRICES: Record<CompanyPlan, string> = {
  single: process.env.STRIPE_PRICE_COMPANY_PAGE_MONTHLY ?? "price_1TmAQN2Ve258Uiqt3Vy29MO8",
  two: process.env.STRIPE_PRICE_COMPANY_TWO_MONTHLY ?? "price_1TnzBI2Ve258UiqtIoMMuJ83",
  unlimited: process.env.STRIPE_PRICE_COMPANY_UNLIMITED_MONTHLY ?? "price_1TnzBJ2Ve258UiqtjZ1AMMsh",
}

export function isCompanyPlan(v: unknown): v is CompanyPlan {
  return v === "single" || v === "two" || v === "unlimited"
}

// How many Company Pages a given company-page plan entitles.
export function companyPlanQuota(plan: string | null | undefined): number {
  switch (plan) {
    case "single": return 1
    case "two": return 2
    case "unlimited": return Number.POSITIVE_INFINITY
    default: return 0
  }
}

// Total included Company Pages for a user = company-page plan quota + All-in's 1 free page.
export function totalCompanyPageQuota(user: {
  subscriptionStatus: string | null
  subscriptionPlan: string | null
  companyPagePlan: string | null
}): number {
  const planActive = user.subscriptionStatus === "active" || user.subscriptionStatus === "trialing" || user.subscriptionStatus === "past_due"
  const allInBonus = planActive && (user.subscriptionPlan === "allin" || user.subscriptionPlan === "allin_annual") ? 1 : 0
  return companyPlanQuota(user.companyPagePlan) + allInBonus
}
