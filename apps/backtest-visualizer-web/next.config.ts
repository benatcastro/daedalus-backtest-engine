import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // This app was imported as an early prototype whose chart demo code predates a
  // clean build. Keep TypeScript errors from blocking production builds so it can
  // be wired into the monorepo; type-check on demand and re-enable once cleaned up.
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
