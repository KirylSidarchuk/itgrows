import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { connectedSites, blogPosts } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token")

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/javascript; charset=utf-8",
    "Cache-Control": "public, max-age=300",
  }

  if (!token) {
    const errorJs = `console.error('[ItGrows] Missing token parameter');`
    return new Response(errorJs, { status: 400, headers: corsHeaders })
  }

  // Look up site by token
  const sites = await db
    .select()
    .from(connectedSites)
    .where(eq(connectedSites.siteToken, token))
    .limit(1)

  if (!sites.length) {
    const errorJs = `console.error('[ItGrows] Invalid token');`
    return new Response(errorJs, { status: 404, headers: corsHeaders })
  }

  const site = sites[0]

  // Fetch published blog posts for this site
  const posts = await db
    .select({
      slug: blogPosts.slug,
      title: blogPosts.title,
      metaDescription: blogPosts.metaDescription,
      publishedAt: blogPosts.publishedAt,
      coverImageUrl: blogPosts.coverImageUrl,
    })
    .from(blogPosts)
    .where(eq(blogPosts.siteSlug, site.siteSlug ?? ""))
    .orderBy(desc(blogPosts.publishedAt))
    .limit(20)

  // Determine blog base URL
  const blogBase = site.blogDomain
    ? site.blogDomain.replace(/\/$/, "")
    : `https://itgrows.ai/blog/${site.siteSlug}`

  type ArticleData = {
    title: string
    excerpt: string
    url: string
    date: string
    image: string | null
  }

  const articles: ArticleData[] = posts.map((p) => ({
    title: p.title,
    excerpt: p.metaDescription ?? "",
    url: `${blogBase}/${p.slug}`,
    date: p.publishedAt.toISOString().split("T")[0],
    image: p.coverImageUrl ?? null,
  }))

  const js = `
(function() {
  var articles = ${JSON.stringify(articles)};

  var container = document.getElementById('itgrows-blog') || document.querySelector('[data-itgrows]');
  if (!container) {
    console.warn('[ItGrows] No container found. Add <div id="itgrows-blog"></div> to your page.');
    return;
  }

  var styles = [
    '.itgrows-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 24px; font-family: inherit; }',
    '.itgrows-article { border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; background: #fff; transition: box-shadow 0.2s; }',
    '.itgrows-article:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.10); }',
    '.itgrows-article-img { width: 100%; height: 180px; object-fit: cover; display: block; }',
    '.itgrows-article-body { padding: 16px; }',
    '.itgrows-article h3 { margin: 0 0 8px; font-size: 1rem; line-height: 1.4; }',
    '.itgrows-article h3 a { color: inherit; text-decoration: none; }',
    '.itgrows-article h3 a:hover { text-decoration: underline; }',
    '.itgrows-article p { margin: 0 0 12px; font-size: 0.875rem; color: #6b7280; line-height: 1.5; }',
    '.itgrows-article-footer { display: flex; justify-content: space-between; align-items: center; }',
    '.itgrows-article small { font-size: 0.75rem; color: #9ca3af; }',
    '.itgrows-read-more { font-size: 0.8rem; color: #2563eb; text-decoration: none; font-weight: 500; }',
    '.itgrows-read-more:hover { text-decoration: underline; }',
  ].join('');

  var html = '<style>' + styles + '</style><div class="itgrows-grid">' +
    articles.map(function(a) {
      var img = a.image ? '<img class="itgrows-article-img" src="' + a.image + '" alt="' + a.title.replace(/"/g, '&quot;') + '" loading="lazy">' : '';
      var excerpt = a.excerpt ? '<p>' + a.excerpt + '</p>' : '';
      return '<div class="itgrows-article">' +
        img +
        '<div class="itgrows-article-body">' +
        '<h3><a href="' + a.url + '" target="_blank" rel="noopener">' + a.title + '</a></h3>' +
        excerpt +
        '<div class="itgrows-article-footer">' +
        '<small>' + a.date + '</small>' +
        '<a class="itgrows-read-more" href="' + a.url + '" target="_blank" rel="noopener">Read more &rarr;</a>' +
        '</div>' +
        '</div>' +
        '</div>';
    }).join('') +
  '</div>';

  container.innerHTML = html;
})();
`.trim()

  return new Response(js, { status: 200, headers: corsHeaders })
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  })
}
