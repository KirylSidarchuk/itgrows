CREATE TABLE "blog_posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"site_slug" text,
	"site_id" text,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"meta_description" text,
	"keyword" text,
	"keywords" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"cover_image_url" text,
	"published_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "blog_posts_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "connected_sites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"url" text NOT NULL,
	"platform" text NOT NULL,
	"site_token" text NOT NULL,
	"site_slug" text,
	"wp_username" text,
	"wp_app_password" text,
	"shopify_token" text,
	"shopify_blog_id" text,
	"webflow_token" text,
	"webflow_collection_id" text,
	"is_default" boolean DEFAULT false NOT NULL,
	"blog_domain" text,
	"blog_public_url" text,
	"webhook_url" text,
	"site_profile" jsonb,
	"last_checked_at" timestamp,
	"last_check_ok" boolean,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "connected_sites_site_token_unique" UNIQUE("site_token")
);
--> statement-breakpoint
CREATE TABLE "instagram_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"instagram_user_id" text,
	"username" text,
	"name" text,
	"profile_picture" text,
	"access_token" text NOT NULL,
	"token_expires_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "instagram_briefs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"niche" text,
	"tone" text DEFAULT 'professional',
	"goals" text,
	"target_audience" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "instagram_briefs_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "instagram_posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"instagram_account_id" uuid,
	"content" text NOT NULL,
	"image_url" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"scheduled_for" timestamp with time zone,
	"published_at" timestamp with time zone,
	"instagram_post_id" text,
	"publish_error" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "linkedin_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"linkedin_person_urn" text,
	"linkedin_org_urn" text,
	"access_token" text NOT NULL,
	"expires_at" timestamp,
	"page_type" text DEFAULT 'personal' NOT NULL,
	"page_name" text,
	"page_handle" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "linkedin_briefs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"niche" text,
	"tone" text DEFAULT 'professional',
	"goals" text,
	"company_name" text,
	"target_audience" text,
	"is_auto_filled" boolean DEFAULT false,
	"profile_url" text,
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "linkedin_briefs_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "linkedin_posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"linkedin_account_id" uuid,
	"content" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"scheduled_for" timestamp with time zone,
	"published_at" timestamp with time zone,
	"linkedin_post_id" text,
	"publish_error" text,
	"image_url" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "password_reset_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "scheduled_posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"keyword" text NOT NULL,
	"language" text DEFAULT 'en' NOT NULL,
	"tone" text DEFAULT 'Professional' NOT NULL,
	"scheduled_date" text NOT NULL,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"article_data" jsonb,
	"blog_post_slug" text,
	"cover_image_url" text,
	"published_at" timestamp,
	"publish_error" text,
	"publish_attempts" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"session_token" text NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "sessions_session_token_unique" UNIQUE("session_token")
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"type" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"article_data" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"password_hash" text,
	"email_verified" timestamp,
	"plan" text DEFAULT 'starter' NOT NULL,
	"plan_expiry" text,
	"onboarding_completed" boolean DEFAULT false NOT NULL,
	"stripe_customer_id" text,
	"subscription_status" text DEFAULT 'inactive',
	"subscription_plan" text,
	"subscription_end_date" timestamp,
	"cancel_at_period_end" boolean DEFAULT false,
	"cancel_at" timestamp,
	"trial_ends_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification_tokens" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "verification_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "connected_sites" ADD CONSTRAINT "connected_sites_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "instagram_accounts" ADD CONSTRAINT "instagram_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "instagram_posts" ADD CONSTRAINT "instagram_posts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "instagram_posts" ADD CONSTRAINT "instagram_posts_instagram_account_id_instagram_accounts_id_fk" FOREIGN KEY ("instagram_account_id") REFERENCES "public"."instagram_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "linkedin_accounts" ADD CONSTRAINT "linkedin_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "linkedin_posts" ADD CONSTRAINT "linkedin_posts_linkedin_account_id_linkedin_accounts_id_fk" FOREIGN KEY ("linkedin_account_id") REFERENCES "public"."linkedin_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheduled_posts" ADD CONSTRAINT "scheduled_posts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "blog_posts_user_id_idx" ON "blog_posts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "blog_posts_site_slug_idx" ON "blog_posts" USING btree ("site_slug");--> statement-breakpoint
CREATE INDEX "connected_sites_user_id_idx" ON "connected_sites" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "instagram_accounts_user_id_idx" ON "instagram_accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "instagram_posts_user_id_idx" ON "instagram_posts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "instagram_posts_status_idx" ON "instagram_posts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "linkedin_accounts_user_id_idx" ON "linkedin_accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "linkedin_posts_user_id_idx" ON "linkedin_posts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "linkedin_posts_status_idx" ON "linkedin_posts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "password_reset_tokens_user_id_idx" ON "password_reset_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "scheduled_posts_user_id_idx" ON "scheduled_posts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "scheduled_posts_status_idx" ON "scheduled_posts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "sessions_user_id_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "tasks_user_id_idx" ON "tasks" USING btree ("user_id");