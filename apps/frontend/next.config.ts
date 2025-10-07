import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'storage.opencourse.id',
        port: '',
        pathname: '/public/**',
      },
    ],
  },
  output: 'standalone',
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  trailingSlash: false,
  skipTrailingSlashRedirect: true,
  // Force all pages to be dynamic to avoid static generation issues
  generateEtags: false,
  // Disable static generation
  experimental: {
    // No static generation
  },
};

export default nextConfig;
