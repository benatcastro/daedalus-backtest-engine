import type { NextConfig } from "next";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";

// Load environment variables from the parent directory's .env file
const parentEnvPath = path.resolve(__dirname, "../.env");
if (fs.existsSync(parentEnvPath)) {
    console.log(`Loading environment variables from ${parentEnvPath}`);
    dotenv.config({ path: parentEnvPath });
} else {
    console.warn(`Parent .env file not found at ${parentEnvPath}`);
    // Fallback to default Next.js .env loading
    dotenv.config();
}

const nextConfig: NextConfig = {
    /* config options here */
    images: {
        domains: ["lh3.googleusercontent.com"],
    },
};

export default nextConfig;
