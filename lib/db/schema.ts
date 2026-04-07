import { pgTable, text, timestamp, boolean, jsonb, uuid } from "drizzle-orm/pg-core"

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name"),
  passwordHash: text("password_hash"),
  emailVerified: timestamp("email_verified"),
  plan: text("plan").notNull().default("starter"),
  planExpiry: text("plan_expiry"),
  onboardingCompleted: boolean("onboarding_completed").default(false).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  sessionToken: text("session_token").notNull().unique(),
  expires: timestamp("expires").notNull(),
})

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
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

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
})

export const blogPosts = pgTable("blog_posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  siteSlug: text("site_slug"),
  siteId: text("site_id"),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  metaDescription: text("meta_description"),
  keywords: jsonb("keywords").notNull().default([]),
  coverImageUrl: text("cover_image_url"),
  publishedAt: timestamp("published_at").notNull().defaultNow(),
})

export const scheduledPosts = pgTable("scheduled_posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  keyword: text("keyword").notNull(),
  language: text("language").notNull().default("en"),
  tone: text("tone").notNull().default("Professional"),
  scheduledDate: text("scheduled_date").notNull(),
  status: text("status").notNull().default("scheduled"),
  articleData: jsonb("article_data"),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expires: timestamp("expires").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})
