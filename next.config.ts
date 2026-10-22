import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Image library files on the VM. Thumbnails in the library picker are resized
    // from these rather than downloading every full-size cover.
    remotePatterns: [{ protocol: "https", hostname: "blogs.itgrows.ai", pathname: "/images/**" }],
  },
  // Retired GEO-cabinet pages (21-22 Oct 2026): their addresses keep working and land on what replaced them.
  // Not permanent, so a page can come back at one of these paths later.
  async redirects() {
    const D = "/business/dashboard"
    return [
      // Ad clicks are for the LinkedIn/X product, which left "/" for /personal on 22 Oct 2026.
      { source: "/", has: [{ type: "query", key: "gclid" }], destination: "/personal", permanent: false },
      { source: "/", has: [{ type: "query", key: "gbraid" }], destination: "/personal", permanent: false },
      { source: "/", has: [{ type: "query", key: "wbraid" }], destination: "/personal", permanent: false },
      { source: "/", has: [{ type: "query", key: "gad_source" }], destination: "/personal", permanent: false },
      { source: "/", has: [{ type: "query", key: "utm_medium", value: "cpc" }], destination: "/personal", permanent: false },
      { source: `${D}/tasks`, destination: `${D}/visibility`, permanent: false },
      { source: `${D}/onboarding`, destination: `${D}/visibility`, permanent: false },
      { source: `${D}/new-task`, destination: `${D}/articles`, permanent: false },
      { source: `${D}/seo`, destination: `${D}/articles`, permanent: false },
      { source: `${D}/seo/:path*`, destination: `${D}/articles`, permanent: false },
      { source: `${D}/calendar`, destination: `${D}/articles`, permanent: false },
      { source: `${D}/blog`, destination: `${D}/articles`, permanent: false },
      { source: `${D}/billing`, destination: `${D}/plan`, permanent: false },
      { source: `${D}/subscription`, destination: `${D}/plan`, permanent: false },
      { source: `${D}/linkedin`, destination: "/cabinet", permanent: false },
    ]
  },
  async rewrites() {
    return [
      // Serve a clean markdown alternate for each article at /blog/{slug}.md without giving up
      // the pretty URL. The dot cannot be part of a path segment in the app directory, so the
      // suffix is stripped here and handled by a normal route handler.
      { source: "/blog/:slug.md", destination: "/blog-md/:slug" },
      { source: "/business/blog/:slug.md", destination: "/business-blog-md/:slug" },
    ]
  },
};

export default nextConfig;
