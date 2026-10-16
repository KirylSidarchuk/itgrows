import { pgTable, text, timestamp, boolean, jsonb, uuid, integer, date } from "drizzle-orm/pg-core"

// Reddit engine tables. Created by hand (SQL kept with the worker on itgrows-vm at
// /root/reddit_engine/schema.sql) and shared with that worker, which does all the reading and
// planning. This app only creates projects, collects the owner's answers and records what the
// person did with each task. Kept out of lib/db/schema.ts so the two can change independently.

export const redditBetaUsers = pgTable("reddit_beta_users", {
  email: text("email").primaryKey(),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export const redditProjects = pgTable("reddit_projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  siteUrl: text("site_url").notNull(),
  goal: text("goal").notNull(),
  // analyzing -> questions -> active; paused and error on the side
  status: text("status").notNull().default("analyzing"),
  profile: jsonb("profile"),
  questions: jsonb("questions"),
  answers: jsonb("answers"),
  redditUsername: text("reddit_username"),
  strategy: jsonb("strategy"),
  strategyAt: timestamp("strategy_at", { withTimezone: true }),
  lastRunAt: timestamp("last_run_at", { withTimezone: true }),
  error: text("error"),
  // Telegram group where the worker posts the team's day, removals and the weekly summary.
  teamChatId: text("team_chat_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

// People who work a project besides its owner, each from their own Reddit account and in their
// own communities. Being listed here is also what lets them into the closed beta.
export const redditProjectMembers = pgTable("reddit_project_members", {
  projectId: uuid("project_id").notNull(),
  email: text("email").notNull(),
  redditUsername: text("reddit_username"),
  communities: text("communities").array().notNull().default([]),
  accountNote: text("account_note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export const redditThreads = pgTable("reddit_threads", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id").notNull(),
  redditId: text("reddit_id").notNull(),
  url: text("url").notNull(),
  subreddit: text("subreddit"),
  title: text("title"),
  postedEst: date("posted_est"),
  status: text("status").notNull().default("new"),
  details: jsonb("details"),
  firstSeen: timestamp("first_seen", { withTimezone: true }).notNull().defaultNow(),
})

export const redditPlans = pgTable("reddit_plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id").notNull(),
  day: date("day").notNull(),
  summary: text("summary"),
  skipped: jsonb("skipped"),
  stats: jsonb("stats"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export const redditTasks = pgTable("reddit_tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id").notNull(),
  threadId: uuid("thread_id"),
  day: date("day").notNull(),
  kind: text("kind").notNull(),
  priority: text("priority").notNull().default("P2"),
  subreddit: text("subreddit"),
  title: text("title"),
  url: text("url"),
  why: text("why"),
  draft: text("draft"),
  checks: jsonb("checks"),
  mentionsBrand: boolean("mentions_brand").notNull().default(false),
  // On a team project each task belongs to one person, so two people never land in one thread.
  assigneeEmail: text("assignee_email"),
  doneByEmail: text("done_by_email"),
  // todo | done | skipped
  status: text("status").notNull().default("todo"),
  doneUrl: text("done_url"),
  doneAt: timestamp("done_at", { withTimezone: true }),
  skipReason: text("skip_reason"),
  // pending | visible | removed | not_found — set by the worker the day after "done"
  verifyStatus: text("verify_status"),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  verifyAttempts: integer("verify_attempts").notNull().default(0),
  result: jsonb("result"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

// What the team has learned about a community. Shown to everyone on the project and read by the
// planner before it writes the next day's tasks.
export const redditNotes = pgTable("reddit_notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id").notNull(),
  subreddit: text("subreddit"),
  body: text("body").notNull(),
  authorEmail: text("author_email").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

// A link the owner sends so people join the team themselves and fill in their own account.
export const redditInvites = pgTable("reddit_invites", {
  token: text("token").primaryKey(),
  projectId: uuid("project_id").notNull(),
  createdBy: text("created_by").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  revoked: boolean("revoked").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})
