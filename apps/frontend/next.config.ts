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
};

export default nextConfig;
