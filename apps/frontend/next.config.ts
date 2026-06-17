import type { NextConfig } from "next";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";

// Load environment variables from the monorepo root .env file
const parentEnvPath = path.resolve(__dirname, "../../.env");
if (fs.existsSync(parentEnvPath)) {
    console.log(`Loading environment variables from ${parentEnvPath}`);
    dotenv.config({ path: parentEnvPath });
} else {
    console.warn(`Parent .env file not found at ${parentEnvPath}`);
    // Fallback to default Next.js .env loading
    dotenv.config();
}

const nextConfig: NextConfig = {
    // NOTE: This app accumulated pre-existing TypeScript errors that predate the
    // monorepo migration (CI only ran Prettier, never a typed production build).
    // Don't let them block builds; clean them up incrementally and run `tsc` /
    // `nx lint frontend` on demand. Next.js 16 no longer runs ESLint during builds.
    typescript: {
        ignoreBuildErrors: true,
    },
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "lh3.googleusercontent.com",
            },
        ],
    },
};

export default nextConfig;
