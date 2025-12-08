import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Temporary: avoid ESLint circular JSON issue during production builds
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
