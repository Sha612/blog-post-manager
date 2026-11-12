import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  agentRules: false,
  // Self-contained server for the Docker image (.next/standalone).
  output: "standalone",
  // Trace files from the monorepo root so workspace dependencies are included.
  outputFileTracingRoot: path.join(__dirname, "../.."),
  poweredByHeader: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
