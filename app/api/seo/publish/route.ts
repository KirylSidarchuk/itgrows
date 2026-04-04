import { NextRequest, NextResponse } from "next/server"

interface Article {
  title: string
  content: string
  metaDescription?: string
  keywords?: string[]
}

interface WordPressCredentials {
  siteUrl: string
  username: string
  appPassword: string
}

interface ShopifyCredentials {
  storeUrl: string
  accessToken: string
  blogId: string
}

interface WebflowCredentials {
  apiToken: string
  collectionId: string
}

type PublishRequest =
  | { platform: "wordpress"; credentials: WordPressCredentials; article: Article }
  | { platform: "shopify"; credentials: ShopifyCredentials; article: Article }
  | { platform: "webflow"; credentials: WebflowCredentials; article: Article }

async function publishWordPress(
  credentials: WordPressCredentials,
  article: Article
): Promise<{ success: boolean; url: string; postId: string }> {
  const { siteUrl, username, appPassword } = credentials

  const base = siteUrl.replace(/\/$/, "")
  const token = Buffer.from(`${username}:${appPassword}`).toString("base64")

  const body: Record<string, unknown> = {
    title: article.title,
    content: article.content,
    status: "publish",
  }

  if (article.metaDescription) {
    body.excerpt = article.metaDescription
  }

  const response = await fetch(`${base}/wp-json/wp/v2/posts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${token}`,
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`WordPress API error ${response.status}: ${errText}`)
  }

  const data = await response.json() as { id: number; link: string }

  return {
    success: true,
    url: data.link ?? "",
    postId: String(data.id),
  }
}

async function publishShopify(
  credentials: ShopifyCredentials,
  article: Article
): Promise<{ success: boolean; url: string; postId: string }> {
  const { storeUrl, accessToken, blogId } = credentials

  const base = storeUrl.replace(/\/$/, "")
  const endpoint = `${base}/admin/api/2024-01/blogs/${blogId}/articles.json`

  const body = {
    article: {
      title: article.title,
      body_html: article.content,
      summary_html: article.metaDescription ?? "",
      published: true,
      tags: article.keywords?.join(", ") ?? "",
    },
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": accessToken,
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`Shopify API error ${response.status}: ${errText}`)
  }

  const data = await response.json() as { article: { id: number; url: string; handle: string } }
  const articleData = data.article

  const articleUrl = articleData.url ?? `${base}/blogs/${blogId}/${articleData.handle}`

  return {
    success: true,
    url: articleUrl,
    postId: String(articleData.id),
  }
}

async function publishWebflow(
  credentials: WebflowCredentials,
  article: Article
): Promise<{ success: boolean; url: string; postId: string }> {
  const { apiToken, collectionId } = credentials

  const body = {
    isArchived: false,
    isDraft: false,
    fieldData: {
      name: article.title,
      slug: article.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, ""),
      "post-body": article.content,
      "post-summary": article.metaDescription ?? "",
    },
  }

  const response = await fetch(
    `https://api.webflow.com/v2/collections/${collectionId}/items`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiToken}`,
        accept: "application/json",
      },
      body: JSON.stringify(body),
    }
  )

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`Webflow API error ${response.status}: ${errText}`)
  }

  const data = await response.json() as { id: string; fieldData?: { slug?: string } }

  return {
    success: true,
    url: `https://webflow.com/item/${data.id}`,
    postId: data.id,
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as PublishRequest

    const { platform, credentials, article } = body

    if (!platform || !credentials || !article) {
      return NextResponse.json(
        { error: "platform, credentials, and article are required" },
        { status: 400 }
      )
    }

    let result: { success: boolean; url: string; postId: string }

    if (platform === "wordpress") {
      result = await publishWordPress(credentials as WordPressCredentials, article)
    } else if (platform === "shopify") {
      result = await publishShopify(credentials as ShopifyCredentials, article)
    } else if (platform === "webflow") {
      result = await publishWebflow(credentials as WebflowCredentials, article)
    } else {
      return NextResponse.json({ error: `Unknown platform: ${platform}` }, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
