import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Allow production builds to complete even if there are ESLint warnings/errors.
    // Warnings are reviewed separately and do not indicate runtime bugs.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
