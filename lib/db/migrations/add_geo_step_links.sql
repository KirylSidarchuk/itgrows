-- Links an article to the question of the AI-visibility plan it answers (23 Oct 2026), so an Article
-- step of "Your plan" (/business/dashboard/visibility) can say what happened to it: lib/geo-report.ts
-- reads these for a client's own site only. geo_domain is the site as geo_sites.domain spells it
-- ("itgrows.ai", "itgrows.ai#de"); geo_question is the question word for word as the day-0 report
-- asks it. Both are stamped where a topic is chosen for a plan question, never by the writer: it
-- replaces article_data whole, which is why this is a column and not a field there. Null for every
-- other article; nothing is ever linked by a similar title, only by the question itself.
--
-- Additive and nullable, so safe while the app runs. The two tables belong to postgres, not to the
-- app's user:
--   sudo -u postgres psql -d itgrows_db -v ON_ERROR_STOP=1 -1 < lib/db/migrations/add_geo_step_links.sql
SET lock_timeout = '5s';
ALTER TABLE scheduled_posts ADD COLUMN IF NOT EXISTS geo_domain text, ADD COLUMN IF NOT EXISTS geo_question text;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS geo_domain text, ADD COLUMN IF NOT EXISTS geo_question text;
CREATE INDEX IF NOT EXISTS scheduled_posts_geo_domain_idx ON scheduled_posts (geo_domain);
CREATE INDEX IF NOT EXISTS blog_posts_geo_domain_idx ON blog_posts (geo_domain);
-- One queued article per question of a site's plan for a user (added the same day). seed-geo
-- (/root/blog_engine/client_writer.py) looks before it queues, but two runs at once would both find
-- nothing and both insert; with this index the second insert does nothing (ON CONFLICT DO NOTHING).
-- Rows without a plan question are not in it.
CREATE UNIQUE INDEX IF NOT EXISTS scheduled_posts_geo_question_key
  ON scheduled_posts (user_id, geo_domain, geo_question) WHERE geo_question IS NOT NULL;
