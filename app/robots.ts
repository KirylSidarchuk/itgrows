import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/blog/", "/blog/*"],
        disallow: [
          "/api/",
          "/dashboard/",
          "/cabinet/",
          "/business/dashboard/",
          "/personal/cabinet/",
          "/login",
          "/signup",
          "/forgot-password",
          "/reset-password",
          "/welcome",
          "/personal/welcome",
          "/subscribe-discount",
          "/aso",
        ],
      },
    ],
    sitemap: "https://www.itgrows.ai/sitemap.xml",
  }
}
