import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      // Serve a clean markdown alternate for each article at /blog/{slug}.md without giving up
      // the pretty URL. The dot cannot be part of a path segment in the app directory, so the
      // suffix is stripped here and handled by a normal route handler.
      { source: "/blog/:slug.md", destination: "/blog-md/:slug" },
    ]
  },
};

export default nextConfig;
