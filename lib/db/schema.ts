import { pgTable, text, timestamp, boolean, jsonb, uuid, index, integer, serial } from "drizzle-orm/pg-core"

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name"),
  passwordHash: text("password_hash"),
  emailVerified: timestamp("email_verified"),
  plan: text("plan").notNull().default("starter"),
  planExpiry: text("plan_expiry"),
  onboardingCompleted: boolean("onboarding_completed").default(false).notNull(),
  stripeCustomerId: text("stripe_customer_id"),
  subscriptionStatus: text("subscription_status").default("inactive"),
  subscriptionPlan: text("subscription_plan"),
  subscriptionEndDate: timestamp("subscription_end_date"),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
  cancelAt: timestamp("cancel_at"),
  trialEndsAt: timestamp("trial_ends_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  sessionToken: text("session_token").notNull().unique(),
  expires: timestamp("expires").notNull(),
}, (t) => [index("sessions_user_id_idx").on(t.userId)])

export const verificationTokens = pgTable("verification_tokens", {
  identifier: text("identifier").notNull(),
  token: text("token").notNull().unique(),
  expires: timestamp("expires").notNull(),
})

export const connectedSites = pgTable("connected_sites", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  url: text("url").notNull(),
  platform: text("platform").notNull(),
  siteToken: text("site_token").notNull().unique(),
  siteSlug: text("site_slug"),
  wpUsername: text("wp_username"),
  wpAppPassword: text("wp_app_password"),
  shopifyToken: text("shopify_token"),
  shopifyBlogId: text("shopify_blog_id"),
  webflowToken: text("webflow_token"),
  webflowCollectionId: text("webflow_collection_id"),
  isDefault: boolean("is_default").notNull().default(false),
  blogDomain: text("blog_domain"),
  blogPublicUrl: text("blog_public_url"),
  webhookUrl: text("webhook_url"),
  siteProfile: jsonb("site_profile"),
  lastCheckedAt: timestamp("last_checked_at"),
  lastCheckOk: boolean("last_check_ok"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [index("connected_sites_user_id_idx").on(t.userId)])

export const tasks = pgTable("tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  type: text("type").notNull(),
  status: text("status").notNull().default("pending"),
  articleData: jsonb("article_data"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [index("tasks_user_id_idx").on(t.userId)])

export const blogPosts = pgTable("blog_posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  siteSlug: text("site_slug"),
  siteId: text("site_id"),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  metaDescription: text("meta_description"),
  keyword: text("keyword"),
  keywords: jsonb("keywords").notNull().default([]),
  coverImageUrl: text("cover_image_url"),
  publishedAt: timestamp("published_at").notNull().defaultNow(),
}, (t) => [index("blog_posts_user_id_idx").on(t.userId), index("blog_posts_site_slug_idx").on(t.siteSlug)])

export const scheduledPosts = pgTable("scheduled_posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  keyword: text("keyword").notNull(),
  language: text("language").notNull().default("en"),
  tone: text("tone").notNull().default("Professional"),
  scheduledDate: text("scheduled_date").notNull(),
  status: text("status").notNull().default("scheduled"),
  articleData: jsonb("article_data"),
  blogPostSlug: text("blog_post_slug"),
  coverImageUrl: text("cover_image_url"),
  publishedAt: timestamp("published_at"),
  publishError: text("publish_error"),
  publishAttempts: integer("publish_attempts").default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [index("scheduled_posts_user_id_idx").on(t.userId), index("scheduled_posts_status_idx").on(t.status)])

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expires: timestamp("expires").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [index("password_reset_tokens_user_id_idx").on(t.userId)])

export const linkedinAccounts = pgTable("linkedin_accounts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  linkedinPersonUrn: text("linkedin_person_urn"),
  linkedinOrgUrn: text("linkedin_org_urn"),
  accessToken: text("access_token").notNull(),
  expiresAt: timestamp("expires_at"),
  pageType: text("page_type").notNull().default("personal"),
  pageName: text("page_name"),
  pageHandle: text("page_handle"),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => [index("linkedin_accounts_user_id_idx").on(t.userId)])

export const linkedinPosts = pgTable("linkedin_posts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  linkedinAccountId: uuid("linkedin_account_id").references(() => linkedinAccounts.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  status: text("status").notNull().default("draft"), // draft | scheduled | published | failed
  scheduledFor: timestamp("scheduled_for", { withTimezone: true }),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  linkedinPostId: text("linkedin_post_id"),
  publishError: text("publish_error"),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (t) => [index("linkedin_posts_user_id_idx").on(t.userId), index("linkedin_posts_status_idx").on(t.status)])

export const linkedinBriefs = pgTable("linkedin_briefs", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull().unique(),
  niche: text("niche"),
  tone: text("tone").default("professional"),
  goals: text("goals"),
  companyName: text("company_name"),
  targetAudience: text("target_audience"),
  isAutoFilled: boolean("is_auto_filled").default(false),
  profileUrl: text("profile_url"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
})

export const instagramAccounts = pgTable("instagram_accounts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  instagramUserId: text("instagram_user_id"),
  username: text("username"),
  name: text("name"),
  profilePicture: text("profile_picture"),
  accessToken: text("access_token").notNull(),
  tokenExpiresAt: timestamp("token_expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (t) => [index("instagram_accounts_user_id_idx").on(t.userId)])

export const instagramBriefs = pgTable("instagram_briefs", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull().unique(),
  niche: text("niche"),
  tone: text("tone").default("professional"),
  goals: text("goals"),
  targetAudience: text("target_audience"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

export const instagramPosts = pgTable("instagram_posts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  instagramAccountId: uuid("instagram_account_id").references(() => instagramAccounts.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  imageUrl: text("image_url"),
  status: text("status").notNull().default("draft"), // draft | scheduled | published | failed
  scheduledFor: timestamp("scheduled_for", { withTimezone: true }),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  instagramPostId: text("instagram_post_id"),
  publishError: text("publish_error"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
}, (t) => [index("instagram_posts_user_id_idx").on(t.userId), index("instagram_posts_status_idx").on(t.status)])

export const ghostModeLogs = pgTable("ghost_mode_logs", {
  id: serial("id").primaryKey(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  success: boolean("success").notNull(),
  error: text("error"),
  durationMs: integer("duration_ms"),
  ip: text("ip"),
})
