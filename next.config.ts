import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/blog',
        destination: 'http://136.114.136.34:3001/',
      },
      {
        source: '/blog/:path*',
        destination: 'http://136.114.136.34:3001/:path*',
      },
    ]
  },
};

export default nextConfig;
